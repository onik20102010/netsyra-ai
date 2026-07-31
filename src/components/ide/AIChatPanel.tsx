// d:\netsyra\src\components\ide\AIChatPanel.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useIdeStore, getDB } from "@/ide";
import { Send, X, Bot, Loader2, FileText, Folder, Zap, Eye, Undo2, Check, XCircle, AlertCircle, Brain, Search, FileCode, Wrench, Lightbulb, CheckCircle2, ChevronRight } from "lucide-react";
import { AgentOrchestrator, type ChatMessage, type PendingEdit, type AgentThought } from "@/agents/AgentOrchestrator";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachedFiles?: Array<{ path: string; name: string; id: string }>;
}

export function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. I can help you understand your code, make changes, and implement features. What would you like to work on?',
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
  const agentRef = useRef<AgentOrchestrator | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRightPanelOpen = useIdeStore((s) => s.isRightPanelOpen);
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      attachedFiles: draggedFiles.length > 0 ? draggedFiles : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setDraggedFiles([]);
    setIsLoading(true);

    try {
      // Build chat history for conversation memory
      const chatHistory: ChatMessage[] = messages
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      // Start streaming display
      setStreamingText('');
      setIsStreaming(true);

      // Unified agent: handles both questions and code actions
      const agent = new AgentOrchestrator(
        db,
        (status) => setAgentStatus(status),
        (token, fullText) => {
          setStreamingText(fullText);
        },
        (thought) => {
          setThoughts(prev => [...prev, thought]);
        }
      );
      agentRef.current = agent;

      const result = await agent.run(currentInput, chatHistory);

      setIsStreaming(false);
      setAgentStatus(null);
      setStreamingText('');
      setThoughts([]);

      // Build response text with action summary
      let responseText = result.message;

      if (result.filesRead.length > 0 && result.pendingEdits.length === 0) {
        responseText += '\n\n**Files examined:** ' + result.filesRead.map(f => `\`${f}\``).join(', ');
      }

      // Show action trace if tools were used
      if (result.actions.length > 1) {
        const toolActions = result.actions.filter(a => a.tool !== 'answer');
        if (toolActions.length > 0) {
          responseText += '\n\n<details>\n<summary>Agent actions</summary>\n\n';
          toolActions.forEach(a => {
            const icon = a.tool === 'edit_file' ? '✏️' : a.tool === 'create_file' ? '📝' : a.tool === 'read_file' ? '📖' : a.tool === 'search_code' ? '🔍' : a.tool === 'get_problems' ? '⚠️' : '📋';
            responseText += `${icon} **${a.tool}**: ${a.args.path || a.args.query || ''}\n`;
          });
          responseText += '\n</details>';
        }
      }

      // Show pending edits for user approval
      if (result.pendingEdits.length > 0) {
        setPendingEdits(result.pendingEdits);
        responseText += `\n\n**${result.pendingEdits.length} change${result.pendingEdits.length > 1 ? 's' : ''} ready for review.** Apply or dismiss below.`;
      }

      if (result.canUndo) {
        setCanUndo(true);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      }]);
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

  const handleDismissEdits = () => {
    if (agentRef.current) {
      agentRef.current.dismissPendingEdits();
    }
    setPendingEdits([]);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-300">
      {/* Header */}
      <div className="flex items-center justify-between h-[35px] px-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-zinc-400" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">IDE Chat</span>
        </div>
        <div className="flex items-center gap-1">
          {canUndo && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
              title="Undo all changes from last agent run"
            >
              <Undo2 size={12} />
              Undo
            </button>
          )}
          <button
            onClick={toggleRightPanel}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Context Info */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="text-[11px] text-zinc-500">
          {workspace ? (
            <div className="flex items-center gap-2">
              <Folder size={12} />
              <span className="truncate">{workspace.name}</span>
            </div>
          ) : (
            <span>No workspace opened</span>
          )}
        </div>
        {activeFile && (
          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
            <FileText size={12} />
            <span className="truncate">{activeFile.path}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' ? (
                <div className="text-[15px] leading-7 text-zinc-300 max-w-full break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({node, ...props}) => (
                        <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/50 my-4 overflow-x-auto" {...props as any} />
                      ),
                      code: ({node, ...props}) => (
                        <code className="text-sm text-zinc-200 font-mono" {...props as any} />
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="bg-blue-600 max-w-[90%] lg:max-w-[70%] p-3.5 rounded-2xl rounded-tr-sm text-white self-end break-words">
                  <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
                  {message.attachedFiles && message.attachedFiles.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-[11px] text-white/70 mb-1">Attached files:</p>
                      {message.attachedFiles.map((file, idx) => (
                        <div key={idx} className="text-[11px] flex items-center gap-1">
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
              <div className="max-w-full w-full">
                {/* Live Agent Activity Panel */}
                {thoughts.length > 0 && !isStreaming && (
                  <AgentActivityPanel thoughts={thoughts} status={agentStatus} />
                )}

                {/* Streaming text response */}
                {isStreaming && streamingText ? (
                  <div className="text-[15px] leading-7 text-zinc-300 break-words">
                    {thoughts.length > 0 && (
                      <AgentActivityPanel thoughts={thoughts} status={agentStatus} collapsed />
                    )}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre: ({node, ...props}) => (
                          <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/50 my-4 overflow-x-auto" {...props as any} />
                        ),
                        code: ({node, ...props}) => (
                          <code className="text-sm text-zinc-200 font-mono" {...props as any} />
                        )
                      }}
                    >
                      {streamingText}
                    </ReactMarkdown>
                    <span className="inline-block w-2 h-4 bg-zinc-400 animate-pulse ml-0.5 align-middle" />
                  </div>
                ) : !isStreaming ? (
                  <div className="flex items-center gap-2 text-zinc-500 text-[13px]">
                    <Bot size={16} className="text-zinc-400" />
                    {agentStatus ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
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
              <div className="bg-zinc-800/80 border border-amber-500/30 rounded-lg p-3 max-w-full w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-amber-400 text-[12px]">
                    <Eye size={14} />
                    <span>{pendingEdits.length} change{pendingEdits.length > 1 ? 's' : ''} ready for review</span>
                  </div>
                  {canUndo && (
                    <button
                      onClick={handleUndo}
                      className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                      title="Undo all changes from last agent run"
                    >
                      <Undo2 size={11} />
                      Undo
                    </button>
                  )}
                </div>
                <div className="space-y-2 mb-3">
                  {pendingEdits.map((edit) => (
                    <div key={edit.id} className="bg-zinc-900/60 border border-zinc-700/50 rounded p-2">
                      <div className="flex items-center gap-2 text-[12px] text-zinc-300 mb-1">
                        {edit.action === 'create_file' ? (
                          <span className="text-green-400">📝 New file</span>
                        ) : (
                          <span className="text-blue-400">✏️ Edit</span>
                        )}
                        <span className="font-mono text-zinc-400 truncate">{edit.filePath}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500">{edit.description}</div>
                      {edit.action === 'edit_file' && edit.startLine && (
                        <div className="mt-1 text-[10px] text-zinc-600 font-mono">
                          Lines {edit.startLine}-{edit.endLine}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyEdits}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[12px] rounded transition-colors"
                  >
                    <Check size={13} />
                    Apply all
                  </button>
                  <button
                    onClick={handleDismissEdits}
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[12px] rounded transition-colors"
                  >
                    <XCircle size={13} />
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div
        className={`bg-zinc-900 border-t border-zinc-800 p-4 flex flex-col gap-2 sticky bottom-0 shrink-0 transition-all duration-200 ease-in-out ${isDragging ? 'bg-zinc-800' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-2">
          {/* File Previews */}
          {draggedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pb-1">
              {draggedFiles.map((file, index) => (
                <div key={index} className="bg-zinc-800/60 text-zinc-300 text-xs px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-2">
                  <FileText size={12} className="text-zinc-400" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <X size={12} className="cursor-pointer hover:text-white transition-colors" onClick={() => removeDraggedFile(index)} />
                </div>
              ))}
            </div>
          )}

          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-zinc-700/20 border-2 border-dashed border-zinc-600 rounded flex items-center justify-center pointer-events-none">
              <span className="text-zinc-400 font-medium">Drop files here</span>
            </div>
          )}

          {/* Input Field + Send Button */}
          <div className="flex items-end gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              {/* Agent capability indicator */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border text-amber-400 bg-amber-500/10 border-amber-500/30">
                  <Zap size={11} />
                  Agent
                </span>
                {(errorCount > 0 || warningCount > 0) && (
                  <button
                    onClick={handleFixErrors}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title={`${errorCount} error(s), ${warningCount} warning(s) — Click to auto-fix`}
                  >
                    <AlertCircle size={11} />
                    {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : `${warningCount} warning${warningCount > 1 ? 's' : ''}`}
                  </button>
                )}
                <span className="text-[10px] text-zinc-500">
                  Can answer, read & edit files, search code, fix problems
                </span>
              </div>

              <textarea
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
                placeholder={draggedFiles.length > 0 ? "Ask about these files, or ask me to fix/edit them..." : "Ask me anything, or tell me what to fix or build..."}
                disabled={isLoading}
                rows={1}
                className="flex-1 w-full bg-transparent resize-none outline-none text-zinc-200 placeholder-zinc-500 text-[15px] min-h-[40px] max-h-[120px] overflow-hidden whitespace-pre-wrap break-words disabled:opacity-50"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Agent Activity Panel (live thoughts during agent run) ---

const thoughtIcons: Record<AgentThought['type'], React.ReactNode> = {
  thinking: <Brain size={13} className="text-purple-400" />,
  plan: <Lightbulb size={13} className="text-yellow-400" />,
  action: <Wrench size={13} className="text-blue-400" />,
  observation: <Search size={13} className="text-cyan-400" />,
  result: <CheckCircle2 size={13} className="text-green-400" />,
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
    <div className="mb-3 rounded-lg border border-zinc-700/50 bg-zinc-800/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/60 transition-colors"
      >
        <ChevronRight
          size={14}
          className={`text-zinc-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <Brain size={13} className="text-purple-400" />
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
          Agent Activity
        </span>
        <span className="text-[10px] text-zinc-600">
          {thoughts.length} step{thoughts.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        {status && !expanded && (
          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <Loader2 size={10} className="animate-spin" />
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
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors py-0.5"
            >
              Show all {thoughts.length} steps...
            </button>
          )}
          {visibleThoughts.map((thought, idx) => {
            const isLast = idx === visibleThoughts.length - 1 && thought.type !== 'result';
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 py-0.5 ${thought.type === 'result' ? 'pt-1 border-t border-zinc-700/30 mt-1' : ''}`}
              >
                <div className="mt-0.5 shrink-0">
                  {isLast ? (
                    <span className="relative flex">
                      {thoughtIcons[thought.type]}
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    </span>
                  ) : (
                    thoughtIcons[thought.type]
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[12px] text-zinc-300 leading-tight">
                    {thought.title}
                  </span>
                  {thought.detail && (
                    <span className="text-[11px] text-zinc-500 leading-tight mt-0.5 truncate">
                      {thought.detail}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-zinc-600 shrink-0 mt-0.5 uppercase tracking-wider">
                  {thoughtLabels[thought.type]}
                </span>
              </div>
            );
          })}
          {/* Live status indicator */}
          {status && thoughts[thoughts.length - 1]?.type !== 'result' && (
            <div className="flex items-center gap-2 py-0.5 pt-1">
              <Loader2 size={12} className="text-zinc-500 animate-spin shrink-0" />
              <span className="text-[11px] text-zinc-500">{status}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
