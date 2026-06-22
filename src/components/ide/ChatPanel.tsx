// src/components/ide/ChatPanel.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, GitCommit, FolderOpen, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AgentPipeline, { AgentStep } from "./AgentPipeline";
import { createClient } from "@/lib/supabase/client";
import { getChanges, storeCommit, storeSnapshot, Commit } from "@/lib/ide/brain/commit-tracker";

// ── Types ────────────────────────────────────────
interface ChatPanelProps {
  activeFile: string | null;
  fileContent: string;
  onFileWrite: (path: string, content: string) => void;
  onImmediateSave?: (path: string, content: string) => void;
  allFiles?: Record<string, string>;
  openFiles?: string[];
  recentEdits?: { path: string; timestamp: number }[];
  cursorPosition?: { line: number; column: number } | null;
  currentErrors?: string[];
  useFileSystem?: boolean;
  projectName?: string;
  drive?: string;
  directory?: string;
  folderStructure?: string;
  isProjectEmpty?: boolean;
  onFileDrop?: (paths: string[]) => void;
}

// Exported FileBlock interface (needed by page.tsx)
export interface FileBlock {
  path: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "error";
  _needsRename?: boolean;
  type?: "file" | "diff";
}

type Mode = "ask" | "plan" | "agent";

const USER_FACING_STEPS: AgentStep[] = [
  { key: "scanning",   label: "Analyzing workspace…",  status: "pending" },
  { key: "detecting",  label: "Detecting intent…",     status: "pending" },
  { key: "planning",   label: "Planning…",             status: "pending" },
  { key: "writing",    label: "Writing code…",         status: "pending" },
  { key: "checking",   label: "Reviewing…",            status: "pending" },
  { key: "done",       label: "Complete",              status: "pending" },
];

// ── Extract relevant content from file based on user request ──
function extractRelevantContent(userRequest: string, fileContent: string, filePath: string): string {
  const lines = fileContent.split("\n");
  const request = userRequest.toLowerCase();
  const fileName = filePath.toLowerCase();

  // Keywords to search for relevance
  const keywords = request
    .split(/\s+/)
    .filter(word => word.length > 3 && !["that", "this", "with", "from", "what", "need", "want", "make", "help", "file"].includes(word));

  let relevantLineIndices: Set<number> = new Set();

  // If file is small (< 50 lines), return it all
  if (lines.length <= 50) {
    return fileContent;
  }

  // Strategy 1: Look for imports/exports and matching keywords in those sections
  lines.forEach((line, idx) => {
    const lineLower = line.toLowerCase();
    // Always include imports/exports at the top
    if (lineLower.includes("import ") || lineLower.includes("export ")) {
      relevantLineIndices.add(idx);
    }
    // Check for keyword matches
    for (const keyword of keywords) {
      if (lineLower.includes(keyword)) {
        // Add this line and context (±2 lines)
        for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 2); i++) {
          relevantLineIndices.add(i);
        }
        break;
      }
    }
  });

  // Strategy 2: If file has function/class definitions, include them
  const functionPattern = /^\s*(export\s+)?(async\s+)?(function|const|class)\s+(\w+)/i;
  lines.forEach((line, idx) => {
    if (functionPattern.test(line)) {
      // Include function definition and a few lines after
      for (let i = idx; i <= Math.min(lines.length - 1, idx + 5); i++) {
        relevantLineIndices.add(i);
      }
    }
  });

  // Strategy 3: Include file header comments (first 10 lines typically)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].trim().startsWith("//") || lines[i].trim().startsWith("*") || lines[i].trim().startsWith("/*")) {
      relevantLineIndices.add(i);
    }
  }

  // If we found relevant lines, return them; otherwise return first 30 lines
  if (relevantLineIndices.size > 0) {
    const sortedIndices = Array.from(relevantLineIndices).sort((a, b) => a - b);
    const relevantLines = sortedIndices.map(idx => lines[idx]);
    
    // Limit output to first 50 relevant lines max
    return relevantLines.slice(0, 50).join("\n");
  }

  // Fallback: return first 30 lines
  return lines.slice(0, 30).join("\n");
}

export default function ChatPanel({
  activeFile,
  fileContent,
  onFileWrite,
  onImmediateSave,
  allFiles,
  openFiles,
  recentEdits,
  cursorPosition,
  currentErrors,
  useFileSystem = false,
  projectName,
  drive,
  directory,
  folderStructure,
  isProjectEmpty,
  onFileDrop,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("ask");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Drag & drop & tooltip state ──────────────────
  const [showTooltip, setShowTooltip] = useState(true);
  const [droppedFiles, setDroppedFiles] = useState<string[]>([]);
  const [showFolderStructure, setShowFolderStructure] = useState(false);
  const [storedStructure, setStoredStructure] = useState<string>("");
  const supabase = createClient();

  // ── Token usage state ─────────────────────────────
  const [tokenUsage, setTokenUsage] = useState({ used: 0, limit: 10000, resetAt: "" });
  const [timeLeft, setTimeLeft] = useState("");

  // Auto‑hide tooltip after 5 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  // ── Pipeline steps for thinking indicator ────────
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>(USER_FACING_STEPS);
  const [pipelineExpanded, setPipelineExpanded] = useState(true);
  const stepsRef = useRef(pipelineSteps);
  stepsRef.current = pipelineSteps;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, pipelineSteps]);

  // ── Fetch token usage ────────────────────────────
  const fetchTokenUsage = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("ide_token_usage")
      .select("tokens_used, reset_at")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setTokenUsage(prev => ({ ...prev, used: data.tokens_used, resetAt: data.reset_at }));
      const now = new Date();
      const resetTime = new Date(data.reset_at);
      const diff = 24 * 60 * 60 * 1000 - (now.getTime() - resetTime.getTime());
      if (diff > 0 && data.tokens_used >= 10000) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${h}h ${m}m`);
      } else {
        setTimeLeft("");
      }
    }
  }, []);

  useEffect(() => {
    fetchTokenUsage();
    const interval = setInterval(fetchTokenUsage, 30000);
    return () => clearInterval(interval);
  }, [fetchTokenUsage]);

  const isTokenExhausted = tokenUsage.used >= tokenUsage.limit && timeLeft !== "";

  // ── Commit message generation (kept from original) ──
  const handleGenerateCommit = async () => {
    if (!allFiles) return;
    const changes = await getChanges(allFiles);
    if (!changes.added.length && !changes.modified.length && !changes.deleted.length) {
      alert("No changes to commit.");
      return;
    }
    const commitPrompt = buildCommitPrompt(changes.diffSummary);

    const response = await fetch("/api/ide-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: commitPrompt }],
        mode: "ask",
        activeFile: null,
        fileContent: "",
        files: allFiles,
        projectFiles: Object.keys(allFiles),
      }),
    });

    if (!response.ok) {
      console.error("Commit generation failed");
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value);
    }

    const mainMatch = fullText.match(/Main:\s*\n?([\s\S]*?)(?=\n\nAlternatives:|$)/);
    const altMatch = fullText.match(/Alternatives:\s*\n([\s\S]*)$/);
    const main = mainMatch?.[1]?.trim() || "chore: update project files";
    const alternatives = altMatch
      ? altMatch[1].split("\n").filter(line => line.trim()).map(line => line.replace(/^-\s*/, "").trim())
      : [];
    alert(`Commit message:\n${main}\n\nAlternatives:\n${alternatives.join("\n")}`);
  };

  // ── Pipeline advancement helper ─────────────────
  const advanceUserFacingPipeline = useCallback((charCount: number, foundFileBlocks: boolean) => {
    setPipelineSteps(prev => {
      const newSteps = [...prev];
      if (charCount > 10 && newSteps[0].status === "working") {
        newSteps[0] = { ...newSteps[0], status: "done" };
        newSteps[1] = { ...newSteps[1], status: "working" };
      }
      if (charCount > 50 && newSteps[1].status === "working") {
        newSteps[1] = { ...newSteps[1], status: "done" };
        newSteps[2] = { ...newSteps[2], status: "working" };
      }
      if (charCount > 200 && newSteps[2].status === "working") {
        newSteps[2] = { ...newSteps[2], status: "done" };
        newSteps[3] = { ...newSteps[3], status: "working" };
      }
      if ((foundFileBlocks || charCount > 600) && newSteps[3].status === "working") {
        newSteps[3] = { ...newSteps[3], status: "done" };
        newSteps[4] = { ...newSteps[4], status: "working" };
      }
      return newSteps;
    });
  }, []);

  // ── Main send handler ────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isLoading || isTokenExhausted) return;
    
    // Build file context with relevant content
    let fileContext = "";
    if (droppedFiles.length > 0) {
      fileContext = "\n\n### File Context:\n";
      for (const filePath of droppedFiles) {
        const content = allFiles?.[filePath] || "";
        if (content) {
          // Extract relevant content based on user request
          const relevantContent = extractRelevantContent(input, content, filePath);
          fileContext += `\n**File: \`${filePath}\`**\n\`\`\`\n${relevantContent}\n\`\`\``;
        }
      }
    }

    // Full message with file context for API
    const userContent = input + fileContext;
    
    // Display message shows only user input (without file context for cleaner UI)
    const displayMsg = { role: "user", content: input };
    setMessages(prev => [...prev, displayMsg].slice(-8));
    setInput("");
    setDroppedFiles([]); // Clear dropped files after sending
    setIsLoading(true);
    setIsThinking(true);

    setPipelineSteps(USER_FACING_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "working" : "pending" })));
    setPipelineExpanded(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Session expired. Please reload the page." }].slice(-8));
          setIsLoading(false);
          setIsThinking(false);
          setPipelineSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
          return;
        }
      }

      // Create messages array with full content for API
      const messagesForAPI = messages.slice(-8).map(msg => ({ role: msg.role, content: msg.content }));
      messagesForAPI.push({ role: "user", content: userContent });

      const response = await fetch("/api/ide-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesForAPI,
          projectName,
          drive,
          directory,
          fileNames: Object.keys(allFiles || {}).slice(-10),  // last 10 filenames only
          folderStructure,
          isProjectEmpty: Object.keys(allFiles || {}).length === 0,
        }),
      });

      if (!response.ok) {
        throw new Error(response.status === 401 ? "Unauthorized" : await response.text());
      }

      // ── STREAMING LOGIC (SSE‑style data: lines) ──
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }].slice(-8));

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            // New format from our API: { content: "text" }
            const content = parsed.content || parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              assistantContent += content;
              const cleanContent = assistantContent.replace(/<think[\s\S]*?<\/think>/g, "").trim();
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: cleanContent };
                return updated;
              });
            }
            // Update token usage if present
            if (parsed.usage || parsed.x_groq?.usage) {
              const usageData = parsed.usage || parsed.x_groq?.usage;
              setTokenUsage(prev => ({ ...prev, used: Math.max(prev.used, usageData.total_tokens || 0) }));
            }
          } catch {}
        }

        const hasFileBlocks = /```(?:file|diff)/.test(assistantContent);
        advanceUserFacingPipeline(assistantContent.length, hasFileBlocks);
      }

      setPipelineSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
      setIsThinking(false);

      // Refresh token usage after stream ends to sync DB value
      await fetchTokenUsage();
    } catch (error: any) {
      console.error(error);
      setIsThinking(false);
      setPipelineSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
      if (error.message === "Unauthorized") {
        setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Session expired. Please reload the page." }].slice(-8));
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Request failed. Please try again." }].slice(-8));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const userMsgs = messages.filter(m => m.role === "user");
    const lastUserMsg = userMsgs[userMsgs.length - 1];
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
      handleSend();
    }
  };

  // ── Drag & drop handlers ─────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const filePath = e.dataTransfer.getData("text/plain");
    if (filePath) {
      setDroppedFiles(prev => [...prev, filePath]);
      onFileDrop?.([filePath]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // ── Markdown code renderer with distinct dark styling (fixed) ──
  const shellCodeBlock = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      // Only use block rendering for fenced code blocks (not inline, has a language)
      if (!inline && className && match) {
        const codeString = String(children).replace(/\n$/, "");
        return (
          <div className="relative my-2 rounded-md bg-[#2d2d2d] p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 uppercase">{match[1]}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeString)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Copy
              </button>
            </div>
            <pre className="code-block text-gray-200 font-mono whitespace-pre-wrap">{codeString}</pre>
          </div>
        );
      }
      // Inline code or code without a language → simple inline styling
      return (
        <code className="bg-[#2d2d2d] text-gray-200 px-1 rounded" {...props}>
          {children}
        </code>
      );
    },
  };

  const modes: Mode[] = ["ask", "plan", "agent"];

  return (
    <div className="h-full flex flex-col border-l border-gray-700 bg-[#1e1e1e]">
      <style>{`
        .chat-message { font-size: 14px; line-height: 1.7; color: #d4d4d4; }
        .chat-input { font-size: 14px; }
        .chat-header { font-size: 12px; font-weight: 600; }
        .code-block { font-size: 13px; font-family: Consolas, Monaco, monospace; }
      `}</style>

      {/* Header */}
      <div className="h-8 border-b border-[#2d2d2d] flex items-center px-3 bg-[#181818] text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        AI Agent
        <button
          onClick={handleGenerateCommit}
          className="ml-auto px-2 py-1 text-xs bg-[#2d2d3d] text-gray-400 hover:text-white rounded"
          title="Generate commit message"
        >
          <GitCommit size={14} />
        </button>
      </div>

      {/* Mode buttons */}
      <div className="chat-header flex gap-1 p-2 border-b border-gray-700">
        {modes.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded text-xs font-medium capitalize ${
              mode === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Instructional tooltip */}
      {showTooltip && (
        <div className="mx-2 mb-2 px-3 py-2 bg-blue-900/30 border border-blue-800 rounded text-xs text-blue-300 flex items-center gap-2">
          <Info size={14} />
          <span>Drag and drop files from the Explorer into the chat to add context.</span>
          <button onClick={() => setShowTooltip(false)} className="ml-auto text-gray-400 hover:text-white">×</button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-blue-600 text-white text-sm">
                  <ReactMarkdown components={shellCodeBlock}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            );
          }

          const isError = msg.content.startsWith("⚠️");
          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-gray-800 text-gray-200 text-sm">
                <ReactMarkdown components={shellCodeBlock}>{msg.content}</ReactMarkdown>
              </div>
              {isError && (
                <button onClick={handleRetry} className="mt-1 ml-2 text-xs text-blue-400 hover:underline">
                  Retry
                </button>
              )}
            </div>
          );
        })}

        {(isLoading || isThinking) && (
          <AgentPipeline
            steps={pipelineSteps}
            expanded={pipelineExpanded}
            onToggle={() => setPipelineExpanded(!pipelineExpanded)}
          />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area with drag & drop, plus icon, and dropped file tags */}
      <div
        className="border-t border-[#2d2d2d] bg-[#1e1e1e]"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Token meter */}
        <div className="px-3 py-1 text-xs text-gray-400 flex items-center justify-between">
          <span>Tokens: {tokenUsage.used} / {tokenUsage.limit}</span>
          {isTokenExhausted && (
            <span className="text-red-400">Limit reached. Resets in {timeLeft}</span>
          )}
        </div>

        {/* Dropped file tags */}
        {droppedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 pb-2">
            {droppedFiles.map((file) => (
              <span key={file} className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full flex items-center">
                📎 {file.split("/").pop()}
                <button
                  className="ml-1 text-gray-400 hover:text-white"
                  onClick={() => setDroppedFiles(prev => prev.filter(f => f !== file))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input container */}
        <div className="p-3">
          <div className="relative">
            <div className="flex items-end gap-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded-md px-3 py-2 focus-within:border-[#007acc] transition-colors">
              <Textarea
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading || isTokenExhausted}
                placeholder={isTokenExhausted ? "Token limit reached" : "Ask Netsyra..."}
                className="min-h-[24px] max-h-[120px] bg-transparent border-none text-[#cccccc] placeholder-[#8b949e] text-sm resize-none flex-1 outline-none p-0"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || isTokenExhausted}
                className="p-1.5 rounded-md bg-[#0e639c] text-white hover:bg-[#1177bb] disabled:bg-transparent disabled:text-[#5a5a5a] transition-colors shrink-0"
              >
                <Send size={16} />
              </button>

              {/* Plus icon for folder structure */}
              <button
                onClick={async () => {
                  if (showFolderStructure) {
                    setShowFolderStructure(false);
                    return;
                  }
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    const { data } = await supabase
                      .from("user_folder_structure")
                      .select("structure")
                      .eq("user_id", user.id)
                      .single();
                    if (data) {
                      setStoredStructure(data.structure);
                    } else {
                      await supabase
                        .from("user_folder_structure")
                        .upsert({
                          user_id: user.id,
                          structure: folderStructure || "",
                          updated_at: new Date().toISOString(),
                        });
                      setStoredStructure(folderStructure || "No structure stored.");
                    }
                  }
                  setShowFolderStructure(true);
                }}
                className="p-1.5 rounded-md bg-[#2d2d3d] text-gray-400 hover:text-white"
                title="Save/Load project structure"
              >
                <FolderOpen size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-[11px] text-[#8b949e]">Enter to send, Shift+Enter for new line</span>
            </div>
          </div>

          {/* Folder structure popover */}
          {showFolderStructure && (
            <div className="absolute bottom-full right-0 mb-2 w-80 p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-xl text-xs text-gray-300 max-h-48 overflow-y-auto z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-400">Project Structure</span>
                <button onClick={() => setShowFolderStructure(false)} className="text-gray-500 hover:text-white">×</button>
              </div>
              <pre className="whitespace-pre-wrap">{storedStructure}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Local commit prompt generator ────────────────
function buildCommitPrompt(changes: string): string {
  return `You are a coding assistant generating a Git commit message.

## Project Changes
${changes}

## Instructions
- Generate ONE concise semantic commit message following the format:
  type(scope): brief description
- Types: feat, fix, refactor, style, docs, test, chore
- Keep the subject line under 72 characters.
- If needed, add a body with bullet points of key changes.
- Then provide 2-3 alternative commit messages with different wording or scope.

## Output Format
Main:
feat(auth): add JWT authentication flow

Alternatives:
feat(security): implement JWT session handling
feat(auth): add login and register endpoints

Return EXACTLY in this format. No other text.`;
}