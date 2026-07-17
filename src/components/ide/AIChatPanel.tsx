// d:\netsyra\src\components\ide\AIChatPanel.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useIdeStore } from "@/ide";
import { Send, X, Bot, Loader2, FileText, Folder } from "lucide-react";
import { getSystemPrompt } from "@/ide/grok-api";
import { getActiveFileContext, getWorkspaceStructure } from "@/ide/agent";

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

      // Call Groq API via Next.js API route
      const response = await fetch('/api/groq/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY_2 || process.env.NEXT_PUBLIC_GROQ_API_KEY || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
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
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
      {/* Header */}
      <div className="flex items-center justify-between h-[35px] px-3 border-b border-[#3e3e3e] shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-[#007acc]" />
          <span className="text-[12px] font-bold uppercase tracking-wider">IDE Chat</span>
        </div>
        <button
          onClick={toggleRightPanel}
          className="p-1 rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-white transition-colors"
          title="Close Panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Context Info */}
      <div className="px-3 py-2 border-b border-[#3e3e3e] bg-[#1e1e1e] shrink-0">
        <div className="text-[11px] text-[#858585]">
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
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#858585]">
            <FileText size={12} />
            <span className="truncate">{activeFile.path}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-4 min-h-0">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007acc] flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className="max-w-[80%]">
              {message.role === 'assistant' ? (
                // Bot messages as plain text (no bubble)
                <div className="text-[#cccccc] text-[13px] whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              ) : (
                // User messages in bubble
                <div className="bg-[#007acc] text-white rounded-lg px-3 py-2">
                  <p className="text-[13px] whitespace-pre-wrap">{message.content}</p>
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
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007acc] flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="text-[#858585] text-[13px]">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div 
        className={`p-3 border-t border-[#3e3e3e] shrink-0 ${isDragging ? 'bg-[#2a2d2e]' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Dragged Files */}
        {draggedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {draggedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-[#3c3c3c] px-2 py-1 rounded border border-[#2d2d2d]">
                <FileText size={14} className="text-[#007acc]" />
                <span className="text-[12px] truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeDraggedFile(index)}
                  className="text-[#858585] hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-[#007acc]/20 border-2 border-dashed border-[#007acc] rounded flex items-center justify-center pointer-events-none">
            <span className="text-[#007acc] font-medium">Drop files here</span>
          </div>
        )}

        <div className="flex gap-2">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={draggedFiles.length > 0 ? "Ask about these files..." : "Ask me anything about your code..."}
            disabled={isLoading}
            className="flex-1 bg-[#3c3c3c] text-[#cccccc] text-[13px] px-3 py-2 rounded border border-[#2d2d2d] focus:border-[#007acc] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-[#007acc] hover:bg-[#005a9e] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
  );
}
