// d:\netsyra\src\components\ide\AIChatPanel.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useIdeStore } from "@/ide";
import { Send, X, Bot, Loader2, FileText, Folder } from "lucide-react";
import { callGroqAPI, getSystemPrompt } from "@/ide/grok-api";
import { getActiveFileContext, getWorkspaceStructure } from "@/ide/agent";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRightPanelOpen = useIdeStore((s) => s.isRightPanelOpen);
  const toggleRightPanel = useIdeStore((s) => s.toggleRightPanel);
  const workspace = useIdeStore((s) => s.workspace);
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);

  const activeFile = openFiles.find(f => f.id === activeFileId);

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
    setInput('');
    setDraggedFiles([]);
    setIsLoading(true);

    try {
      // Get context about the current workspace and active file
      const fileContext = getActiveFileContext();
      const workspaceStructure = getWorkspaceStructure();

      // Get content of dragged files for context
      const draggedFilesContext = draggedFiles.map(file => {
        const fileContent = useIdeStore.getState().openFiles.find(f => f.path === file.path)?.content;
        return {
          path: file.path,
          name: file.name,
          content: fileContent ? fileContent.substring(0, 3000) : 'Content not available'
        };
      });

      // Build context for the AI
      const contextInfo = `
Current Workspace: ${workspace?.name || 'None'}
Active File: ${fileContext.path || 'None'}
File Language: ${fileContext.language || 'None'}

Workspace Structure:
${workspaceStructure}

${fileContext.content ? `Active File Content:\n${fileContext.content.substring(0, 2000)}...` : ''}

${draggedFiles.length > 0 ? `Dragged Files Context:\n${draggedFilesContext.map(f => `File: ${f.name} (${f.path})\nContent:\n${f.content}\n`).join('\n')}` : ''}
`;

      // Get system prompt
      const systemPrompt = await getSystemPrompt();

      // Prepare messages for Groq API
      const apiMessages: Message[] = [
        { role: 'system', content: systemPrompt + '\n\n' + contextInfo, timestamp: Date.now() },
        ...messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          attachedFiles: m.attachedFiles
        })),
        userMessage
      ];

      // Call Groq API via secure backend route
      const response = await callGroqAPI(apiMessages);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your Groq API key in .env.local.`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
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
        <button
          onClick={toggleRightPanel}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          title="Close Panel"
        >
          <X size={16} />
        </button>
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
              <div className="flex items-center gap-2 text-zinc-500 text-[13px]">
                <Bot size={16} className="text-zinc-400" />
                <span>Thinking...</span>
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
              placeholder={draggedFiles.length > 0 ? "Ask about these files..." : "Ask me anything about your code..."}
              disabled={isLoading}
              rows={1}
              className="flex-1 w-full bg-transparent resize-none outline-none text-zinc-200 placeholder-zinc-500 text-[15px] min-h-[40px] max-h-[120px] overflow-hidden whitespace-pre-wrap break-words disabled:opacity-50"
            />
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
