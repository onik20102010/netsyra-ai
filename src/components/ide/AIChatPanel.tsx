// d:\netsyra\src\components\ide\AIChatPanel.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useIdeStore, getDB } from "@/ide";
import { Send, X, Bot, Loader2, FileText, Folder, Zap, Eye, Undo2, Check, XCircle, AlertCircle, Brain, Search, Wrench, Lightbulb, CheckCircle2, ChevronRight, Copy, Plus, Code2, MessageSquare } from "lucide-react";
import { AgentOrchestrator, type ChatMessage, type PendingEdit, type AgentThought } from "@/agents/AgentOrchestrator";
import { useAuth } from "@/hooks/useAuth";
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
}

// Available models for the selector pill (Windsurf style)
const MODELS = [
  { id: 'auto', label: 'Auto', desc: 'Automatically picks the best model' },
  { id: 'fast', label: 'Fast', desc: 'Quick responses for simple tasks' },
  { id: 'pro', label: 'Pro', desc: 'Most capable for complex tasks' },
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

export function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m Cascade, your AI coding assistant. I can help you understand your code, make changes, and implement features. What would you like to work on?',
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agentRef = useRef<AgentOrchestrator | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toggleRightPanel = useIdeStore((s) => s.toggleRightPanel);
  const workspace = useIdeStore((s) => s.workspace);
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const problems = useIdeStore((s) => s.problems);

  const allProblems = Object.values(problems).flat();
  const errorCount = allProblems.filter(p => p.severity === 'error').length;
  const warningCount = allProblems.filter(p => p.severity === 'warning').length;

  const activeFile = openFiles.find(f => f.id === activeFileId);
  const { user } = useAuth();
  const userId = user?.id || 'local';
  const db = getDB(userId);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = (overrideInput ?? input).trim();
    if (!textToSend || isLoading) return;

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
          setStreamingText(fullText);
        },
        (thought) => {
          collectedThoughts.push(thought);
          setThoughts(prev => [...prev, thought]);
        }
      );
      agentRef.current = agent;

      const result = await agent.run(effectivePrompt, chatHistory);

      setIsStreaming(false);
      setAgentStatus(null);
      setStreamingText('');
      setThoughts([]);

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

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header — Windsurf Cascade style */}
      <div className="flex items-center justify-between h-[40px] px-3 border-b border-[#1f2428] shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-[#34e8bb]" />
          <span className="text-[13px] font-semibold text-[#e6edf3]">Cascade</span>
          <span className="text-[10px] text-[#6e7681] font-medium uppercase tracking-wider ml-1">Agent</span>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Messages — Windsurf style: full-width, no max-width constraint */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="w-full px-4 py-4 space-y-5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              {message.role === 'assistant' ? (
                /* Assistant: no bubble, full-width markdown + inline tool cards, Windsurf style */
                <div className="w-full text-[13px] leading-[1.6] text-[#e6edf3] break-words">
                  {/* Inline tool-call cards (Windsurf style) */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <ToolCallCards toolCalls={message.toolCalls} />
                  )}
                  <MarkdownRenderer content={message.content} onInsertCode={handleInsertCode} />
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
                    <MarkdownRenderer content={streamingText} onInsertCode={handleInsertCode} />
                    <span className="inline-block w-1.5 h-3.5 bg-[#34e8bb] animate-pulse ml-0.5 align-middle rounded-sm" />
                  </div>
                ) : !isStreaming ? (
                  <div className="flex items-center gap-2 text-[#6e7681] text-[13px] py-1">
                    <Bot size={15} className="text-[#34e8bb]" />
                    {agentStatus ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin text-[#34e8bb]" />
                        {agentStatus}
                      </span>
                    ) : (
                      <span>Thinking...</span>
                    )}
                  </div>
                ) : null}
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

      {/* Input — Windsurf style: rounded box, plus icon, teal send, mode toggle, model selector */}
      <div
        className={`bg-[#0d1117] border-t border-[#1f2428] p-3 flex flex-col gap-2 sticky bottom-0 shrink-0 transition-all duration-200 ease-in-out ${isDragging ? 'bg-[#161b22]' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-full flex flex-col gap-2">
          {/* Context pills — show attached files persistently (Windsurf style) */}
          {draggedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pb-1">
              {draggedFiles.map((file, index) => (
                <div key={index} className="bg-[#161b22] text-[#8b949e] text-[11px] px-2 py-1 rounded-md border border-[#30363d] flex items-center gap-1.5">
                  <FileText size={11} className="text-[#6e7681]" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <X size={11} className="cursor-pointer hover:text-[#f85149] transition-colors" onClick={() => removeDraggedFile(index)} />
                </div>
              ))}
            </div>
          )}

          {/* Queued messages indicator (Windsurf style) */}
          {queuedMessages.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#6e7681] px-1">
              <Loader2 size={11} className="animate-spin text-[#34e8bb]" />
              <span>{queuedMessages.length} message{queuedMessages.length > 1 ? 's' : ''} queued</span>
            </div>
          )}

          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-[#34e8bb]/10 border-2 border-dashed border-[#34e8bb]/40 rounded flex items-center justify-center pointer-events-none">
              <span className="text-[#34e8bb] font-medium text-[13px]">Drop files here</span>
            </div>
          )}

          {/* Input box — rounded, dark, with plus icon + textarea + send */}
          <div className="relative flex items-end gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 focus-within:border-[#34e8bb]/40 transition-colors">
            {/* Plus icon (Windsurf attachment style) */}
            <button
              className="flex items-center justify-center w-7 h-7 rounded-md text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors shrink-0"
              title="Attach file (drag from Explorer)"
              disabled={isLoading}
            >
              <Plus size={16} />
            </button>

            <div className="flex-1 flex flex-col gap-1.5 min-w-0 relative">
              {/* Agent capability indicator — compact, muted */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#34e8bb] bg-[#34e8bb]/10 border border-[#34e8bb]/20">
                  <Zap size={10} />
                  Agent
                </span>
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
                className="flex-1 w-full bg-transparent resize-none outline-none text-[#e6edf3] placeholder-[#484f58] text-[13px] leading-[1.5] min-h-[36px] max-h-[120px] overflow-hidden whitespace-pre-wrap break-words disabled:opacity-50"
              />

              {/* @-mention autocomplete dropdown (Windsurf style) */}
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

            {/* Send button — teal accent, Windsurf style. In chat mode, always enabled while typing */}
            <button
              onClick={() => handleSend()}
              disabled={(isLoading && queuedMessages.length === 0) || !input.trim()}
              className="flex items-center justify-center w-7 h-7 bg-[#34e8bb] hover:bg-[#2dd4a8] text-[#0d1117] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title={isLoading ? "Queue message" : "Send (Enter)"}
            >
              {isLoading ? (
                <Plus size={15} />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>

          {/* Bottom bar: Write/Chat mode toggle + model selector (Windsurf style) */}
          <div className="flex items-center justify-between gap-2">
            {/* Mode toggle — Write | Chat */}
            <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-md p-0.5">
              <button
                onClick={() => setMode('write')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === 'write'
                    ? 'bg-[#34e8bb]/15 text-[#34e8bb]'
                    : 'text-[#6e7681] hover:text-[#e6edf3]'
                }`}
                title="Write mode: agent can read, search, and edit files"
              >
                <Wrench size={11} />
                Write
              </button>
              <button
                onClick={() => setMode('chat')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === 'chat'
                    ? 'bg-[#34e8bb]/15 text-[#34e8bb]'
                    : 'text-[#6e7681] hover:text-[#e6edf3]'
                }`}
                title="Chat mode: answer questions only, no file edits"
              >
                <MessageSquare size={11} />
                Chat
              </button>
            </div>

            {/* Model selector pill */}
            <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Diff card with red/green line-by-line preview + per-file accept/reject (Windsurf style) ---

function DiffCard({ edit, onAccept, onReject }: { edit: PendingEdit; onAccept: () => void; onReject: () => void }) {
  const [expanded, setExpanded] = useState(false);

  // Compute simple line-by-line diff
  const oldLines = edit.oldContent.split('\n');
  const newLines = edit.newContent.split('\n');
  const maxLines = Math.max(oldLines.length, newLines.length);

  const diffLines: Array<{ type: 'add' | 'del' | 'ctx'; oldNum: number | null; newNum: number | null; content: string }> = [];
  let oldNum = edit.startLine || 1;
  let newNum = edit.startLine || 1;

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === newLine) {
      diffLines.push({ type: 'ctx', oldNum: oldNum++, newNum: newNum++, content: oldLine ?? '' });
    } else {
      if (oldLine !== undefined) {
        diffLines.push({ type: 'del', oldNum: oldNum++, newNum: null, content: oldLine });
      }
      if (newLine !== undefined) {
        diffLines.push({ type: 'add', oldNum: null, newNum: newNum++, content: newLine });
      }
    }
  }

  // Show first 20 lines when collapsed, all when expanded
  const visibleLines = expanded ? diffLines : diffLines.slice(0, 20);
  const hasMore = diffLines.length > 20;

  return (
    <div className="bg-[#0d1117] border border-[#21262d] rounded-md overflow-hidden">
      {/* Header: file info + per-file accept/reject */}
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
          {edit.startLine && (
            <span className="text-[10px] text-[#484f58] font-mono shrink-0">L{edit.startLine}</span>
          )}
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

      {/* Diff preview */}
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
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
          {expanded ? 'Show less' : `Show all ${diffLines.length} lines`}
        </button>
      )}
    </div>
  );
}

// --- Model selector pill (Windsurf style dropdown) ---

function ModelSelector({ selectedModel, onSelect }: { selectedModel: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#6e7681] hover:text-[#e6edf3] bg-[#161b22] border border-[#30363d] rounded-md transition-colors"
        title="Select model"
      >
        <Brain size={11} />
        <span>{current.label}</span>
        <ChevronRight size={10} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-[180px] bg-[#161b22] border border-[#30363d] rounded-md shadow-lg overflow-hidden z-30">
          {MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => { onSelect(model.id); setOpen(false); }}
              className={`w-full flex items-start gap-2 px-2.5 py-2 hover:bg-[#1f2428] transition-colors text-left border-b border-[#21262d] last:border-0 ${
                model.id === selectedModel ? 'bg-[#34e8bb]/5' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-[#e6edf3]">{model.label}</span>
                  {model.id === selectedModel && <Check size={11} className="text-[#34e8bb]" />}
                </div>
                <div className="text-[10px] text-[#6e7681] mt-0.5">{model.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Windsurf-style markdown renderer with syntax-highlighted code blocks + copy/insert ---

function MarkdownRenderer({ content, onInsertCode }: { content: string; onInsertCode?: (code: string) => void }) {
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
            // Inline code — subtle bg, monospace
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
