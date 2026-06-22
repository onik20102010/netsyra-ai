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
  confidence?: number;
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
  const [lineLimitReached, setLineLimitReached] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [partialReply, setPartialReply] = useState("");

  // ── Thinking / typing indicators ──────────────────────────
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showStream, setShowStream] = useState(false);

  const typedBufferRef = useRef<string>("");
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const TYPING_DELAY = 2000;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages, partialReply]);

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
  }, [messages, partialReply]);

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
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          thinking: m.thinking,
          wikiLink: m.wikiLink,
          confidence: m.confidence,
        })));
      }
    };
    fetchMessages();
  }, [conversationId]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ href, children, ...props }: any) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-black dark:text-white underline decoration-dotted underline-offset-2"
              {...props}
            >
              {children}
            </a>
          );
        },
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
                  <div className="flex items-center gap-2">
                    <CopyButton code={codeString} />
                    {(match[1] === "html" || match[1] === "htm") && (
                      <PreviewButton code={codeString} />
                    )}
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
      {content}
    </ReactMarkdown>
  );

  const sendMessage = async (userContent: string, contextMessages: Message[]) => {
    setIsLoading(true);
    setIsThinking(true);
    setIsTyping(false);
    setShowStream(false);
    setPartialReply("");
    typedBufferRef.current = "";
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    const assistantId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantId);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: contextMessages.map(m => ({ role: m.role, content: m.content })),
          modelTier: selectedModel,
          conversationId: conversationId || crypto.randomUUID(),
          newConversation: !conversationId,
          diveDeep,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }
      if (!conversationId && res.headers.get("x-conversation-id")) {
        setConversationId(res.headers.get("x-conversation-id"));
      }

      // ── New SSE parsing loop ──────────────────────
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      let fullContent = "";
      let firstChunkReceived = false;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += new TextDecoder().decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;

              if (!firstChunkReceived) {
                firstChunkReceived = true;
                setIsThinking(false);
                setIsTyping(true);

                typedBufferRef.current = content;
                typingTimerRef.current = setTimeout(() => {
                  setPartialReply(typedBufferRef.current);
                  setShowStream(true);
                  setIsTyping(false);
                  typedBufferRef.current = "";
                }, TYPING_DELAY);
              } else if (isTyping && !showStream) {
                typedBufferRef.current += content;
              } else if (showStream) {
                setPartialReply(prev => prev + content);
              }
            }
          } catch {}
        }
      }

      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: fullContent,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setIsLoading(false);
      setIsThinking(false);
      setIsTyping(false);
      setShowStream(false);
      setStreamingMessageId(null);
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

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    const contextMessages = [...messages, userMessage].slice(-30);
    await sendMessage(userMessage.content, contextMessages);
  };

  const handleRefresh = async (assistantId: string) => {
    if (isLoading) return;
    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg.role !== "user") return;

    const truncated = messages.slice(0, idx);
    setMessages(truncated);

    const contextMessages = [...truncated.slice(-30)];
    await sendMessage(userMsg.content, contextMessages);
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

    const contextMessages = truncated.slice(-30);
    await sendMessage(newContent, contextMessages);
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
              {messages.length === 0 && !isThinking && !isTyping && !showStream && (
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

              {/* Static messages */}
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
                          <MarkdownRenderer content={msg.content} />
                          {msg.confidence !== undefined && msg.confidence < 0.6 && (
                            <span className="inline-block text-xs text-amber-500 ml-2">
                              ⚠️ Low confidence
                            </span>
                          )}
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

              {/* Netsyra is thinking… */}
              {isThinking && (
                <motion.div
                  key="thinking-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white text-sm flex items-center gap-2">
                    <span className="text-gray-500">Netsyra is thinking</span>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.4 }}
                    >
                      …
                    </motion.span>
                  </div>
                </motion.div>
              )}

              {/* Netsyra is typing… */}
              {isTyping && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white text-sm flex items-center gap-2">
                    <span className="text-gray-500">Netsyra is typing</span>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.4 }}
                    >
                      …
                    </motion.span>
                  </div>
                </motion.div>
              )}

              {/* Partial reply */}
              {showStream && partialReply && (
                <motion.div
                  key="streaming-bubble"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black border-2 border-gray-700 flex items-center justify-center mt-0.5 shadow-sm select-none">
                    <img src="/logo.png" alt="Netsyra" className="w-5 h-5 object-contain" />
                  </div>
                  <div className="max-w-[96%] md:max-w-[80%] text-zinc-950 pt-1 pl-1 md:pl-2 bg-white rounded-2xl px-4 py-2">
                    <MarkdownRenderer content={partialReply} />
                    {isLoading && (
                      <span className="inline-block w-2 h-5 bg-gray-900 ml-0.5 animate-pulse align-middle rounded-sm" />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Loading fallback */}
              {isLoading && !isThinking && !isTyping && !showStream && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start pl-12"
                >
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

      {/* Input area */}
      <div className="sticky bottom-0">
        <div className="w-full max-w-3xl mx-auto px-4 pt-2 pb-4">
          {selectedModel === "auto" && autoTiersUsed.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 px-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Auto‑routed via {autoTiersUsed.join(", ")}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="relative">
            <div className="flex items-end gap-2 rounded-[28px] border border-gray-300 bg-white px-4 py-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300 transition-all">
              {/* Model selector */}
              <div className="flex-shrink-0 pb-1">
                <ModelSelector selected={selectedModel} onSelect={setSelectedModel} upward />
              </div>

              <textarea
                ref={mainInputRef}
                value={input}
                onChange={(e) => {
                  const lines = e.target.value.split("\n");
                  if (lines.length > 40) {
                    setLineLimitReached(true);
                    setInput(lines.slice(0, 40).join("\n"));
                    toast.error("Message is too long. Please reduce to 40 lines or fewer.");
                  } else {
                    setLineLimitReached(false);
                    setInput(e.target.value);
                  }
                }}
                placeholder="Message Netsyra..."
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-gray-900 placeholder:text-gray-400 py-1 text-sm max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!lineLimitReached) handleSend();
                  }
                }}
              />

              <button
                type="submit"
                disabled={isLoading || !input.trim() || lineLimitReached}
                className="flex-shrink-0 h-9 w-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {lineLimitReached && (
              <p className="text-xs text-rose-500 mt-1">
                Message is too long. Please reduce to 40 lines or fewer.
              </p>
            )}
            <p className="text-[11px] text-gray-400 text-center mt-1.5 leading-tight">
              Netsyra may produce inaccurate information.
              {diveDeep && " 🌐 Dive Deep is ON"}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}