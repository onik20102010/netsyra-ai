"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  XCircle,
  FileCode,
  GitCommit,
  Cpu,
  MemoryStick,
  Globe,
  AlertCircle,
  Play,
  Square,
  RotateCcw,
  Clock,
  ChevronRight,
  ChevronDown,
  FolderTree,
} from "lucide-react";
import { type RuntimeStatus } from "@/ide/types";
import { type RuntimeEventMessage } from "@/hooks/useRuntime";
import { type FileItem, type OpenFile } from "./file-utils";
import { gatherWorkspaceContext, findFileByPath, readFileText } from "@/lib/workspace";
import { DiffViewer } from "./DiffViewer";

interface AgentFileChange {
  id: string;
  path: string;
  operation: string;
  newContent?: string;
  reasoning?: string;
  originalContent?: string;
}

interface AgentResult {
  summary?: string;
  explanation?: string;
  files?: AgentFileChange[];
  status?: string;
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  duration?: number;
  error?: string;
}

interface ChatPanelProps {
  onToast: (message: string) => void;
  events: RuntimeEventMessage[];
  status: RuntimeStatus | null;
  workspace: FileItem | null;
  openFiles: OpenFile[];
  activeFile: string | null;
  onApplyChanges: (changes: AgentFileChange[]) => Promise<void>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  plan?: string;
  patch?: string;
  files?: string[];
  diagnostics?: string[];
  tokenUsage?: number;
  latencyMs?: number;
  result?: AgentResult;
  changes?: AgentFileChange[];
}

function Timeline({ events }: { events: RuntimeEventMessage[] }) {
  return (
    <div className="font-mono text-ide-xs space-y-1 max-h-32 overflow-y-auto ide-scroll p-2 bg-ide-bg rounded border border-ide-border">
      {events.length === 0 && <span className="text-ide-foreground-dim">No events yet.</span>}
      {events.slice(0, 20).map((evt, i) => (
        <div key={i} className="flex items-center gap-2 text-ide-foreground-dim truncate">
          <Clock size={10} />
          <span className="text-ide-accent">{evt.type}</span>
          <span className="truncate">{JSON.stringify(evt.payload)}</span>
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ code, title, lang }: { code: string; title: string; lang: string }) {
  return (
    <div className="mt-2 rounded border border-ide-border overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 bg-ide-surface text-ide-xs text-ide-foreground-dim">
        <span className="flex items-center gap-1"><FileCode size={12} /> {title}</span>
        <span className="text-[10px] uppercase">{lang}</span>
      </div>
      <pre className="p-2 max-h-40 overflow-y-auto ide-scroll bg-ide-bg font-mono text-ide-xs text-ide-foreground whitespace-pre">{code}</pre>
    </div>
  );
}

export function ChatPanel({ onToast, events, status, workspace, openFiles, activeFile, onApplyChanges }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "I am Netsyra. Describe what you want to build, fix, or verify and I will plan and execute with full runtime visibility.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPlan, setShowPlan] = useState<Record<string, boolean>>({});
  const [showPatch, setShowPatch] = useState<Record<string, boolean>>({});
  const [selectedChanges, setSelectedChanges] = useState<Record<string, string[]>>({});
  const [appliedMessages, setAppliedMessages] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const model = status?.session?.currentModel ?? "gpt-4";
  const provider = "openai";
  const memory = "14.2 MB";
  const context = events.length > 0 ? `${events.length} events` : "fresh";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, showPlan, showPatch]);

  const buildWorkspaceTree = () => {
    if (!workspace) return "";
    const paths: string[] = [];
    const walk = (items: FileItem[]) => {
      for (const item of items) {
        paths.push(item.path);
        if (item.children) walk(item.children);
      }
    };
    walk(workspace.children ?? []);
    return paths.slice(0, 40).join("\n");
  };

  const getStageLabel = (stage: string, payload?: Record<string, unknown>): string => {
    switch (stage) {
      case "analyzing_request":
        return "Analyzing request...";
      case "context_collected":
        return `Collecting context (${(payload?.fileCount as number | undefined) ?? 0} files)`;
      case "planning":
        return "Planning changes...";
      case "understanding_request":
        return "Understanding request...";
      case "collecting_context":
        return `Collecting context (${(payload?.fileCount as number | undefined) ?? payload?.tokenCount ?? 0})`;
      case "selecting_model":
        return `Selecting model (${(payload?.modelId as string | undefined) ?? "..."})`;
      case "generating_code":
        return "Generating code...";
      case "verifying_output":
        return "Verifying output...";
      case "applying_edits":
        return `Applying edits (${(payload?.fileCount as number | undefined) ?? 0} files)`;
      case "updating_workspace":
        return `Updating workspace (${(payload?.fileCount as number | undefined) ?? 0} files)`;
      case "completed":
        return "Done.";
      case "token_usage":
        return "Received usage.";
      case "error":
        return `Error: ${payload?.error ?? ""}`;
      default:
        return stage;
    }
  };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    const userMsgId = `u-${Date.now()}`;
    const assistantMsgId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text: userText }]);
    setInput("");
    setIsLoading(true);

    const activeOpenFile = openFiles.find((f) => f.id === activeFile);

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        text: "Reading workspace...",
      },
    ]);

    let contextFiles: { path: string; content: string }[] = [];
    try {
      if (workspace) {
        contextFiles = await gatherWorkspaceContext(workspace, userText, openFiles, { maxFiles: 8, maxBytes: 50 * 1024 });
      } else if (activeOpenFile) {
        contextFiles = [{ path: activeOpenFile.path, content: activeOpenFile.content }];
      } else {
        contextFiles = openFiles.slice(0, 3).map((f) => ({ path: f.path, content: f.content }));
      }
    } catch {
      contextFiles = openFiles.slice(0, 3).map((f) => ({ path: f.path, content: f.content }));
    }

    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.id === assistantMsgId) {
        next[next.length - 1] = { ...last, text: "Thinking..." };
      }
      return next;
    });

    try {
      const res = await fetch("/ide/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          activeFile: activeOpenFile?.path ?? null,
          openFiles: contextFiles,
          workspaceTree: buildWorkspaceTree(),
          language: activeOpenFile?.language || "typescript",
          framework: "next",
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let resultPayload: AgentResult | null = null;

      while (true) {
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
            if (parsed.type === "result") {
              resultPayload = parsed.result as AgentResult;
            } else if (parsed.type === "error") {
              resultPayload = { error: parsed.error };
            } else {
              // stage / content / token_usage events
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.id === assistantMsgId) {
                  const stage = parsed.stage || parsed.type;
                  const text =
                    stage === "content"
                      ? (last.text === "Reading workspace..." || last.text === "Thinking..." ? "" : last.text)
                      : getStageLabel(stage, parsed.payload);
                  next[next.length - 1] = {
                    ...last,
                    text: parsed.type === "content" ? last.text + parsed.payload.content : text,
                  };
                }
                return next;
              });
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }

      if (resultPayload && !resultPayload.error && resultPayload.files) {
        const readOriginal = async (change: AgentFileChange): Promise<string> => {
          const openFile = openFiles.find((f) => f.path === change.path);
          if (openFile) return openFile.content;
          if (!workspace) return "";
          const file = findFileByPath(workspace, change.path);
          if (!file || file.type !== "file" || !file.handle) return "";
          try {
            return await readFileText(file.handle as FileSystemFileHandle);
          } catch {
            return "";
          }
        };
        const originals = await Promise.all(resultPayload.files.map(readOriginal));
        resultPayload = {
          ...resultPayload,
          files: resultPayload.files.map((c, i) => ({ ...c, originalContent: originals[i] })),
        };
      }

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (!last || last.id !== assistantMsgId) return next;

        if (resultPayload?.error) {
          next[next.length - 1] = { ...last, text: `Error: ${resultPayload.error}` };
        } else {
          const changes = resultPayload?.files ?? [];
          next[next.length - 1] = {
            ...last,
            text: resultPayload?.summary || resultPayload?.explanation || last.text || "Done.",
            plan: resultPayload?.explanation,
            files: changes.map((c) => c.path),
            changes,
            result: resultPayload || undefined,
            tokenUsage: resultPayload?.tokenUsage?.totalTokens,
            latencyMs: resultPayload?.duration,
            diagnostics: resultPayload?.status ? [resultPayload.status] : undefined,
          };
        }
        return next;
      });

      setShowPatch((s) => ({ ...s, [assistantMsgId]: true }));
      onToast("Patch ready for review");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.id === assistantMsgId) {
          next[next.length - 1] = { ...last, text: `Error: ${message}` };
        }
        return next;
      });
      onToast(`Agent failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stop = () => {
    setIsLoading(false);
    onToast("Generation stopped");
  };

  const getSelected = (msg: ChatMessage) => {
    const selected = selectedChanges[msg.id] || [];
    return msg.changes?.filter((c) => selected.includes(c.id)) ?? [];
  };

  const applyChanges = async (msg: ChatMessage, changes: AgentFileChange[]) => {
    if (changes.length === 0) {
      onToast("No changes to apply");
      return;
    }
    try {
      await onApplyChanges(changes);
      setAppliedMessages((prev) => new Set(prev).add(msg.id));
      onToast(`Applied ${changes.length} file(s)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onToast(`Failed to apply changes: ${message}`);
    }
  };

  const accept = (msg: ChatMessage) => applyChanges(msg, msg.changes || []);
  const acceptSelected = (msg: ChatMessage) => applyChanges(msg, getSelected(msg));

  const reject = (msg: ChatMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, changes: [], files: [], text: "Patch rejected." } : m))
    );
    onToast("Patch rejected");
  };

  const rejectSelected = (msg: ChatMessage) => {
    const selected = new Set(selectedChanges[msg.id] || []);
    const remaining = msg.changes?.filter((c) => !selected.has(c.id)) ?? [];
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, changes: remaining, files: remaining.map((c) => c.path) } : m))
    );
    setSelectedChanges((prev) => ({ ...prev, [msg.id]: [] }));
    onToast("Selected changes rejected");
  };

  const restore = (msg: ChatMessage) => {
    const originals =
      msg.changes
        ?.filter((c) => c.originalContent !== undefined && c.originalContent !== "")
        .map((c) => ({ ...c, newContent: c.originalContent! })) ?? [];
    if (originals.length === 0) {
      onToast("No original content to restore");
      return;
    }
    void applyChanges(msg, originals);
  };

  const toggleChange = (msgId: string, changeId: string) => {
    setSelectedChanges((prev) => {
      const current = new Set(prev[msgId] || []);
      if (current.has(changeId)) current.delete(changeId);
      else current.add(changeId);
      return { ...prev, [msgId]: Array.from(current) };
    });
  };

  const selectAll = (msg: ChatMessage) => {
    setSelectedChanges((prev) => ({ ...prev, [msg.id]: msg.changes?.map((c) => c.id) ?? [] }));
  };

  const selectNone = (msgId: string) => {
    setSelectedChanges((prev) => ({ ...prev, [msgId]: [] }));
  };

  return (
    <div className="flex flex-col h-full bg-ide-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-ide-border bg-ide-surface">
        <span className="text-ide-xs font-medium text-ide-foreground uppercase tracking-wide">AI Chat</span>
        <div className="flex items-center gap-2 text-ide-xs text-ide-foreground-dim">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-ide-bg border border-ide-border"><Cpu size={10} /> {model}</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-ide-bg border border-ide-border"><Globe size={10} /> {provider}</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-ide-bg border border-ide-border"><MemoryStick size={10} /> {memory}</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-ide-bg border border-ide-border"><FolderTree size={10} /> {context}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto ide-scroll p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[95%] px-3 py-2 rounded-lg text-ide-sm ${msg.role === "user" ? "bg-ide-primary text-ide-primary-foreground" : "bg-ide-surface text-ide-foreground border border-ide-border"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {msg.role === "assistant" ? <Bot size={12} className="text-ide-primary" /> : <User size={12} />}
                <span className="text-ide-xs text-ide-foreground-dim">{msg.role === "assistant" ? "Netsyra" : "You"}</span>
              </div>
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.role === "assistant" && msg.plan && (
                <div className="mt-2">
                  <button onClick={() => setShowPlan((s) => ({ ...s, [msg.id]: !s[msg.id] }))} className="flex items-center gap-1 text-ide-xs text-ide-foreground-dim hover:text-ide-foreground transition-colors">
                    {showPlan[msg.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <Sparkles size={12} /> Plan preview
                  </button>
                  <AnimatePresence>
                    {showPlan[msg.id] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
                        <CodeBlock code={msg.plan} title="plan.md" lang="markdown" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {msg.role === "assistant" && msg.changes && msg.changes.length > 0 && (
                <div className="mt-2">
                  <button onClick={() => setShowPatch((s) => ({ ...s, [msg.id]: !s[msg.id] }))} className="flex items-center gap-1 text-ide-xs text-ide-foreground-dim hover:text-ide-foreground transition-colors">
                    {showPatch[msg.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <GitCommit size={12} /> Patch preview ({msg.changes.length} file{msg.changes.length === 1 ? "" : "s"})
                  </button>
                  <AnimatePresence>
                    {showPatch[msg.id] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
                        {msg.changes.map((change, idx) => {
                          const original = openFiles.find((f) => f.path === change.path)?.content || change.originalContent || "";
                          const selected = (selectedChanges[msg.id] || []).includes(change.id);
                          const applied = appliedMessages.has(msg.id);
                          return (
                            <DiffViewer
                              key={change.id || idx}
                              original={original}
                              modified={change.newContent || "// No content generated"}
                              path={change.path}
                              selected={selected}
                              onToggle={() => toggleChange(msg.id, change.id)}
                              onAccept={() => applyChanges(msg, [change])}
                              onReject={() => {
                                const remaining = msg.changes?.filter((c) => c.id !== change.id) ?? [];
                                setMessages((prev) =>
                                  prev.map((m) => (m.id === msg.id ? { ...m, changes: remaining, files: remaining.map((c) => c.path) } : m))
                                );
                                onToast(`Rejected ${change.path}`);
                              }}
                              onRestore={applied && change.originalContent ? () => applyChanges(msg, [{ ...change, newContent: change.originalContent! }]) : undefined}
                              canRestore={applied && !!change.originalContent}
                            />
                          );
                        })}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <button onClick={() => selectAll(msg)} className="px-2 py-1 bg-ide-surface-hover text-ide-foreground-dim rounded text-ide-xs hover:text-ide-foreground">
                            Select all
                          </button>
                          <button onClick={() => selectNone(msg.id)} className="px-2 py-1 bg-ide-surface-hover text-ide-foreground-dim rounded text-ide-xs hover:text-ide-foreground">
                            Select none
                          </button>
                          <button onClick={() => acceptSelected(msg)} className="flex items-center justify-center gap-1 px-2 py-1 bg-ide-success text-ide-success-foreground rounded text-ide-xs hover:bg-ide-success/80 transition-colors">
                            <CheckCircle2 size={12} /> Accept selected
                          </button>
                          <button onClick={() => rejectSelected(msg)} className="flex items-center justify-center gap-1 px-2 py-1 bg-ide-warning text-ide-bg rounded text-ide-xs hover:bg-ide-warning/80 transition-colors">
                            <XCircle size={12} /> Reject selected
                          </button>
                          <button onClick={() => accept(msg)} className="flex items-center justify-center gap-1 px-2 py-1 bg-ide-success text-ide-success-foreground rounded text-ide-xs hover:bg-ide-success/80 transition-colors">
                            <CheckCircle2 size={12} /> Accept all
                          </button>
                          <button onClick={() => reject(msg)} className="flex items-center justify-center gap-1 px-2 py-1 bg-ide-error text-ide-error-foreground rounded text-ide-xs hover:bg-ide-error/80 transition-colors">
                            <XCircle size={12} /> Reject all
                          </button>
                          {appliedMessages.has(msg.id) && (
                            <button onClick={() => restore(msg)} className="flex items-center justify-center gap-1 px-2 py-1 bg-ide-info text-ide-bg rounded text-ide-xs hover:bg-ide-info/80 transition-colors">
                              <RotateCcw size={12} /> Undo
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {msg.tokenUsage && (
                <div className="flex items-center gap-3 mt-2 text-ide-xs text-ide-foreground-dim">
                  <span>Tokens: {msg.tokenUsage}</span>
                  <span>Latency: {msg.latencyMs}ms</span>
                </div>
              )}

              {msg.diagnostics && (
                <div className="flex items-center gap-1 mt-2 text-ide-xs text-ide-success">
                  <CheckCircle2 size={12} /> {msg.diagnostics.join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-ide-foreground-dim text-ide-sm">
            <Loader2 size={14} className="animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Runtime timeline mini */}
      <div className="px-3 py-2 border-t border-ide-border bg-ide-surface">
        <div className="text-ide-xs text-ide-foreground-dim mb-1">Runtime timeline</div>
        <Timeline events={events} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-ide-border bg-ide-surface">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Netsyra to plan, generate, or verify code..."
            className="flex-1 max-h-32 px-3 py-2 bg-ide-bg border border-ide-border rounded text-ide-sm text-ide-foreground placeholder:text-ide-foreground-dim focus:outline-none focus:border-ide-primary resize-none"
            rows={2}
          />
          {isLoading ? (
            <button onClick={stop} className="p-2.5 rounded bg-ide-error text-ide-error-foreground hover:bg-ide-error/80 transition-colors" title="Stop generation">
              <Square size={16} />
            </button>
          ) : (
            <button onClick={send} className="p-2.5 rounded bg-ide-primary text-ide-primary-foreground hover:bg-ide-primary-dim transition-colors" title="Send">
              <Send size={16} />
            </button>
          )}
          <button onClick={() => { setMessages([]); onToast("Chat history cleared"); }} className="p-2.5 rounded bg-ide-surface-hover text-ide-foreground-dim hover:text-ide-foreground transition-colors" title="Clear chat">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
