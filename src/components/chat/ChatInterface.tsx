"use client";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  User,
  Bot,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import ModelSelector from "./ModelSelector";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  wikiLink?: string | null;
};

interface ChatInterfaceProps {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  diveDeep: boolean;
}

function CodeBlock({ language, codeString }: { language: string; codeString: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-800 bg-[#1e1e1e] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
        <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">{language}</span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(codeString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className={`language-${language} text-sm text-gray-200`}>{codeString}</code>
      </pre>
    </div>
  );
}

export default function ChatInterface({
  conversationId,
  setConversationId,
  diveDeep,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");   // default Auto
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [autoTiersUsed, setAutoTiersUsed] = useState<string[]>([]);   // badge data
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);
  
  useEffect(() => {
  const textarea = mainInputRef.current;
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
}, [input]);

  useEffect(() => {
    if (!conversationId) return;
    const fetchMessages = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
      }
    };
    fetchMessages();
  }, [conversationId]);

  const sendMessage = async (userContent: string, contextMessages: Message[]) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: contextMessages.map((m) => ({ role: m.role, content: m.content })),
          modelTier: selectedModel,
          conversationId: conversationId || crypto.randomUUID(),
          newConversation: !conversationId,
          diveDeep,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Capture tiersUsed from auto routing
      if (data.tiersUsed) {
        setAutoTiersUsed(data.tiersUsed);
      } else {
        setAutoTiersUsed([]);
      }

      // Remove <think> blocks from the reply
const cleanReply = data.reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

const assistantMessage: Message = {
  id: (Date.now() + 1).toString(),
  role: "assistant",
  content: cleanReply,
  wikiLink: data.wikiLink || null,
};
      return assistantMessage;
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    const contextMessages = updatedMessages.slice(-14);
    const assistantMessage = await sendMessage(userMessage.content, contextMessages);
    if (assistantMessage) {
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  const handleRefresh = async (assistantId: string) => {
    if (isLoading) return;
    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg.role !== "user") return;

    const truncated = messages.slice(0, idx);
    setMessages(truncated);

    const contextMessages = [...truncated.slice(-5)];
    const assistantMessage = await sendMessage(userMsg.content, contextMessages);
    if (assistantMessage) {
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const saveEdit = async (msg: Message) => {
    const newContent = editContent.trim();
    if (!newContent || newContent === msg.content) {
      cancelEditing();
      return;
    }

    const idx = messages.findIndex((m) => m.id === msg.id);
    if (idx === -1) return;

    const updatedMessages = [...messages];
    updatedMessages[idx] = { ...msg, content: newContent };
    const truncated = updatedMessages.slice(0, idx + 1);
    setMessages(truncated);
    cancelEditing();

    const contextMessages = truncated.slice(-5);
    const assistantMessage = await sendMessage(newContent, contextMessages);
    if (assistantMessage) {
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const currentMsg = messages.find((m) => m.id === editingMessageId);
      if (currentMsg) saveEdit(currentMsg);
    }
    if (e.key === "Escape") cancelEditing();
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleLike = () => toast.success("Thanks for your feedback!");
  const handleDislike = () => toast.success("Thanks, we'll improve!");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Model selector header */}
      <div className="p-3 border-b border-gray-200">
        <ModelSelector selected={selectedModel} onSelect={setSelectedModel} />
        {/* Auto‑routing badge */}
        {selectedModel === "auto" && autoTiersUsed.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 px-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Auto‑routed via {autoTiersUsed.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400"
            >
              <div className="w-24 h-24 rounded-xl bg-black flex items-center justify-center p-2">
                <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
              </div>
              <p className="text-xl font-medium text-gray-600">How can I help you today?</p>
              <p className="text-sm text-gray-400">Intelligent routing selects the best AI for each request.</p>
            </motion.div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isEditing = editingMessageId === msg.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
              >
                {!isUser && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                )}

                <div className="max-w-[85%]">
                  <div className={cn(isUser ? "text-zinc-950" : "text-zinc-950 pt-1")}>
                    {isEditing ? (
                      <div className="flex items-start gap-2">
                        <textarea
                          ref={editInputRef}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none outline-none focus:border-indigo-300"
                          rows={4}
                        />
                        <button
                          onClick={() => saveEdit(msg)}
                          className="text-indigo-600 hover:text-indigo-800 transition p-1"
                          title="Save edit"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-400 hover:text-gray-600 transition p-1"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isUser ? (
                      <p>{msg.content}</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="prose-chat max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                if (!inline && match) {
                                  const language = match[1];
                                  const codeString = String(children).replace(/\n$/, "");
                                  return <CodeBlock language={language} codeString={codeString} />;
                                }
                                return (
                                  <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              table({ children }: any) {
                                return (
                                  <div className="overflow-x-auto my-4">
                                    <table className="min-w-full border-collapse border border-gray-300 text-sm">
                                      {children}
                                    </table>
                                  </div>
                                );
                              },
                              th({ children }: any) {
                                return (
                                  <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-medium text-gray-700">
                                    {children}
                                  </th>
                                );
                              },
                              td({ children }: any) {
                                return (
                                  <td className="border border-gray-300 px-4 py-2 text-gray-700">
                                    {children}
                                  </td>
                                );
                              },
                              hr({ node, ...props }: any) {
                                return <hr className="my-8 border-t border-gray-300" {...props} />;
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {msg.wikiLink && (
                          <a
                            href={msg.wikiLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View on Wikipedia
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div
                      className={cn(
                        "flex items-center gap-2 mt-1 px-1",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      {isUser ? (
                        <>
                          <button onClick={() => handleCopy(msg.content)} className="text-gray-400 hover:text-gray-600 transition" title="Copy">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => startEditing(msg)} className="text-gray-400 hover:text-gray-600 transition" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleCopy(msg.content)} className="text-gray-400 hover:text-gray-600 transition" title="Copy">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRefresh(msg.id)}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                            title="Regenerate"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={handleLike} className="text-gray-400 hover:text-gray-600 transition" title="Like">
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={handleDislike} className="text-gray-400 hover:text-gray-600 transition" title="Dislike">
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mt-0.5">
                <Bot className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-gray-400 pt-1 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "200ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "400ms" }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

{/* Input – bottom‑sticky, auto‑expand */}
<div className="sticky bottom-0 bg-white px-4 pt-2 pb-1 border-t border-gray-200">
  <form onSubmit={handleSend} className="relative">
    <div className="relative bg-gray-100/50 border border-gray-200 rounded-xl focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300 transition-all">
      <textarea
        ref={mainInputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Message Netsyra..."
        rows={1}
        className="w-full bg-transparent resize-none outline-none text-gray-900 placeholder:text-gray-400 py-2.5 pl-4 pr-12 text-sm max-h-[200px] overflow-y-auto"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="absolute right-1.5 bottom-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-sm"
      >
        <Send className="w-4 h-4 text-white" />
      </button>
    </div>
    <p className="text-[11px] text-gray-400 text-center mt-0.5 leading-tight">
      Netsyra may produce inaccurate information.
      {diveDeep && " 🌐 Dive Deep is ON"}
    </p>
  </form>
</div>
    </div>
  );
}