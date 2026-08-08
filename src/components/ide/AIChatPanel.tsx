// d:\netsyra\src\components\ide\AIChatPanel.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useIdeStore, getDB } from "@/ide";
import { Send, X, Bot, Loader2, FileText, Folder, Eye, Undo2, Check, XCircle, AlertCircle, Brain, Search, Wrench, Lightbulb, CheckCircle2, ChevronRight, Copy, Plus, Code2, MessageSquare, FolderPlus } from "lucide-react";
import { AgentOrchestrator, type ChatMessage, type PendingEdit, type AgentThought, type AgentPlan } from "@/agents/AgentOrchestrator";
import { useAuth } from "@/hooks/useAuth";
import { useAgentMessageLimit } from "@/hooks/useAgentMessageLimit";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachedFiles?: Array<{ path: string; name: string; id: string }>;
  // Inline tool-call cards (Windsurf style)
  toolCalls?: AgentThought[];
  // Plan shown above the response
  plan?: AgentPlan;
}

// Available models for the IDE agent (separate from Netsyra chat models)
// These map to Groq models via /api/groq/agent using GROQ_API_KEY_2
const MODELS = [
  { id: 'auto', label: 'Auto', desc: 'Balanced — best all-rounder' },
  { id: 'fast', label: 'Fast', desc: 'Quick responses for simple tasks' },
  { id: 'pro', label: 'Pro', desc: 'Most capable for complex reasoning' },
  { id: 'code', label: 'Code', desc: 'Optimized for code generation' },
];

// Recursively flatten the workspace file tree for @-mention search
type FlatFileNode = { name: string; path: string; isDirectory: boolean; children?: FlatFileNode[] };

function flattenFiles(items: FlatFileNode[], acc: Array<{ name: string; path: string }> = []): Array<{ name: string; path: string }> {
  for (const item of items) {
    if (!item.isDirectory) acc.push({ name: item.name, path: item.path });
    if (item.children) flattenFiles(item.children, acc);
  }
  return acc;
}

// --- Helper: find file ID by path in workspace tree ---
function findFileIdByPath(items: any[], targetPath: string): string | null {
  for (const item of items) {
    if (item.path === targetPath || item.path.endsWith('/' + targetPath) || targetPath.endsWith(item.path)) {
      return item.id;
    }
    if (item.children) {
      const found = findFileIdByPath(item.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}

export function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m Netsyra Agent, your AI coding assistant. I can help you understand your code, make changes, and implement features. What would you like to work on?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState<Array<{ path: string; name: string; id: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  // Windsurf-style: Write/Chat mode toggle
  const [mode, setMode] = useState<'write' | 'chat'>('write');
  // Model selector
  const [selectedModel, setSelectedModel] = useState('auto');
  // Message queue (type while loading, like Windsurf)
  const [queuedMessages, setQueuedMessages] = useState<string[]>([]);
  // Continue button — shown when agent hits tool limit
  const [showContinue, setShowContinue] = useState(false);
  // @-mention autocomplete
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  // Current plan from agent
  const [currentPlan, setCurrentPlan] = useState<AgentPlan | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agentRef = useRef<AgentOrchestrator | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toggleRightPanel = useIdeStore((s) => s.toggleRightPanel);
  const workspace = useIdeStore((s) => s.workspace);
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const problems = useIdeStore((s) => s.problems);
  const openFile = useIdeStore((s) => s.openFile);
  const createFile = useIdeStore((s) => s.createFile);

  const allProblems = Object.values(problems).flat();
  const errorCount = allProblems.filter(p => p.severity === 'error').length;
  const warningCount = allProblems.filter(p => p.severity === 'warning').length;

  const activeFile = openFiles.find(f => f.id === activeFileId);
  const { user } = useAuth();
  const userId = user?.id || 'local';
  const db = getDB(userId);

  // Agent message limit (3 messages per 24 hours)
  const { status: limitStatus, loading: limitLoading, refetch: refetchLimit } = useAgentMessageLimit(user?.id || null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = (overrideInput ?? input).trim();
    if (!textToSend || isLoading) return;

    // Check message limit (only for authenticated users)
    if (user && limitStatus && limitStatus.remaining <= 0) {
      const resetHours = Math.ceil(limitStatus.resetInSeconds / 3600);
      alert(`Message limit exceeded. You can send 3 messages per 24 hours. Try again in ${resetHours} hour${resetHours > 1 ? 's' : ''}.`);
      return;
    }

    // If loading, queue the message (Windsurf style)
    if (isLoading) {
      setQueuedMessages(prev => [...prev, textToSend]);
      setInput('');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      attachedFiles: draggedFiles.length > 0 ? draggedFiles : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = textToSend;
    setInput('');
    setDraggedFiles([]);
    setIsLoading(true);
    setShowContinue(false);

    // In chat mode, prefix the prompt so the agent answers only (no edits)
    const effectivePrompt = mode === 'chat'
      ? `[CHAT MODE — answer only, do NOT use edit_file or create_file]\n\n${currentInput}`
      : currentInput;

    try {
      // Build chat history for conversation memory
      const chatHistory: ChatMessage[] = messages
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      // Start streaming display
      setStreamingText('');
      setIsStreaming(true);
      const collectedThoughts: AgentThought[] = [];

      // Unified agent: handles both questions and code actions
      const agent = new AgentOrchestrator(
        db,
        (status) => setAgentStatus(status),
        (token, fullText) => {
          // Reset signal — new LLM round starting, clear previous streaming text
          if (fullText === '') {
            setStreamingText('');
            return;
          }

          // If no tool tag, this is a plain text response — stream it directly
          if (!fullText.includes('<tool>')) {
            setStreamingText(fullText);
            return;
          }

          // If it contains "answer" tool, extract just the content field from streaming JSON
          if (fullText.includes('"answer"')) {
            const contentMatch = fullText.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)/);
            if (contentMatch) {
              let content = contentMatch[1];
              // Remove possibly incomplete trailing escape char
              content = content.replace(/\\$/, '');
              // Unescape JSON sequences for display
              content = content.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              setStreamingText(content);
              return;
            }
          }

          // It's a tool call (read_file, edit_file, etc.) — don't show raw JSON
          // The activity panel will show what's happening via onThought callbacks
        },
        (thought) => {
          collectedThoughts.push(thought);
          setThoughts(prev => [...prev, thought]);
        },
        (plan) => {
          setCurrentPlan(plan);
        },
        selectedModel,
      );
      agentRef.current = agent;

      // Build attached files list from dragged files
      const attachedFiles = draggedFiles.length > 0
        ? draggedFiles.map(f => ({ path: f.path, name: f.name, id: f.id }))
        : undefined;

      const result = await agent.run(effectivePrompt, chatHistory, attachedFiles);

      setIsStreaming(false);
      setAgentStatus(null);
      setStreamingText('');
      setThoughts([]);
      setCurrentPlan(null);

      // Refetch limit status after successful message
      if (user) {
        refetchLimit();
      }

      // Build response text
      let responseText = result.message;

      if (result.filesRead.length > 0 && result.pendingEdits.length === 0) {
        responseText += '\n\n**Files examined:** ' + result.filesRead.map(f => `\`${f}\``).join(', ');
      }

      // Show pending edits for user approval (only in write mode)
      if (result.pendingEdits.length > 0 && mode === 'write') {
        setPendingEdits(result.pendingEdits);
        responseText += `\n\n**${result.pendingEdits.length} change${result.pendingEdits.length > 1 ? 's' : ''} ready for review.** Accept or reject below.`;
      }

      if (result.canUndo) {
        setCanUndo(true);
      }

      // Show Continue button if agent hit tool limit (Windsurf style)
      setShowContinue(result.hitLimit === true);

      // Store tool calls on the message for inline tool-call cards
      const toolCalls = collectedThoughts.filter(t => t.type === 'action' || t.type === 'observation');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        plan: result.plan || undefined,
      }]);

      // Process queued messages (Windsurf style: send next in queue)
      setQueuedMessages(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          setTimeout(() => handleSend(next), 100);
          return rest;
        }
        return prev;
      });
    } catch (error) {
      setIsStreaming(false);
      setAgentStatus(null);
      setStreamingText('');
      setThoughts([]);
      console.error('Agent error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyEdits = () => {
    if (agentRef.current) {
      agentRef.current.applyPendingEdits();
      setPendingEdits([]);
    }
  };

  // Per-file accept (Windsurf style)
  const handleAcceptEdit = (editId: string) => {
    if (!agentRef.current) return;
    const edit = pendingEdits.find(e => e.id === editId);
    if (!edit) return;
    // Apply just this one edit
    const store = useIdeStore.getState();
    const file = store.openFiles.find(f => f.path === edit.filePath);
    if (file) {
      store.setFileContent(file.id, edit.newContent);
      store.saveFile(file.id);
    } else {
      // File not open — update tree
      store.updateFileContent(edit.fileId || '', edit.newContent);
    }
    setPendingEdits(prev => prev.filter(e => e.id !== editId));
  };

  // Per-file reject (Windsurf style)
  const handleRejectEdit = (editId: string) => {
    setPendingEdits(prev => prev.filter(e => e.id !== editId));
  };

  const handleDismissEdits = () => {
    if (agentRef.current) {
      agentRef.current.dismissPendingEdits();
    }
    setPendingEdits([]);
  };

  // Insert code block into active editor (Windsurf Chat mode "Insert" button)
  const handleInsertCode = (code: string) => {
    const editor = (window as unknown as { __netsyraEditor?: { insertSnippet: (snippet: string) => void; focus: () => void } }).__netsyraEditor;
    if (editor) {
      editor.insertSnippet(code);
      editor.focus();
    } else {
      // Fallback: append to active file content
      const store = useIdeStore.getState();
      if (store.activeFileId) {
        const file = store.openFiles.find(f => f.id === store.activeFileId);
        if (file) {
          store.setFileContent(file.id, file.content + '\n' + code);
        }
      }
    }
  };

  const handleUndo = () => {
    if (agentRef.current) {
      agentRef.current.undo();
      setCanUndo(false);
      setPendingEdits([]);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Changes have been reverted. The files are back to their state before my last run.',
        timestamp: Date.now()
      }]);
    }
  };

  const handleFixErrors = () => {
    if (errorCount === 0 && warningCount === 0) return;
    const severity = errorCount > 0 ? 'errors' : 'warnings';
    setInput(`Please fix all ${severity} in my code. Use the get_problems tool to see them, then read only the relevant lines and fix each one.`);
    setTimeout(() => handleSend(), 100);
  };

  // @-mention detection: when user types @, start autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Detect @mention
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = val.slice(lastAt + 1);
      // Only trigger if @ was just typed and no space after it
      if (!afterAt.includes(' ') && afterAt.length <= 40) {
        setMentionQuery(afterAt);
        setMentionStart(lastAt);
        return;
      }
    }
    setMentionQuery(null);
    setMentionStart(-1);
  };

  // Insert a file from @-mention autocomplete
  const handleMentionSelect = (filePath: string) => {
    if (mentionStart === -1) return;
    const before = input.slice(0, mentionStart);
    const after = input.slice(mentionStart + 1 + (mentionQuery?.length ?? 0));
    const newText = `${before}@${filePath} ${after}`;
    setInput(newText);
    setMentionQuery(null);
    setMentionStart(-1);
    // Add as attached context
    const fileName = filePath.split('/').pop() || filePath;
    const fileId = workspace?.files.find(f => f.path === filePath)?.id || '';
    setDraggedFiles(prev => [...prev, { path: filePath, name: fileName, id: fileId }]);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Filtered file list for @-mention dropdown
  const mentionFiles = useMemo(() => {
    if (!mentionQuery || !workspace) return [];
    const all = flattenFiles(workspace.files);
    const q = mentionQuery.toLowerCase();
    return all.filter(f => f.path.toLowerCase().includes(q)).slice(0, 8);
  }, [mentionQuery, workspace]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // If mention dropdown is open, let it handle Enter
      if (mentionQuery !== null && mentionFiles.length > 0) return;
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && mentionQuery !== null) {
      setMentionQuery(null);
      setMentionStart(-1);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    try {
      const data = e.dataTransfer.getData('text/plain');
      const fileData = JSON.parse(data);

      if (fileData.type === 'file') {
        setDraggedFiles(prev => [...prev, {
          path: fileData.path,
          name: fileData.name,
          id: fileData.id
        }]);
      }
    } catch (error) {
      console.error('Error parsing dropped file data:', error);
    }
  };

  const removeDraggedFile = (index: number) => {
    setDraggedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Open a file by path from agent message click
  const handleOpenFileFromChat = (filePath: string) => {
    if (!workspace) return;
    // Try exact match first
    let fileId = findFileIdByPath(workspace.files, filePath);
    // Try matching by filename only
    if (!fileId) {
      const fileName = filePath.split('/').pop() || filePath;
      const findByName = (items: any[]): string | null => {
        for (const item of items) {
          if (!item.isDirectory && item.name === fileName) return item.id;
          if (item.children) { const f = findByName(item.children); if (f) return f; }
        }
        return null;
      };
      fileId = findByName(workspace.files);
    }
    if (fileId) openFile(fileId);
  };

  // Copy message content
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);
  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  // New file/folder creation
  const [showCreate, setShowCreate] = useState<{ parentPath: string; isDir: boolean } | null>(null);
  const [createName, setCreateName] = useState('');
  const handleCreate = () => {
    if (showCreate && createName.trim()) {
      createFile(showCreate.parentPath, createName.trim(), showCreate.isDir);
    }
    setShowCreate(null);
    setCreateName('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header — Netsyra Agent style */}
      <div className="flex items-center justify-between h-[40px] px-3 border-b border-[#1f2428] shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-[#34e8bb]" />
          <span className="text-[13px] font-semibold text-[#e6edf3]">Netsyra Agent</span>
          <span className="text-[10px] text-[#6e7681] font-medium uppercase tracking-wider ml-1">Agent</span>
        </div>
        <div className="flex items-center gap-1">
          {workspace && (
            <button
              onClick={() => { setShowCreate({ parentPath: workspace.rootPath, isDir: false }); setCreateName(''); }}
              className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
              title="New File"
            >
              <Plus size={14} />
            </button>
          )}
          {workspace && (
            <button
              onClick={() => { setShowCreate({ parentPath: workspace.rootPath, isDir: true }); setCreateName(''); }}
              className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
              title="New Folder"
            >
              <FolderPlus size={14} />
            </button>
          )}
          {canUndo && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#6e7681] hover:text-[#e6edf3] border border-[#30363d] hover:border-[#484f58] rounded transition-colors"
              title="Undo all changes from last agent run"
            >
              <Undo2 size={12} />
              Undo
            </button>
          )}
          <button
            onClick={toggleRightPanel}
            className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Context Info — compact, muted */}
      <div className="px-3 py-1.5 border-b border-[#1f2428] bg-[#0d1117] shrink-0">
        <div className="text-[11px] text-[#6e7681]">
          {workspace ? (
            <div className="flex items-center gap-2">
              <Folder size={12} className="text-[#6e7681]" />
              <span className="truncate">{workspace.name}</span>
            </div>
          ) : (
            <span>No workspace opened</span>
          )}
        </div>
        {activeFile && (
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#6e7681]">
            <FileText size={12} className="text-[#6e7681]" />
            <span className="truncate">{activeFile.path}</span>
          </div>
        )}
      </div>

      {/* Inline new file/folder creation input */}
      {showCreate && (
        <div className="px-3 py-1.5 border-b border-[#1f2428] bg-[#161b22] shrink-0 flex items-center gap-2">
          <span className="text-[11px] text-[#6e7681] shrink-0">{showCreate.isDir ? 'Folder:' : 'File:'}</span>
          <input
            type="text"
            autoFocus
            className="flex-1 bg-[#0d1117] text-[#e6edf3] text-[12px] px-2 py-1 border border-[#34e8bb] outline-none rounded-sm"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setShowCreate(null); setCreateName(''); }
            }}
            onBlur={handleCreate}
            placeholder={showCreate.isDir ? 'folder name...' : 'file name...'}
          />
        </div>
      )}

      {/* Messages — Windsurf style: full-width, no max-width constraint */}
      <div className="flex-1 overflow-y-auto scroll-smooth select-text">
        <div className="w-full px-4 py-4 space-y-5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              {message.role === 'assistant' ? (
                /* Assistant: no bubble, full-width markdown + inline tool cards, Windsurf style */
                <div className="w-full text-[13px] leading-[1.6] text-[#e6edf3] break-words">
                  {/* Plan card (if agent created a plan) */}
                  {message.plan && <PlanCard plan={message.plan} />}
                  {/* Inline tool-call cards (Windsurf style) */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <ToolCallCards toolCalls={message.toolCalls} />
                  )}
                  <MarkdownRenderer content={message.content} onInsertCode={handleInsertCode} onOpenFile={handleOpenFileFromChat} />
                  {/* Copy button below the last assistant message */}
                  {index === messages.length - 1 && !isLoading && message.content && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(message.content, index)}
                        className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#6e7681] hover:text-[#e6edf3] border border-[#21262d] hover:border-[#30363d] rounded transition-colors"
                        title="Copy message"
                      >
                        {copiedMsgIdx === index ? <Check size={11} className="text-[#3fb950]" /> : <Copy size={11} />}
                        {copiedMsgIdx === index ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* User: subtle dark bubble, right-aligned, NOT bright blue */
                <div className="bg-[#161b22] border border-[#30363d] max-w-[85%] p-3 rounded-lg rounded-tr-sm text-[#e6edf3] self-end break-words">
                  <p className="whitespace-pre-wrap text-[13px] leading-[1.6]">{message.content}</p>
                  {message.attachedFiles && message.attachedFiles.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#30363d]">
                      <p className="text-[11px] text-[#6e7681] mb-1">Attached files:</p>
                      {message.attachedFiles.map((file, idx) => (
                        <div key={idx} className="text-[11px] flex items-center gap-1 text-[#8b949e]">
                          <FileText size={12} />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-full">
                {/* Live plan card */}
                {currentPlan && <PlanCard plan={currentPlan} />}
                {/* Live Agent Activity Panel */}
                {thoughts.length > 0 && !isStreaming && (
                  <AgentActivityPanel thoughts={thoughts} status={agentStatus} />
                )}

                {/* Streaming text response */}
                {isStreaming && streamingText ? (
                  <div className="w-full text-[13px] leading-[1.6] text-[#e6edf3] break-words">
                    {thoughts.length > 0 && (
                      <AgentActivityPanel thoughts={thoughts} status={agentStatus} collapsed />
                    )}
                    <MarkdownRenderer content={streamingText} onInsertCode={handleInsertCode} onOpenFile={handleOpenFileFromChat} />
                    <span className="inline-block w-1.5 h-3.5 bg-[#34e8bb] animate-pulse ml-0.5 align-middle rounded-sm" />
                  </div>
                ) : !isStreaming ? (
                  /* Animated agent indicator — shows thinking/planning/tool-calling/typing states */
                  <AgentIndicator
                    status={agentStatus}
                    isStreaming={isStreaming}
                    hasStreamingText={!!streamingText}
                    thoughts={thoughts}
                  />
                ) : (
                  /* Streaming but no text yet (waiting for first token) — show indicator */
                  <AgentIndicator
                    status={agentStatus}
                    isStreaming={isStreaming}
                    hasStreamingText={!!streamingText}
                    thoughts={thoughts}
                  />
                )}
              </div>
            </div>
          )}
          {pendingEdits.length > 0 && (
            <div className="flex justify-start">
              {/* Windsurf-style diff card: dark bg, teal accent header, clean accept/reject */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[#34e8bb] text-[12px] font-medium">
                    <Eye size={14} />
                    <span>{pendingEdits.length} change{pendingEdits.length > 1 ? 's' : ''} ready for review</span>
                  </div>
                  {canUndo && (
                    <button
                      onClick={handleUndo}
                      className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#6e7681] hover:text-[#e6edf3] border border-[#30363d] hover:border-[#484f58] rounded transition-colors"
                      title="Undo all changes from last agent run"
                    >
                      <Undo2 size={11} />
                      Undo
                    </button>
                  )}
                </div>
                {/* Per-file edit cards with expandable diff + per-file accept/reject */}
                <div className="space-y-2 mb-3">
                  {pendingEdits.map((edit) => (
                    <DiffCard
                      key={edit.id}
                      edit={edit}
                      onAccept={() => handleAcceptEdit(edit.id)}
                      onReject={() => handleRejectEdit(edit.id)}
                    />
                  ))}
                </div>
                {/* Accept all / Reject all — Windsurf style */}
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyEdits}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3fb950] hover:bg-[#3fb950]/80 text-[#0d1117] text-[12px] font-medium rounded-md transition-colors"
                  >
                    <Check size={13} />
                    Accept all
                  </button>
                  <button
                    onClick={handleDismissEdits}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f85149] text-[12px] font-medium rounded-md border border-[#30363d] transition-colors"
                  >
                    <XCircle size={13} />
                    Reject all
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Continue button — shown when agent hits tool limit (Windsurf style) */}
          {showContinue && (
            <div className="flex justify-center py-2">
              <button
                onClick={() => {
                  setShowContinue(false);
                  handleSend('Continue where you left off.');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#34e8bb]/10 hover:bg-[#34e8bb]/20 text-[#34e8bb] text-[12px] font-medium rounded-md border border-[#34e8bb]/30 transition-colors"
              >
                <ChevronRight size={14} />
                Continue
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input — Windsurf style: clean, calm, minimal. Plus icon opens mode/model menu */}
      <div
        className={`bg-[#0d1117] border-t border-[#1f2428] p-3 sticky bottom-0 shrink-0 transition-all duration-200 ease-in-out ${isDragging ? 'bg-[#161b22]' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Context pills — show attached files (compact, above input) */}
        {draggedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pb-2">
            {draggedFiles.map((file, index) => (
              <div key={index} className="bg-[#161b22] text-[#8b949e] text-[11px] px-2 py-1 rounded-md border border-[#30363d] flex items-center gap-1.5">
                <FileText size={11} className="text-[#6e7681]" />
                <span className="truncate max-w-[120px]">{file.name}</span>
                <X size={11} className="cursor-pointer hover:text-[#f85149] transition-colors" onClick={() => removeDraggedFile(index)} />
              </div>
            ))}
          </div>
        )}

        {/* Queued messages indicator */}
        {queuedMessages.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#6e7681] px-1 pb-2">
            <Loader2 size={11} className="animate-spin text-[#34e8bb]" />
            <span>{queuedMessages.length} message{queuedMessages.length > 1 ? 's' : ''} queued</span>
          </div>
        )}

        {/* Error/limit indicators — subtle, above input box */}
        {(errorCount > 0 || warningCount > 0 || (user && limitStatus && limitStatus.remaining <= 0)) && (
          <div className="flex items-center gap-1.5 pb-2 flex-wrap">
            {user && limitStatus && limitStatus.remaining <= 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/20">
                <AlertCircle size={10} />
                Limit reached
              </span>
            )}
            {(errorCount > 0 || warningCount > 0) && (
              <button
                onClick={handleFixErrors}
                disabled={isLoading}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/20 hover:bg-[#f85149]/20 transition-colors disabled:opacity-50"
                title={`${errorCount} error(s), ${warningCount} warning(s) — Click to auto-fix`}
              >
                <AlertCircle size={10} />
                {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : `${warningCount} warning${warningCount > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-[#34e8bb]/10 border-2 border-dashed border-[#34e8bb]/40 rounded flex items-center justify-center pointer-events-none z-20">
            <span className="text-[#34e8bb] font-medium text-[13px]">Drop files here</span>
          </div>
        )}

        {/* ── Clean input box — Windsurf style ──
            Single rounded box: [+] icon (opens menu) + textarea + send button
            Mode/Model selection is hidden inside the plus icon popover */}
        <InputBox
          input={input}
          setInput={setInput}
          textareaRef={textareaRef}
          handleInputChange={handleInputChange}
          handleKeyDown={handleKeyDown}
          handleSend={handleSend}
          isLoading={isLoading}
          queuedMessages={queuedMessages}
          mode={mode}
          setMode={setMode}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          draggedFiles={draggedFiles}
          mentionQuery={mentionQuery}
          mentionFiles={mentionFiles}
          handleMentionSelect={handleMentionSelect}
        />
      </div>
    </div>
  );
}

// ── InputBox: Windsurf-style clean input with plus icon popover ──
// The plus icon opens a popover containing Write/Chat mode + model selector.
// Everything is calm and minimal — no clutter around the textarea.

function InputBox({
  input, setInput, textareaRef, handleInputChange, handleKeyDown, handleSend,
  isLoading, queuedMessages, mode, setMode, selectedModel, setSelectedModel,
  draggedFiles, mentionQuery, mentionFiles, handleMentionSelect,
}: {
  input: string;
  setInput: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSend: (override?: string) => void;
  isLoading: boolean;
  queuedMessages: string[];
  mode: 'write' | 'chat';
  setMode: (m: 'write' | 'chat') => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  draggedFiles: Array<{ path: string; name: string; id: string }>;
  mentionQuery: string | null;
  mentionFiles: Array<{ name: string; path: string }>;
  handleMentionSelect: (path: string) => void;
}) {
  const [plusOpen, setPlusOpen] = useState(false);
  const plusRef = useRef<HTMLDivElement>(null);
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  // Close plus menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) setPlusOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex items-end gap-2 bg-[#161b22] border border-[#30363d] rounded-xl p-2 focus-within:border-[#34e8bb]/30 transition-colors">
      {/* ── Plus icon — opens popover with mode + model selection ── */}
      <div ref={plusRef} className="relative shrink-0">
        <button
          onClick={() => setPlusOpen(!plusOpen)}
          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
            plusOpen
              ? 'text-[#34e8bb] bg-[#34e8bb]/10'
              : 'text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#21262d]'
          }`}
          title="Mode & Model settings"
          disabled={isLoading}
        >
          <Plus size={16} />
        </button>

        {/* ── Popover: Mode toggle + Model selector (hidden inside plus icon) ── */}
        {plusOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-[220px] bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden z-30 animate-[fadeIn_0.12s_ease]">
            {/* Mode section */}
            <div className="p-2.5">
              <div className="text-[10px] font-semibold text-[#484f58] uppercase tracking-wider mb-1.5 px-1">Mode</div>
              <div className="flex gap-1 bg-[#0d1117] border border-[#21262d] rounded-lg p-0.5">
                <button
                  onClick={() => setMode('write')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                    mode === 'write'
                      ? 'bg-[#34e8bb]/15 text-[#34e8bb]'
                      : 'text-[#6e7681] hover:text-[#e6edf3]'
                  }`}
                  title="Write mode: agent can read, search, and edit files"
                >
                  <Wrench size={12} />
                  Write
                </button>
                <button
                  onClick={() => setMode('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                    mode === 'chat'
                      ? 'bg-[#34e8bb]/15 text-[#34e8bb]'
                      : 'text-[#6e7681] hover:text-[#e6edf3]'
                  }`}
                  title="Chat mode: answer questions only, no file edits"
                >
                  <MessageSquare size={12} />
                  Chat
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#21262d] mx-2.5" />

            {/* Model section */}
            <div className="p-2.5">
              <div className="text-[10px] font-semibold text-[#484f58] uppercase tracking-wider mb-1.5 px-1">Model</div>
              <div className="space-y-0.5">
                {MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(model.id); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left ${
                      model.id === selectedModel
                        ? 'bg-[#34e8bb]/10 text-[#34e8bb]'
                        : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'
                    }`}
                  >
                    <Brain size={13} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium">{model.label}</div>
                      <div className="text-[10px] text-[#484f58] truncate">{model.desc}</div>
                    </div>
                    {model.id === selectedModel && <Check size={12} className="shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Textarea + mention dropdown ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onInput={(e) => {
            const target = e.currentTarget;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
          placeholder={mode === 'chat'
            ? "Ask a question — I'll answer without editing files..."
            : draggedFiles.length > 0
              ? "Tell me what to build or fix with these files..."
              : "Ask anything, or tell me what to fix or build..."}
          disabled={isLoading && queuedMessages.length === 0}
          rows={1}
          className="w-full bg-transparent resize-none outline-none text-[#e6edf3] placeholder-[#484f58] text-[13px] leading-[1.5] min-h-[28px] max-h-[120px] overflow-hidden whitespace-pre-wrap break-words disabled:opacity-50 py-1"
        />

        {/* @-mention autocomplete dropdown */}
        {mentionQuery !== null && mentionFiles.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#161b22] border border-[#30363d] rounded-md shadow-lg overflow-hidden z-20 max-h-[200px] overflow-y-auto">
            <div className="px-2 py-1 text-[10px] text-[#484f58] uppercase tracking-wider border-b border-[#21262d]">
              Files
            </div>
            {mentionFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => handleMentionSelect(file.path)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#1f2428] transition-colors text-left"
              >
                <FileText size={12} className="text-[#6e7681] shrink-0" />
                <span className="text-[12px] text-[#e6edf3] truncate">{file.path}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Send button — minimal, calm ── */}
      <button
        onClick={() => handleSend()}
        disabled={(isLoading && queuedMessages.length === 0) || !input.trim()}
        className="flex items-center justify-center w-7 h-7 bg-[#34e8bb] hover:bg-[#2dd4a8] text-[#0d1117] rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
        title={isLoading ? "Queue message" : "Send (Enter)"}
      >
        {isLoading ? (
          <Plus size={15} className="rotate-45" />
        ) : (
          <Send size={14} />
        )}
      </button>

      {/* Subtle mode indicator — tiny text at bottom-right of input box */}
      <div className="absolute -bottom-4 left-9 flex items-center gap-2 text-[9px] text-[#484f58] select-none pointer-events-none">
        <span className={mode === 'write' ? 'text-[#34e8bb]/50' : ''}>{mode === 'write' ? 'Write' : 'Chat'}</span>
        <span>·</span>
        <span className={selectedModel === currentModel.id ? 'text-[#34e8bb]/50' : ''}>{currentModel.label}</span>
      </div>
    </div>
  );
}

// --- Plan Card: shows agent's step-by-step plan (Windsurf style) ---

function PlanCard({ plan }: { plan: AgentPlan }) {
  const [expanded, setExpanded] = useState(true);

  const actionIcons: Record<string, React.ReactNode> = {
    search: <Search size={12} className="text-[#34e8bb]" />,
    read: <FileText size={12} className="text-[#8b949e]" />,
    edit: <Code2 size={12} className="text-[#58a6ff]" />,
    create: <Plus size={12} className="text-[#3fb950]" />,
    verify: <AlertCircle size={12} className="text-[#d29922]" />,
    answer: <MessageSquare size={12} className="text-[#a371f7]" />,
  };

  return (
    <div className="mb-3 rounded-lg border border-[#d29922]/20 bg-[#d29922]/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#d29922]/10 transition-colors"
      >
        <ChevronRight
          size={14}
          className={`text-[#d29922] transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <Lightbulb size={13} className="text-[#d29922]" />
        <span className="text-[11px] font-medium text-[#d29922] uppercase tracking-wider">
          Plan
        </span>
        <span className="text-[12px] text-[#e6edf3] truncate flex-1 text-left">{plan.summary}</span>
        <span className="text-[10px] text-[#6e7681] shrink-0">{plan.steps.length} steps</span>
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {plan.steps.map((step) => (
            <div key={step.id} className="flex items-start gap-2 py-0.5">
              <span className="text-[10px] text-[#484f58] shrink-0 w-4 text-right">{step.id}</span>
              <span className="shrink-0 mt-0.5">{actionIcons[step.action] || <Wrench size={12} className="text-[#6e7681]" />}</span>
              <span className="text-[12px] text-[#e6edf3] leading-tight flex-1">
                {step.goal}
                {step.file && <span className="text-[#58a6ff] font-mono text-[11px] ml-1.5">→ {step.file}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- LCS-based diff computation ---

interface DiffLine {
  type: 'add' | 'del' | 'ctx';
  oldNum: number | null;
  newNum: number | null;
  content: string;
}

function computeLcsDiff(oldText: string, newText: string, startLine?: number): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const start = startLine || 1;

  // Build LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m, j = n;
  const tempResult: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      tempResult.push({ type: 'ctx', oldNum: start + i - 1, newNum: start + j - 1, content: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tempResult.push({ type: 'add', oldNum: null, newNum: start + j - 1, content: newLines[j - 1] });
      j--;
    } else if (i > 0) {
      tempResult.push({ type: 'del', oldNum: start + i - 1, newNum: null, content: oldLines[i - 1] });
      i--;
    }
  }

  tempResult.reverse();
  return tempResult;
}

// --- Diff card with LCS-based diff + per-file accept/reject (Windsurf style) ---

function DiffCard({ edit, onAccept, onReject }: { edit: PendingEdit; onAccept: () => void; onReject: () => void }) {
  const [expanded, setExpanded] = useState(false);

  // Use LCS-based diff for accurate line-level changes
  const diffLines = useMemo(() => {
    if (edit.action === 'create_file') {
      // For new files, show all lines as additions
      return edit.newContent.split('\n').map((line, i) => ({
        type: 'add' as const,
        oldNum: null,
        newNum: i + 1,
        content: line,
      }));
    }
    return computeLcsDiff(edit.oldContent, edit.newContent, edit.startLine);
  }, [edit]);

  // Count changes
  const addedCount = diffLines.filter(l => l.type === 'add').length;
  const removedCount = diffLines.filter(l => l.type === 'del').length;

  // Show first 30 lines when collapsed, all when expanded
  const visibleLines = expanded ? diffLines : diffLines.slice(0, 30);
  const hasMore = diffLines.length > 30;

  return (
    <div className="bg-[#0d1117] border border-[#21262d] rounded-md overflow-hidden">
      {/* Header: file info + change stats + per-file accept/reject */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#21262d]">
        <div className="flex items-center gap-2 min-w-0">
          {edit.action === 'create_file' ? (
            <span className="flex items-center gap-1 text-[#3fb950] text-[12px] shrink-0">
              <Plus size={12} />
              New
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#58a6ff] text-[12px] shrink-0">
              <Code2 size={12} />
              Edit
            </span>
          )}
          <span className="font-mono text-[#8b949e] truncate text-[11px]">{edit.filePath}</span>
          {edit.searchMatch ? (
            <span className="text-[10px] text-[#d29922] font-mono shrink-0">search-replace</span>
          ) : edit.startLine ? (
            <span className="text-[10px] text-[#484f58] font-mono shrink-0">L{edit.startLine}</span>
          ) : null}
          {/* Change stats */}
          {addedCount > 0 && <span className="text-[10px] text-[#3fb950] font-mono shrink-0">+{addedCount}</span>}
          {removedCount > 0 && <span className="text-[10px] text-[#f85149] font-mono shrink-0">-{removedCount}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onAccept}
            className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-[#3fb950] hover:bg-[#238636]/20 rounded transition-colors"
            title="Accept this change"
          >
            <Check size={11} />
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-[#f85149] hover:bg-[#f85149]/20 rounded transition-colors"
            title="Reject this change"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-2.5 py-1.5 text-[11px] text-[#6e7681] border-b border-[#21262d] bg-[#161b22]/50">
        {edit.description}
      </div>

      {/* Diff preview — LCS-based with proper line tracking */}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-[11px] font-mono border-collapse">
          <tbody>
            {visibleLines.map((line, idx) => (
              <tr key={idx} className={
                line.type === 'add' ? 'bg-[#238636]/15' :
                line.type === 'del' ? 'bg-[#f85149]/15' :
                ''
              }>
                <td className="text-[#484f58] text-right px-1.5 select-none w-[32px] align-top">
                  {line.oldNum ?? ''}
                </td>
                <td className="text-[#484f58] text-right px-1.5 select-none w-[32px] align-top border-l border-[#21262d]">
                  {line.newNum ?? ''}
                </td>
                <td className="px-1.5 whitespace-pre align-top border-l border-[#21262d]">
                  <span className={
                    line.type === 'add' ? 'text-[#3fb950]' :
                    line.type === 'del' ? 'text-[#f85149]' :
                    'text-[#8b949e]'
                  }>
                    {line.type === 'add' ? '+ ' : line.type === 'del' ? '- ' : '  '}
                    {line.content}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand/collapse toggle */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-2.5 py-1.5 text-[11px] text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#1f2428] transition-colors border-t border-[#21262d] text-left"
        >
          {expanded ? 'Show less' : `Show all ${diffLines.length} lines (+${addedCount} -${removedCount})`}
        </button>
      )}
    </div>
  );
}

// --- Windsurf-style markdown renderer with syntax-highlighted code blocks + copy/insert ---

function MarkdownRenderer({ content, onInsertCode, onOpenFile }: { content: string; onInsertCode?: (code: string) => void; onOpenFile?: (filePath: string) => void }) {
  // Check if a string looks like a file path
  const isFilePath = (text: string): boolean => {
    const trimmed = text.trim();
    // Has a dot with extension, or contains / or \, and no spaces (single-word paths)
    if (trimmed.length < 2 || trimmed.length > 200) return false;
    if (trimmed.includes(' ')) return false;
    // Looks like: src/App.tsx, App.tsx, components/ide/Store.ts, etc.
    return /^[\w./\\-]+\.\w+$/.test(trimmed) || (/^[\w./\\-]+$/.test(trimmed) && (trimmed.includes('/') || trimmed.includes('\\')));
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks: dark bg, language label, copy + insert buttons — Windsurf style
        code({ className, children }: { className?: string; children?: React.ReactNode }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeText = String(children).replace(/\n$/, '');
          const isBlock = match || codeText.includes('\n');

          if (!isBlock) {
            // Inline code — check if it's a file path
            const text = codeText.trim();
            if (onOpenFile && isFilePath(text)) {
              return (
                <code
                  className="bg-[#161b22] text-[#58a6ff] px-1.5 py-0.5 rounded text-[12px] font-mono cursor-pointer hover:bg-[#1f2428] hover:text-[#34e8bb] transition-colors underline decoration-dotted"
                  onClick={() => onOpenFile(text)}
                  title={`Click to open ${text}`}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-[#161b22] text-[#34e8bb] px-1.5 py-0.5 rounded text-[12px] font-mono">
                {children}
              </code>
            );
          }

          // Block code — full syntax highlighting + header bar with line numbers
          const lang = match ? match[1] : 'text';
          return <CodeBlock code={codeText} language={lang} onInsert={onInsertCode} />;
        },
        // Headings — Windsurf style: clean, weighted, not oversized
        h1: ({ children }) => <h1 className="text-[16px] font-semibold text-[#e6edf3] mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[15px] font-semibold text-[#e6edf3] mt-3 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-[14px] font-semibold text-[#e6edf3] mt-3 mb-1.5">{children}</h3>,
        h4: ({ children }) => <h4 className="text-[13px] font-medium text-[#e6edf3] mt-2 mb-1">{children}</h4>,
        // Paragraphs
        p: ({ children }) => <p className="text-[13px] leading-[1.6] text-[#e6edf3] my-2">{children}</p>,
        // Lists
        ul: ({ children }) => <ul className="list-disc list-outside ml-5 my-2 space-y-1 text-[13px] text-[#e6edf3]">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside ml-5 my-2 space-y-1 text-[13px] text-[#e6edf3]">{children}</ol>,
        li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
        // Links — teal accent
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#34e8bb] hover:underline">
            {children}
          </a>
        ),
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#30363d] pl-3 my-2 text-[#8b949e] text-[13px] italic">
            {children}
          </blockquote>
        ),
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full text-[12px] border border-[#30363d] rounded-md overflow-hidden">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="bg-[#161b22] text-[#e6edf3] px-3 py-1.5 text-left border-b border-[#30363d] font-medium">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5 text-[#e6edf3] border-b border-[#21262d]">{children}</td>,
        // Horizontal rule
        hr: () => <hr className="border-[#21262d] my-4" />,
        // Strong / emphasis
        strong: ({ children }) => <strong className="font-semibold text-[#e6edf3]">{children}</strong>,
        em: ({ children }) => <em className="text-[#8b949e]">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// --- Code block with language label, line numbers, copy + insert (Windsurf style) ---

function CodeBlock({ code, language, onInsert }: { code: string; language: string; onInsert?: (code: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-md overflow-hidden border border-[#21262d] bg-[#0d1117]">
      {/* Header bar: language label + copy + insert buttons */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#21262d]">
        <span className="text-[11px] text-[#6e7681] font-mono uppercase tracking-wide">{language}</span>
        <div className="flex items-center gap-3">
          {onInsert && (
            <button
              onClick={() => onInsert(code)}
              className="flex items-center gap-1 text-[11px] text-[#6e7681] hover:text-[#34e8bb] transition-colors"
              title="Insert into active editor"
            >
              <Code2 size={12} />
              <span>Insert</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check size={12} className="text-[#34e8bb]" />
                <span className="text-[#34e8bb]">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* Syntax-highlighted code with line numbers */}
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        lineNumberStyle={{ color: '#484f58', fontSize: '11px', paddingRight: '12px', userSelect: 'none' }}
        customStyle={{
          margin: 0,
          background: '#0d1117',
          padding: '12px 14px',
          fontSize: '12px',
          lineHeight: '1.5',
        }}
        codeTagProps={{ style: { fontFamily: 'var(--font-jetbrains), Consolas, monospace' } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// --- Inline tool-call cards (Windsurf style: expandable per-tool results) ---

function ToolCallCards({ toolCalls }: { toolCalls: AgentThought[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Group action + observation pairs
  const cards: Array<{ action: AgentThought; observation?: AgentThought }> = [];
  for (let i = 0; i < toolCalls.length; i++) {
    const tc = toolCalls[i];
    if (tc.type === 'action') {
      const next = toolCalls[i + 1];
      cards.push({ action: tc, observation: next?.type === 'observation' ? next : undefined });
    }
  }

  if (cards.length === 0) return null;

  const toolIcons: Record<string, React.ReactNode> = {
    edit_file: <Code2 size={13} className="text-[#58a6ff]" />,
    create_file: <Plus size={13} className="text-[#3fb950]" />,
    read_file: <FileText size={13} className="text-[#8b949e]" />,
    search_code: <Search size={13} className="text-[#34e8bb]" />,
    get_problems: <AlertCircle size={13} className="text-[#d29922]" />,
  };

  return (
    <div className="mb-3 space-y-1.5">
      {cards.map((card, idx) => {
        const tool = card.action.tool || '';
        const icon = toolIcons[tool] || <Wrench size={13} className="text-[#8b949e]" />;
        const arg = card.action.toolArgs?.path || card.action.toolArgs?.query || '';
        const isExpanded = expandedId === idx;
        return (
          <div key={idx} className="rounded-md border border-[#21262d] bg-[#161b22] overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : idx)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#1f2428] transition-colors text-left"
            >
              {icon}
              <span className="text-[12px] text-[#e6edf3] font-mono">{tool}</span>
              {arg && <span className="text-[11px] text-[#6e7681] truncate flex-1">{arg}</span>}
              <ChevronRight
                size={12}
                className={`text-[#6e7681] transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
            {isExpanded && card.observation?.detail && (
              <div className="px-3 py-2 border-t border-[#21262d] bg-[#0d1117]">
                <pre className="text-[11px] text-[#8b949e] font-mono whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
                  {card.observation.detail}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Agent Activity Panel (live thoughts during agent run) ---

// --- Animated Agent Status Indicator ---
function AgentIndicator({ status, isStreaming, hasStreamingText, thoughts }: {
  status: string | null;
  isStreaming: boolean;
  hasStreamingText: boolean;
  thoughts: AgentThought[];
}) {
  // Determine current agent phase
  let phase: 'thinking' | 'planning' | 'tool_calling' | 'typing' | 'working';
  let icon: React.ReactNode;
  let label: string;

  if (isStreaming && hasStreamingText) {
    phase = 'typing';
    icon = <span className="flex gap-[2px] items-end h-[14px]">
      <span className="w-[2px] h-[6px] bg-[#34e8bb] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
      <span className="w-[2px] h-[10px] bg-[#34e8bb] rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
      <span className="w-[2px] h-[4px] bg-[#34e8bb] rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
    </span>;
    label = 'Typing...';
  } else if (thoughts.some(t => t.type === 'action')) {
    phase = 'tool_calling';
    icon = <Wrench size={14} className="text-[#58a6ff] animate-pulse" />;
    label = status || 'Calling tools...';
  } else if (thoughts.some(t => t.type === 'plan')) {
    phase = 'planning';
    icon = <Lightbulb size={14} className="text-[#d29922] animate-pulse" />;
    label = status || 'Planning approach...';
  } else if (thoughts.some(t => t.type === 'observation')) {
    phase = 'tool_calling';
    icon = <Search size={14} className="text-[#34e8bb] animate-pulse" />;
    label = status || 'Analyzing results...';
  } else if (thoughts.length > 0) {
    phase = 'working';
    icon = <Loader2 size={14} className="text-[#34e8bb] animate-spin" />;
    label = status || 'Working...';
  } else {
    phase = 'thinking';
    icon = <span className="flex gap-1 items-center">
      <span className="w-[5px] h-[5px] bg-[#34e8bb] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-[5px] h-[5px] bg-[#34e8bb] rounded-full animate-pulse opacity-60" style={{ animationDelay: '200ms' }} />
      <span className="w-[5px] h-[5px] bg-[#34e8bb] rounded-full animate-pulse opacity-30" style={{ animationDelay: '400ms' }} />
    </span>;
    label = status || 'Thinking...';
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-1 text-[13px] text-[#8b949e]">
      <span className="shrink-0 flex items-center justify-center w-[20px] h-[20px]">
        {icon}
      </span>
      <span className="text-[#8b949e]">{label}</span>
      {/* Animated progress dots */}
      <span className="flex gap-[3px] ml-1">
        <span className={`w-[3px] h-[3px] rounded-full ${phase === 'thinking' ? 'bg-[#a371f7]' : phase === 'planning' ? 'bg-[#d29922]' : phase === 'tool_calling' ? 'bg-[#58a6ff]' : phase === 'typing' ? 'bg-[#34e8bb]' : 'bg-[#34e8bb]'} animate-pulse`} style={{ animationDelay: '0ms' }} />
        <span className={`w-[3px] h-[3px] rounded-full ${phase === 'thinking' ? 'bg-[#a371f7]' : phase === 'planning' ? 'bg-[#d29922]' : phase === 'tool_calling' ? 'bg-[#58a6ff]' : phase === 'typing' ? 'bg-[#34e8bb]' : 'bg-[#34e8bb]'} animate-pulse`} style={{ animationDelay: '200ms' }} />
        <span className={`w-[3px] h-[3px] rounded-full ${phase === 'thinking' ? 'bg-[#a371f7]' : phase === 'planning' ? 'bg-[#d29922]' : phase === 'tool_calling' ? 'bg-[#58a6ff]' : phase === 'typing' ? 'bg-[#34e8bb]' : 'bg-[#34e8bb]'} animate-pulse`} style={{ animationDelay: '400ms' }} />
      </span>
    </div>
  );
}

const thoughtIcons: Record<AgentThought['type'], React.ReactNode> = {
  thinking: <Brain size={13} className="text-[#a371f7]" />,
  plan: <Lightbulb size={13} className="text-[#d29922]" />,
  action: <Wrench size={13} className="text-[#58a6ff]" />,
  observation: <Search size={13} className="text-[#34e8bb]" />,
  result: <CheckCircle2 size={13} className="text-[#3fb950]" />,
};

const thoughtLabels: Record<AgentThought['type'], string> = {
  thinking: 'Thinking',
  plan: 'Planning',
  action: 'Acting',
  observation: 'Observing',
  result: 'Done',
};

function AgentActivityPanel({
  thoughts,
  status,
  collapsed,
}: {
  thoughts: AgentThought[];
  status: string | null;
  collapsed?: boolean;
}) {
  const [expanded, setExpanded] = useState(!collapsed);
  const [showAll, setShowAll] = useState(false);
  const visibleThoughts = showAll ? thoughts : thoughts.slice(-6);
  const hasMore = thoughts.length > 6;

  return (
    <div className="mb-3 rounded-lg border border-[#21262d] bg-[#161b22] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#1f2428] transition-colors"
      >
        <ChevronRight
          size={14}
          className={`text-[#6e7681] transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <Brain size={13} className="text-[#34e8bb]" />
        <span className="text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">
          Agent Activity
        </span>
        <span className="text-[10px] text-[#484f58]">
          {thoughts.length} step{thoughts.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        {status && !expanded && (
          <span className="flex items-center gap-1 text-[11px] text-[#6e7681]">
            <Loader2 size={10} className="animate-spin text-[#34e8bb]" />
            {status}
          </span>
        )}
      </button>

      {/* Thought List */}
      {expanded && (
        <div className="px-3 pb-2 space-y-1 max-h-[200px] overflow-y-auto">
          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-[11px] text-[#6e7681] hover:text-[#e6edf3] transition-colors py-0.5"
            >
              Show all {thoughts.length} steps...
            </button>
          )}
          {visibleThoughts.map((thought, idx) => {
            const isLast = idx === visibleThoughts.length - 1 && thought.type !== 'result';
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 py-0.5 ${thought.type === 'result' ? 'pt-1 border-t border-[#21262d] mt-1' : ''}`}
              >
                <div className="mt-0.5 shrink-0">
                  {isLast ? (
                    <span className="relative flex">
                      {thoughtIcons[thought.type]}
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#34e8bb] rounded-full animate-pulse" />
                    </span>
                  ) : (
                    thoughtIcons[thought.type]
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[12px] text-[#e6edf3] leading-tight">
                    {thought.title}
                  </span>
                  {thought.detail && (
                    <span className="text-[11px] text-[#6e7681] leading-tight mt-0.5 truncate">
                      {thought.detail}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-[#484f58] shrink-0 mt-0.5 uppercase tracking-wider">
                  {thoughtLabels[thought.type]}
                </span>
              </div>
            );
          })}
          {/* Live status indicator */}
          {status && thoughts[thoughts.length - 1]?.type !== 'result' && (
            <div className="flex items-center gap-2 py-0.5 pt-1">
              <Loader2 size={12} className="text-[#34e8bb] animate-spin shrink-0" />
              <span className="text-[11px] text-[#6e7681]">{status}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
