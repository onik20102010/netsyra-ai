"use client";
import { useState, useRef, useEffect, useCallback, memo, type FormEvent } from "react";
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
  ChevronDown,
  ChevronUp,
  Paperclip,
  Image as ImageIcon,
  XCircle,
  Mic,
} from "lucide-react";
import ModelSelector from "./ModelSelector";
import MermaidDiagram from "./MermaidDiagram";
import WeatherWidget from "./WeatherWidget";
import ClockWidget from "./ClockWidget";
import CalendarWidget from "./CalendarWidget";
import SourcesPanel from "./SourcesPanel";
import { useStylePrefs, getStyleValues } from "@/hooks/useStylePrefs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { createClient } from "@/lib/supabase/client";
import { useChatUsage } from "@/hooks/useChatUsage";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  wikiLink?: string | null;
  confidence?: number;
  sources?: { title: string; url: string }[];
  modelUsed?: string;
  images?: { id: string; url: string; name: string }[];
};

// Friendly display names for the model tiers (used to show what Auto picked).
const MODEL_LABELS: Record<string, string> = {
  auto: "Auto",
  fast: "N Fast",
  plus: "N Plus",
  pro: "N Pro",
  code: "N Code",
  live: "N Live",
  aai: "N AAI",
  go_plus: "N Go Plus",
  ni: "N NI",
  plus_pro: "N + Pro",
};

interface ChatInterfaceProps {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  diveDeep: boolean;
  onConversationCreated?: (id: string, firstMessage: string) => void;
  initialModel?: string;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isPro?: boolean;
  allowedTiers?: string[];
  sidebarOpen?: boolean;
}

function CopyButton({ code, variant = "dark" }: { code: string; variant?: "dark" | "light" }) {
  const [copied, setCopied] = useState(false);
  const textColor = variant === "light" ? "text-gray-500 hover:text-gray-800" : "text-gray-400 hover:text-white";
  const copiedColor = variant === "light" ? "text-green-600" : "text-green-400";
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`flex items-center gap-1.5 text-xs ${textColor} transition`}
    >
      {copied ? (
        <>
          <Check className={`w-3.5 h-3.5 ${copiedColor}`} />
          <span className={copiedColor}>Copied!</span>
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

function SourcesDropdown({ sources }: { sources: { title: string; url: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-600"
      >
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-indigo-500" />
          <span className="font-medium">Sources ({sources.length})</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="bg-white px-4 py-3 space-y-2">
          {sources.map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition"
            >
              <span className="text-gray-400 mr-2">[{i + 1}]</span>
              {source.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function stripThinkTags(content: string): string {
  return content.replace(/<think[\s\S]*?<\/think>/g, "");
}

function extractSources(content: string): {
  cleanContent: string;
  sources: { title: string; url: string }[];
} {
  const regex = /## Sources\s*\n((?:- \[[^\]]+\]\([^)]+\)\n?)+)/;
  const match = content.match(regex);
  if (!match) return { cleanContent: content, sources: [] };

  const sourcesBlock = match[1];
  const cleanContent = content.replace(match[0], "").trim();

  const lines = sourcesBlock.match(/- \[([^\]]+)\]\(([^)]+)\)/g);
  const sources = (lines || []).map((line) => {
    const m = line.match(/- \[([^\]]+)\]\(([^)]+)\)/);
    return { title: m![1], url: m![2] };
  });

  return { cleanContent, sources };
}

// ── MarkdownRenderer (top-level + memoized to prevent widget re-renders) ──
const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  modelTier,
}: {
  content: string;
  modelTier?: string;
}) {
  const clean = stripThinkTags(content);
  const widgets: React.ReactNode[] = [];
  const isProOrAAI = modelTier === "pro" || modelTier === "aai";
  const { prefs } = useStylePrefs();
  const sv = getStyleValues(prefs);
  const isPlus = modelTier === "plus";

  const processed = clean
    .replace(/<!--WIDGET:WEATHER:(.*?)-->/g, (_, json) => {
      try {
        const data = JSON.parse(json);
        const idx = widgets.length;
        widgets.push(<WeatherWidget key={`w-${idx}`} data={data} />);
        return `[[WIDGET:${idx}]]`;
      } catch { return ""; }
    })
    .replace(/<!--WIDGET:CLOCK:(.*?)-->/g, (_, json) => {
      try {
        const data = JSON.parse(json);
        const idx = widgets.length;
        widgets.push(<ClockWidget key={`c-${idx}`} data={data} />);
        return `[[WIDGET:${idx}]]`;
      } catch { return ""; }
    })
    .replace(/<!--WIDGET:CALENDAR:(.*?)-->/g, (_, json) => {
      try {
        const data = JSON.parse(json);
        const idx = widgets.length;
        widgets.push(<CalendarWidget key={`cal-${idx}`} data={data} />);
        return `[[WIDGET:${idx}]]`;
      } catch { return ""; }
    });

  const parts = processed.split(/(\[\[WIDGET:\d+\]\])/);

  return (
    <div className={cn("space-y-2 font-sans", isPlus ? "overflow-visible h-auto" : "")} style={{ fontFamily: "var(--font-sans)" }}>
      {parts.map((part, i) => {
        const match = part.match(/^\[\[WIDGET:(\d+)\]\]$/);
        if (match) {
          const widgetIdx = parseInt(match[1]);
          return <span key={i}>{widgets[widgetIdx]}</span>;
        }
        if (!part.trim()) return null;
        return (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[
              rehypeRaw,
              [rehypeKatex, { throwOnError: false, strict: false, output: "html" }],
            ]}
            components={{
              h1({ children }: any) {
                return <h1 className="text-2xl font-bold text-zinc-900" style={{ marginTop: sv.sectionMargin, marginBottom: sv.sectionMargin }}>{children}</h1>;
              },
              h2({ children }: any) {
                return <h2 className="text-xl font-bold text-zinc-900" style={{ marginTop: sv.sectionMargin, marginBottom: sv.sectionMargin }}>{children}</h2>;
              },
              h3({ children }: any) {
                return <h3 className="text-lg font-semibold text-zinc-900" style={{ marginTop: sv.sectionMargin, marginBottom: sv.sectionMargin }}>{children}</h3>;
              },
              h4({ children }: any) {
                return <h4 className="text-base font-semibold text-zinc-800" style={{ marginTop: sv.sectionMargin, marginBottom: sv.sectionMargin }}>{children}</h4>;
              },
              h5({ children }: any) {
                return <h5 className="text-sm font-semibold text-zinc-800" style={{ marginTop: sv.sectionMargin, marginBottom: sv.sectionMargin }}>{children}</h5>;
              },
              h6({ children }: any) {
                return <h6 className="text-sm font-medium text-zinc-700" style={{ marginTop: sv.sectionMargin, marginBottom: sv.sectionMargin }}>{children}</h6>;
              },
              p({ children, ...props }: any) {
                return <p style={{ wordSpacing: sv.wordSpacing, letterSpacing: sv.letterSpacing, fontSize: sv.fontSize, lineHeight: 1.7 }} {...props}>{children}</p>;
              },
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

                if (!inline && match && match[1] === "mermaid") {
                  if (
                    !codeString.trim() ||
                    !/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie)\b/m.test(codeString.trim()) ||
                    !/-->|->>|-->>|-.->|==>/m.test(codeString.trim())
                  ) {
                    return null;
                  }
                  return (
                    <div className="my-4">
                      <MermaidDiagram chart={codeString} />
                    </div>
                  );
                }

                if (!inline && match && match[1] === "ascii") {
                  return (
                    <div className="my-4 rounded-2xl bg-[#F3F3F3] shadow-sm overflow-hidden w-full">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Diagram
                        </span>
                        <CopyButton code={codeString} variant="light" />
                      </div>
                      <div className="overflow-x-auto">
                        <pre className="p-4 text-sm leading-relaxed text-gray-800 font-mono whitespace-pre">
                          {codeString}
                        </pre>
                      </div>
                    </div>
                  );
                }

                if (!inline && match) {
                  return (
                    <div className="my-4 rounded-xl overflow-hidden border border-gray-800 bg-[#1e1e1e] shadow-lg w-full">
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
                  <div className="overflow-x-auto my-4 w-full">
                    <table className="min-w-full border-collapse border border-gray-300 text-sm" style={{ borderRadius: sv.tableRadius, overflow: "hidden" }}>
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }: any) {
                return (
                  <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-medium text-gray-700" style={{ borderRadius: sv.cellRadius }}>
                    {children}
                  </th>
                );
              },
              td({ children }: any) {
                return (
                  <td className="border border-gray-300 px-4 py-2 text-gray-700" style={{ borderRadius: sv.cellRadius }}>
                    {children}
                  </td>
                );
              },
              hr({ node, ...props }: any) {
                return <hr className="my-8 border-t border-gray-300" {...props} />;
              },
              ul({ node, children, ...props }: any) {
                const depth = (node as any)?.depth ?? 0;
                if (isProOrAAI) {
                  return (
                    <ul
                      className="my-2 space-y-1 pl-5 list-disc list-outside"
                      {...props}
                    >
                      {children}
                    </ul>
                  );
                }
                return (
                  <ul
                    className={cn(
                      "my-2 space-y-1 pl-1",
                      depth === 0 ? "list-none pl-0" : "list-none pl-4"
                    )}
                    {...props}
                  >
                    {children}
                  </ul>
                );
              },
              ol({ node, children, ...props }: any) {
                return (
                  <ol
                    className="my-2 space-y-1 pl-1 list-decimal list-outside ml-5"
                    {...props}
                  >
                    {children}
                  </ol>
                );
              },
              li({ node, children, ...props }: any) {
                const depth = (node as any)?.depth ?? 0;
                const parent = (node as any)?.parent;
                const isOrdered = parent?.type === "list" && parent?.ordered;
                const bulletChar = depth === 0 ? "•" : "◦";

                if (isOrdered) {
                  return (
                    <li className="leading-relaxed text-zinc-800" style={{ fontSize: sv.fontSize, wordSpacing: sv.wordSpacing }} {...props}>
                      {children}
                    </li>
                  );
                }

                if (isProOrAAI) {
                  return (
                    <li className="list-item mb-1 leading-relaxed text-zinc-800" style={{ fontSize: sv.fontSize, wordSpacing: sv.wordSpacing }} {...props}>
                      {children}
                    </li>
                  );
                }

                return (
                  <li className="flex gap-2 leading-relaxed text-zinc-800" style={{ fontSize: sv.fontSize, wordSpacing: sv.wordSpacing }} {...props}>
                    <span className="flex-shrink-0 select-none">{bulletChar}</span>
                    <span className="flex-1">{children}</span>
                  </li>
                );
              },
            }}
          >
            {part}
          </ReactMarkdown>
        );
      })}
    </div>
  );
});

// ── Noise-suppressed audio constraints ──
const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

export default function ChatInterface({
  conversationId,
  setConversationId,
  diveDeep,
  onConversationCreated,
  selectedModel,
  setSelectedModel,
  isPro = false,
  allowedTiers,
  sidebarOpen = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [autoTiersUsed, setAutoTiersUsed] = useState<string[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [partialReply, setPartialReply] = useState("");
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());

  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [searching, setSearching] = useState(false);
  const [attachedImages, setAttachedImages] = useState<{ id: string; file: File; url: string; name: string }[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const typedBufferRef = useRef<string>("");
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const TYPING_DELAY = 2000;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = useState(false);

  const supabase = createClient();

  const lastAssistantId = [...messages].reverse().find(m => m.role === 'assistant')?.id;

  const { refetch: refetchUsage } = useChatUsage();

  const toggleCollapse = (id: string) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ── Mobile keyboard detection ──
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const threshold = 150;
    const update = () => {
      const diff = window.innerHeight - vv.height;
      setIsMobileKeyboardOpen(diff > threshold);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    if (isMobileKeyboardOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [isMobileKeyboardOpen]);

  const isSelfCreatedConv = useRef(false);

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
    if (!conversationId) {
      setMessages([]);
      setInput("");
      document.title = "Netsyra";
      setPartialReply("");
      setIsThinking(false);
      setIsTyping(false);
      setShowStream(false);
      setStreamingMessageId(null);
      setAutoTiersUsed([]);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (isSelfCreatedConv.current) {
      isSelfCreatedConv.current = false;
      return;
    }

    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, user_id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Fetch messages error:", error);
        return;
      }
      if (data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })));
      }
    };
    fetchMessages();
  }, [conversationId, supabase]);

  useEffect(() => {
    const firstUserMsg = messages.find(m => m.role === "user");
    if (firstUserMsg) {
      document.title = firstUserMsg.content.slice(0, 50) + " - Netsyra";
    } else if (conversationId) {
      document.title = "Netsyra";
    }
  }, [messages, conversationId]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        body: JSON.stringify({
          messages: contextMessages.map(m => ({ role: m.role, content: m.content })),
          modelTier: selectedModel,
          conversationId: conversationId || crypto.randomUUID(),
          newConversation: !conversationId,
          diveDeep,
          webSearch: webSearchEnabled,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json();
          toast.error(data.error || "Limit reached", { duration: 6000 });
          refetchUsage();
          setIsLoading(false);
          setIsThinking(false);
          setIsTyping(false);
          setShowStream(false);
          setStreamingMessageId(null);
          return;
        }
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      if (res.headers.get("x-search-performed") === "true") {
        setIsThinking(false);
        setSearching(true);
        setTimeout(() => setSearching(false), 2000);
      }

      const sourcesHeader = res.headers.get("x-sources");
      let sources: { title: string; url: string }[] = [];
      if (sourcesHeader) {
        try {
          sources = JSON.parse(decodeURIComponent(sourcesHeader));
        } catch (e) {
          console.error("Failed to parse sources header:", e);
        }
      }

      if (!conversationId && res.headers.get("x-conversation-id")) {
        const newConvId = res.headers.get("x-conversation-id")!;
        isSelfCreatedConv.current = true;
        setConversationId(newConvId);
        onConversationCreated?.(newConvId, userContent);
      }

      const modelUsed = res.headers.get("x-model-used") || undefined;

      if (selectedModel === "auto" && modelUsed) {
        const friendlyName = MODEL_LABELS[modelUsed] || modelUsed;
        setAutoTiersUsed(prev =>
          prev.includes(friendlyName) ? prev : [...prev, friendlyName]
        );
      }

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
            const content = parsed.content || parsed.choices?.[0]?.delta?.content || "";
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
        sources: sources.length > 0 ? sources : undefined,
        modelUsed,
      };
      setMessages(prev => [...prev, assistantMessage]);
      refetchUsage();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      clearTimeout(timeoutId);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setIsLoading(false);
      setIsThinking(false);
      setIsTyping(false);
      setShowStream(false);
      setStreamingMessageId(null);
      setSearching(false);
    }
  };

  const getSpeechRecognition = useCallback((): any | null => {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }, []);

  const startWebSpeechRecognition = useCallback(async (): Promise<boolean> => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return false;

    const createRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.lang = navigator.language || "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      const baseText = input.trim() ? input.trim() + " " : "";
      finalTranscriptRef.current = baseText;

      recognition.onresult = (event: any) => {
        let finalText = baseText;
        let interim = "";

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }

        const fullText = (finalText + interim).replace(/\s+/g, " ").trimStart();
        setInput(fullText);
        finalTranscriptRef.current = finalText;
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInput((prev) => (finalTranscriptRef.current ? finalTranscriptRef.current.trim() : prev));
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (!event.error || event.error === "aborted" || event.error === "no-speech") return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") return;
        if (event.error === "audio-capture") return;
      };

      return recognition;
    };

    try {
      const recognition = createRecognition();
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      return true;
    } catch {}

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
    } catch {
      setIsRecording(false);
      return false;
    }

    stream.getTracks().forEach((t) => t.stop());

    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const recognition = createRecognition();
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      return true;
    } catch {
      setIsRecording(false);
      return false;
    }
  }, [input, getSpeechRecognition]);

  const startMediaRecorderFallback = useCallback(async (): Promise<boolean> => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
    } catch {
      toast.error("Could not access microphone. Please check your permissions.", { duration: 6000 });
      return false;
    }

    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/mpeg",
    ];
    let mimeType = "";
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      toast.error("Could not start audio recording. Your browser may not support audio recording.", { duration: 6000 });
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }

    audioChunksRef.current = [];
    mediaStreamRef.current = stream;
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      setIsRecording(false);

      if (audioChunksRef.current.length === 0) return;

      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
      audioChunksRef.current = [];

      if (audioBlob.size < 1000) return;

      setIsTranscribing(true);
      toast.loading("Transcribing your voice...", { id: "transcribing" });

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, `recording.${mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm"}`);
        formData.append("language", (navigator.language || "en-US").split("-")[0]);

        const response = await fetch("/api/groq/transcribe", {
          method: "POST",
          body: formData,
        });

        toast.dismiss("transcribing");

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          toast.error(errData.error || "Failed to transcribe audio. Please try again.", { duration: 6000 });
          return;
        }

        const data = await response.json();
        const transcript: string = data.transcript || "";

        if (transcript.trim()) {
          finalTranscriptRef.current = input.trim() ? input.trim() + " " : "";
          finalTranscriptRef.current += transcript.trim();
          setInput(finalTranscriptRef.current);
        }
      } catch (err) {
        toast.dismiss("transcribing");
        toast.error("Failed to transcribe audio. Please check your connection and try again.", { duration: 6000 });
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();
    setIsRecording(true);
    return true;
  }, [input]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        return;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        return;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

    const SpeechRecognition = getSpeechRecognition();
    if (SpeechRecognition) {
      const started = await startWebSpeechRecognition();
      if (started) return;
    }

    await startMediaRecorderFallback();
  }, [isRecording, getSpeechRecognition, startWebSpeechRecognition, startMediaRecorderFallback]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachedImages.length === 0) || isLoading) return;

    let messageContent = input.trim();
    let apiContent = input.trim();

    if (attachedImages.length > 0) {
      const imageDescription = await processImagesWithGroq(attachedImages);
      if (imageDescription) {
        apiContent = apiContent ? `${apiContent}\n\n[Image Analysis: ${imageDescription}]` : `[Image Analysis: ${imageDescription}]`;
      }

      const imagePromises = attachedImages.map((img) => {
        return new Promise<{ id: string; url: string; name: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ id: img.id, url: reader.result as string, name: img.name });
          };
          reader.onerror = () => {
            resolve({ id: img.id, url: img.url, name: img.name });
          };
          reader.readAsDataURL(img.file);
        });
      });
      const persistentImages = await Promise.all(imagePromises);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageContent || "",
        images: persistentImages,
      };

      setMessages(prev => [...prev, userMessage]);
      setInput("");
      setAttachedImages([]);

      const apiMessage: Message = {
        ...userMessage,
        content: apiContent || "",
      };
      const contextMessages = [...messages, apiMessage];
      await sendMessage(apiContent, contextMessages);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent || "",
      images: undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachedImages([]);

    const contextMessages = [...messages, userMessage];
    await sendMessage(apiContent, contextMessages);
  };

  const handleRefresh = async (assistantId: string) => {
    if (isLoading) return;
    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg.role !== "user") return;

    const truncated = messages.slice(0, idx);
    setMessages(truncated);

    const contextMessages = [...truncated];
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

    const contextMessages = truncated;
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

  const isImageAttachEnabled = selectedModel === "plus" || selectedModel === "go_plus" || selectedModel === "ni" || selectedModel === "plus_pro";
  const isPaidPlan = selectedModel === "go_plus" || selectedModel === "ni" || selectedModel === "plus_pro";
  const maxImagesPerMessage = isPaidPlan ? 10 : 2;

  useEffect(() => {
    if (!isImageAttachEnabled && attachedImages.length > 0) {
      setAttachedImages([]);
    }
  }, [isImageAttachEnabled]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (!isImageAttachEnabled) {
      toast.error("Image analysis is available with N Plus, Go Plus, Pro, and + Pro models");
      e.target.value = "";
      return;
    }

    const processImages = async () => {
      const newImages: { id: string; file: File; url: string; name: string }[] = [];

      for (const file of Array.from(files)) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newImages.push({
            id: crypto.randomUUID(),
            file,
            url: dataUrl,
            name: file.name
          });
        } catch (error) {
          console.error('Failed to create data URL for:', file.name, error);
        }
      }

      if (newImages.length === 0) {
        toast.error("Failed to load images. Please try again.");
        e.target.value = "";
        return;
      }

      if (attachedImages.length + newImages.length > maxImagesPerMessage) {
        toast.error(`You can only attach up to ${maxImagesPerMessage} images at a time`);
        e.target.value = "";
        return;
      }

      setAttachedImages(prev => [...prev, ...newImages]);
      e.target.value = "";
    };

    processImages();
  };

  const removeAttachedImage = (id: string) => {
    setAttachedImages(prev => {
      return prev.filter(img => img.id !== id);
    });
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!isImageAttachEnabled) return;

    const items = e.clipboardData.items;
    const imageItems: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageItems.push(file);
      }
    }

    if (imageItems.length > 0) {
      e.preventDefault();
      const newImages: { id: string; file: File; url: string; name: string }[] = [];
      
      for (let i = 0; i < Math.min(imageItems.length, maxImagesPerMessage - attachedImages.length); i++) {
        const file = imageItems[i];
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const ext = file.type.split('/')[1] || 'png';
          const cleanName = file.name && file.name !== 'image.png'
            ? file.name
            : `pasted-image-${i + 1}.${ext}`;
          
          newImages.push({
            id: crypto.randomUUID(),
            file: new File([file], cleanName, { type: file.type }),
            url: dataUrl,
            name: cleanName
          });
        } catch (error) {
          console.error('Failed to create data URL for pasted image:', error);
        }
      }
      
      if (newImages.length === 0) {
        toast.error("Failed to load pasted images");
        return;
      }
      
      if (attachedImages.length + newImages.length > maxImagesPerMessage) {
        toast.error(`You can only attach up to ${maxImagesPerMessage} images at a time`);
        return;
      }
      setAttachedImages(prev => [...prev, ...newImages]);
      return;
    }

    const pastedText = e.clipboardData.getData('text');
    if (pastedText && isImageUrl(pastedText.trim())) {
      e.preventDefault();
      await fetchImageFromUrl(pastedText.trim());
    }
  };

  const isImageUrl = (url: string): boolean => {
    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  };

  const fetchImageFromUrl = async (url: string) => {
    if (!isImageAttachEnabled) return;
    if (attachedImages.length >= maxImagesPerMessage) {
      toast.error(`You can only attach up to ${maxImagesPerMessage} images at a time`);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        toast.error("Failed to fetch image from URL");
        return;
      }
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        toast.error("The URL does not point to an image");
        return;
      }
      
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const file = new File([blob], url.split('/').pop() || 'image-from-url.png', { type: blob.type });
      const newImage = {
        id: crypto.randomUUID(),
        file,
        url: dataUrl,
        name: file.name
      };
      setAttachedImages(prev => [...prev, newImage]);
      toast.success("Image loaded from URL");
    } catch {
      toast.error("Failed to load image from URL");
    }
  };

  const processImagesWithGroq = async (images: { id: string; file: File; url: string; name: string }[]) => {
    if (images.length === 0) return "";

    setIsProcessingImage(true);
    try {
      const formData = new FormData();
      images.forEach(img => {
        formData.append('images', img.file);
      });

      const response = await fetch('/api/groq/image-process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to process images (${response.status})`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data.description || "";
    } catch (error) {
      console.error('Error processing images:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to process images';
      toast.error(errMsg);
      return "";
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="relative flex-1 min-h-0">
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto overscroll-contain chat-scroll-area">
          <div className="w-full max-w-[768px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-[140px] sm:pb-0 space-y-3 sm:space-y-4">
            <AnimatePresence initial={false}>
              {messages.length === 0 && !isThinking && !isTyping && !showStream && !searching && (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400 min-h-[60vh]"
                >
                  <img
                    src="/logo.png"
                    alt="Netsyra Logo"
                    className="w-24 h-24 rounded-lg object-contain select-none pointer-events-none"
                  />
                  <p className="text-lg sm:text-xl font-medium text-gray-600">How can I help you today?</p>
                  <p className="text-xs sm:text-sm text-gray-400">Netsyra is here to help you with any thing.</p>
                </motion.div>
              )}

              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isEditing = editingMessageId === msg.id;
                const isCollapsed = collapsedMessages.has(msg.id);
                const isLong = msg.content.length > 500;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onAnimationComplete={() => {
                      const el = document.querySelector<HTMLDivElement>(
                        `[data-msg-id="${msg.id}"]`
                      );
                      if (el) {
                        el.style.transform = "none";
                        el.style.willChange = "auto";
                      }
                    }}
                    data-msg-id={msg.id}
                    className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}
                  >
                    {isUser && msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap-reverse gap-2 mb-1 self-stretch justify-end">
                        {msg.images.map((img) => (
                          <img
                            key={img.id}
                            src={img.url}
                            alt={img.name}
                            className="h-32 w-32 object-cover rounded-2xl border border-gray-200 shadow-sm flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {isUser && msg.content ? (
                      <>
                        <div className="max-w-[85%] md:max-w-[75%] px-3.5 py-2.5 rounded-2xl bg-white text-gray-900 border border-gray-200 shadow-sm">
                          {isEditing ? (
                            <div className="flex flex-col gap-2 w-full">
                              <textarea
                                ref={editInputRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none outline-none focus:border-gray-400 transition-colors min-h-[120px]"
                                rows={6}
                                autoFocus
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                  Enter to save · Esc to cancel
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={cancelEditing}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => saveEdit(msg)}
                                    className="px-4 py-1.5 rounded-full text-xs font-medium bg-black text-white hover:bg-gray-800 transition"
                                  >
                                    Save & Send
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {isLong && isCollapsed ? (
                                <p className="whitespace-pre-wrap">{msg.content.slice(0, 200)}...</p>
                              ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              )}
                              {isLong && (
                                <button
                                  onClick={() => toggleCollapse(msg.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700 mt-1 font-medium focus:outline-none"
                                >
                                  {isCollapsed ? "Expand" : "Collapse"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex items-center flex-wrap gap-0.5 sm:gap-1 mt-1 justify-end w-full max-w-[85%] md:max-w-[75%]">
                            <button onClick={() => handleCopy(msg.content)} className="p-1 -m-0.5 text-gray-400 hover:text-gray-600 transition" title="Copy">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => startEditing(msg)} className="p-1 -m-0.5 text-gray-400 hover:text-gray-600 transition" title="Edit">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : !isUser ? (
                      <div className="flex gap-3 w-full justify-start">
                        {msg.id === lastAssistantId && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-700 flex items-center justify-center mt-0.5 shadow-sm select-none">
                            <div
                              className="w-5 h-5 select-none"
                              style={{
                                backgroundColor: '#000000',
                                maskImage: 'url(/logo.png)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                WebkitMaskImage: 'url(/logo.png)',
                                WebkitMaskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                              }}
                            />
                          </div>
                        )}
                        <div className={cn(
                          "flex-1 min-w-0 text-zinc-950 pt-1 pl-1 md:pl-2",
                          msg.modelUsed === "plus" ? "overflow-visible h-auto" : ""
                        )}>
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
                          ) : (
                            <>
                              <MarkdownRenderer content={msg.content} modelTier={msg.modelUsed} />
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
                            </>
                          )}
                          {!isEditing && (
                            <div className="flex items-center flex-wrap gap-0.5 sm:gap-1 mt-1.5 justify-start">
                              <button onClick={() => handleCopy(msg.content)} className="p-1 -m-0.5 text-gray-400 hover:text-gray-600 transition" title="Copy">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRefresh(msg.id)}
                                disabled={isLoading}
                                className="p-1 -m-0.5 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                                title="Regenerate"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={handleLike} className="p-1 -m-0.5 text-gray-400 hover:text-gray-600 transition" title="Like">
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={handleDislike} className="p-1 -m-0.5 text-gray-400 hover:text-gray-600 transition" title="Dislike">
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                              {msg.sources && msg.sources.length > 0 && <SourcesPanel sources={msg.sources} />}
                              {msg.modelUsed && MODEL_LABELS[msg.modelUsed] && (
                                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-500 select-none whitespace-nowrap shrink-0" title="Model used for this response">
                                  {MODEL_LABELS[msg.modelUsed]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}

              {isThinking && (
                <motion.div
                  key="thinking-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white text-sm flex items-center gap-2 shadow-sm">
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

              {searching && (
                <motion.div
                  key="searching-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white text-sm flex items-center gap-2 shadow-sm">
                    <span className="text-gray-500">🌐 Netsyra is searching the web…</span>
                  </div>
                </motion.div>
              )}

              {isTyping && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white text-sm flex items-center gap-2 shadow-sm">
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

              {showStream && partialReply && (
                <motion.div
                  key="streaming-bubble"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-700 flex items-center justify-center mt-0.5 shadow-sm select-none">
                    <div
                      className="w-5 h-5 select-none"
                      style={{
                        backgroundColor: '#000000',
                        maskImage: 'url(/logo.png)',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskImage: 'url(/logo.png)',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                      }}
                    />
                  </div>
                  <div className={cn(
                    "flex-1 min-w-0 text-zinc-950 pt-1 pl-1 md:pl-2 bg-white rounded-2xl px-4 py-2",
                    selectedModel === "plus" ? "overflow-visible h-auto" : ""
                  )}>
                    <MarkdownRenderer content={partialReply} modelTier={selectedModel} />
                    {isLoading && (
                      <span className="inline-block w-2 h-5 bg-gray-900 ml-0.5 animate-pulse align-middle rounded-sm" />
                    )}
                  </div>
                </motion.div>
              )}

              {isLoading && !isThinking && !isTyping && !showStream && !searching && (
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
            >
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="chat-input-bar sticky bottom-0 bg-white flex-shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="w-full max-w-[768px] mx-auto px-4 sm:px-6 pt-2 pb-3 sm:pb-4">
          {selectedModel !== "auto" && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 px-1">
              <span>Using {MODEL_LABELS[selectedModel] || selectedModel}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="relative">

            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-1">
                {attachedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="h-20 w-20 object-cover rounded-xl border border-gray-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachedImage(img.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-1.5 sm:gap-2 rounded-[24px] sm:rounded-[28px] bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-sm focus-within:ring-1 focus-within:ring-black transition-all">
              <div className="flex-shrink-0 flex items-center">
                <ModelSelector
                  selected={selectedModel}
                  onSelect={(id) => { setSelectedModel(id); setAutoTiersUsed([]); }}
                  upward
                  isPro={isPro}
                  allowedTiers={allowedTiers}
                  webSearchEnabled={webSearchEnabled}
                  onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
                />
              </div>

              <div className="flex-shrink-0 flex items-center">
                <input
                  type="file"
                  id="image-attachment"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={!isImageAttachEnabled || attachedImages.length >= maxImagesPerMessage || isLoading}
                />
                <label
                  htmlFor={isImageAttachEnabled ? "image-attachment" : undefined}
                  aria-label="Attach images"
                  role="button"
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${isImageAttachEnabled ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed'} ${!isImageAttachEnabled || attachedImages.length >= maxImagesPerMessage || isLoading ? 'opacity-30' : ''}`}
                  title={isImageAttachEnabled ? "Attach images (N Plus, Go Plus, Pro, + Pro)" : "Image analysis requires N Plus, Go Plus, Pro, or + Pro model"}
                >
                  <Paperclip className={`w-4 h-4 ${isImageAttachEnabled ? 'text-gray-500' : 'text-gray-300'}`} />
                </label>
              </div>

              <textarea
                ref={mainInputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                }}
                onPaste={handlePaste}
                onFocus={() => {
                  if (window.innerWidth < 768) {
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
                  }
                }}
                placeholder={attachedImages.length > 0 ? "Add a message about these images..." : "Message Netsyra..."}
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-gray-900 placeholder:text-gray-400 py-1.5 pl-1 text-[15px] leading-relaxed max-h-[200px] overflow-y-auto"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              {(!input.trim() && attachedImages.length === 0 && !isProcessingImage) || isRecording || isTranscribing ? (
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-all shadow-sm relative ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600"
                      : isTranscribing
                        ? "bg-blue-500 cursor-wait"
                        : "bg-black text-white hover:bg-gray-800"
                  } ${isTranscribing ? "opacity-80" : ""}`}
                  aria-label={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Start voice input"}
                  title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing your voice..." : "Voice input — click to start speaking"}
                >
                  {isRecording ? (
                    <>
                      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                      <span className="relative flex items-center justify-center">
                        <Mic className="w-4 h-4 text-white" />
                      </span>
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border border-white animate-pulse" />
                    </>
                  ) : isTranscribing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mic className="w-4 h-4 text-white" />
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && attachedImages.length === 0) || isProcessingImage}
                  className="flex-shrink-0 h-9 w-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-all shadow-sm"
                  aria-label="Send message"
                >
                  {isProcessingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-1.5 leading-tight">
              Netsyra may produce inaccurate information.
              {diveDeep && ` 🌐 Dive Deep ON`}
              {webSearchEnabled && ` 🔍 Web Search ON`}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}