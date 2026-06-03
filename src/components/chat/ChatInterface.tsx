"use client";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
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
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  wikiLink?: string | null;
};

interface ChatInterfaceProps {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  diveDeep: boolean;
  onConversationCreated?: (id: string) => void;
  initialModel?: string;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code);
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
  );
}

function PreviewButton({ code }: { code: string }) {
  const handlePreview = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handlePreview}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition ml-2"
      title="Preview HTML"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      Preview
    </button>
  );
}

function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition"
      >
        <span className="w-4 h-4 flex items-center justify-center rounded border border-gray-300 text-gray-500">
          {open ? "−" : "+"}
        </span>
        {open ? "Hide thinking" : "Show thinking"}
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  );
}

export default function ChatInterface({
  conversationId,
  setConversationId,
  diveDeep,
  onConversationCreated,
  initialModel = "fast",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [autoTiersUsed, setAutoTiersUsed] = useState<string[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages]);

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

  const sendMessage = async (userContent: string, contextMessages: Message[]): Promise<{
    assistantMessage: Message;
    newConversationId?: string;
  } | null> => {
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

      if (data.tiersUsed) {
        setAutoTiersUsed(data.tiersUsed);
      } else {
        setAutoTiersUsed([]);
      }

      const thinkMatch = data.reply.match(/<think\b[^>]*?>[\s\S]*?<\/think>/i);
      const thinking = thinkMatch ? thinkMatch[0] : null;
      const cleanReply = data.reply.replace(/<think\b[^>]*?>[\s\S]*?<\/think>/gi, "").trim();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanReply,
        thinking,
        wikiLink: data.wikiLink || null,
      };

      return {
        assistantMessage,
        newConversationId: data.conversationId,
      };
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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const contextMessages = [...messages, userMessage].slice(-15);
    const result = await sendMessage(userMessage.content, contextMessages);

    if (result) {
      if (!conversationId && result.newConversationId) {
        setConversationId(result.newConversationId);
        onConversationCreated?.(result.newConversationId);
      }
      setMessages((prev) => [...prev, result.assistantMessage]);
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
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

    const contextMessages = [...truncated.slice(-14)];
    const result = await sendMessage(userMsg.content, contextMessages);
    if (result) {
      if (!conversationId && result.newConversationId) {
        setConversationId(result.newConversationId);
        onConversationCreated?.(result.newConversationId);
      }
      setMessages((prev) => [...prev, result.assistantMessage]);
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

    const contextMessages = truncated.slice(-14);
    const result = await sendMessage(newContent, contextMessages);
    if (result) {
      if (!conversationId && result.newConversationId) {
        setConversationId(result.newConversationId);
        onConversationCreated?.(result.newConversationId);
      }
      setMessages((prev) => [...prev, result.assistantMessage]);
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
      <div className="relative flex-1">
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto">
          <div className="max-w-[440px] sm:max-w-[720px] md:max-w-[960px] mx-auto px-4 pt-6 pb-0 space-y-6">
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400 min-h-[60vh]"
                >
                  <div className="w-24 h-24 rounded-xl bg-black flex items-center justify-center p-2 select-none pointer-events-none">
                    <img
                      src="/logo.png"
                      alt="Netsyra"
                      className="w-full h-full object-contain select-none pointer-events-none"
                      draggable={false}
                    />
                  </div>
                  <p className="text-xl font-medium text-gray-600">How can I help you today?</p>
                  <p className="text-sm text-gray-400">Netsyra is here to help you with any thing.</p>
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black border-2 border-gray-700 flex items-center justify-center mt-0.5 shadow-sm select-none">
                        <img src="/logo.png" alt="Netsyra" className="w-5 h-5 object-contain" />
                      </div>
                    )}

                    <div
                      className={cn(
                        msg.role === "user"
                          ? "max-w-[85%] md:max-w-[55%] px-3.5 py-2.5 rounded-3xl bg-white text-gray-900 border border-gray-200 shadow-sm"
                          : "max-w-[96%] md:max-w-[80%] text-zinc-950 pt-1 pl-1 md:pl-2"
                      )}
                    >
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
                                  const codeString = String(children).replace(/\n$/, "");

                                  if (!inline && match) {
                                    return (
                                      <div className="my-4 rounded-xl overflow-hidden border border-gray-800 bg-[#1e1e1e] shadow-lg max-w-full md:max-w-[80%]">
                                        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
                                          <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            {match[1]}
                                          </span>
                                          <div className="flex items-center">
                                            <CopyButton code={codeString} />
                                            {(match[1] === "html" || match[1] === "htm") && <PreviewButton code={codeString} />}
                                          </div>
                                        </div>
                                        <SyntaxHighlighter
                                          language={match[1]}
                                          style={vscDarkPlus}
                                          customStyle={{ margin: 0, background: "transparent", padding: "1rem" }}
                                          codeTagProps={{ className: "text-sm" }}
                                        >
                                          {codeString}
                                        </SyntaxHighlighter>
                                      </div>
                                    );
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
                          {msg.thinking && <ThinkingBlock text={msg.thinking} />}
                          {msg.wikiLink && (
                            <a
                              href={msg.wikiLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View from there
                            </a>
                          )}
                        </div>
                      )}
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
                  </motion.div>
                );
              })}

              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black border-2 border-gray-700 flex items-center justify-center mt-0.5 shadow-sm select-none">
                    <img src="/logo.png" alt="Netsyra" className="w-5 h-5 object-contain" />
                  </div>
                  <div className="text-gray-400 pt-1 space-y-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "200ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "400ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 p-2.5 rounded-full bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all"
              aria-label="Scroll to bottom"
            >
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input – with model selector + button */}
      <div className="sticky bottom-0">
        <div className="max-w-[440px] sm:max-w-[720px] md:max-w-[960px] mx-auto px-4 pt-2 pb-1">
          {/* Auto‑routed badge (still shown when applicable) */}
          {selectedModel === "auto" && autoTiersUsed.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5 px-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Auto‑routed via {autoTiersUsed.join(", ")}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="relative">
            <div className="relative bg-gray-100/50 border border-gray-200 rounded-xl focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300 transition-all">
              {/* + button for model selector */}
              <div className="absolute left-2 bottom-2">
                <ModelSelector selected={selectedModel} onSelect={setSelectedModel} upward />
              </div>

              <textarea
                ref={mainInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Netsyra..."
                rows={1}
                className="w-full bg-transparent resize-none outline-none text-gray-900 placeholder:text-gray-400 py-3 pl-12 pr-12 text-sm max-h-[200px] overflow-y-auto"
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
                className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-sm"
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
    </div>
  );
}