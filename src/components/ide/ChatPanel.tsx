"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  activeFile: string | null;
  fileContent: string;
  onFileWrite: (path: string, content: string) => void;
}

type Mode = "ask" | "plan" | "agent";

export default function ChatPanel({ activeFile, fileContent, onFileWrite }: ChatPanelProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("ask");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ide-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          activeFile,
          fileContent,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error: Could not get response. Make sure your API keys are configured." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const modes: Mode[] = ["ask", "plan", "agent"];

  return (
    <div className="h-full flex flex-col border-l border-gray-700 bg-[#1e1e1e]">
      {/* Panel header */}
      <div className="h-8 border-b border-[#2d2d2d] flex items-center px-3 bg-[#181818] text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        AI Agent
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 p-2 border-b border-gray-700">
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

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] p-2 rounded-lg text-sm ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-200"
            }`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-gray-700">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Ask ${mode === "plan" ? "to plan" : mode === "agent" ? "agent to act" : "a question"}...`}
            className="min-h-[40px] bg-gray-800 border-gray-700 text-white resize-none"
            rows={1}
          />
          <Button onClick={handleSend} disabled={isLoading} size="icon" className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
}