"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createChatClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowLeft,
  Home,
  LayoutDashboard,
  FileText,
  Code2,
  Brain,
  Clock,
  Menu,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  msgCount?: number;
};

// ── Sidebar nav items ──
const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Recent Chats", href: "/history", icon: MessageSquare, active: true },
  { label: "CV Builder", href: "https://netsyraai.com/cv-builder/index.html", icon: FileText, external: true },
  { label: "IDE", href: "/ide", icon: Code2 },
];

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [clientReady, setClientReady] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof createChatClient> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    try {
      const client = createChatClient();
      setSupabase(client);
      setClientReady(true);
    } catch (err) {
      console.error("Failed to init Supabase client:", err);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    const fetchConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!data) {
        setConversations([]);
        return;
      }
      // Fetch message counts per conversation
      const counts = await Promise.all(
        data.map(async (conv) => {
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id);
          return { ...conv, msgCount: count ?? 0 };
        })
      );
      setConversations(counts);
    };
    fetchConversations();
  }, [supabase, user]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!supabase) return;
      // Delete messages first (foreign key), then conversation
      await supabase.from("messages").delete().eq("conversation_id", id);
      const { error } = await supabase.from("conversations").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete conversation");
      } else {
        toast.success("Conversation deleted");
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    },
    [supabase]
  );

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveRename = async (id: string) => {
    if (!supabase || !editTitle.trim()) return;
    const { error } = await supabase
      .from("conversations")
      .update({ title: editTitle.trim() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to rename");
    } else {
      toast.success("Conversation renamed");
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c))
      );
    }
    cancelRename();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  // ── Equalizer bars component ──
  const Equalizer = () => (
    <div className="flex items-end gap-[2px] h-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[2px] bg-[#00f5d4] rounded-full"
          style={{
            animation: `eq-bar 0.${6 + i * 2}s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );

  if (loading || !user || !clientReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#071927]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const heroConv = conversations[0] || null;
  const restConvs = conversations.slice(1);

  // ── Reusable sidebar content ──
  const sidebarContent = (
    <>
      {/* Back to Chat */}
      <Link
        href="/chat"
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors mb-4"
        style={{ color: "#d0e6ff" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Chat
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const content = (
            <span
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200"
              style={{
                background: item.active ? "rgba(0, 212, 255, 0.15)" : "transparent",
                color: item.active ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
              }}
              onMouseEnter={(e) => {
                if (!item.active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!item.active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.65)";
                }
              }}
            >
              <Icon
                className="w-4 h-4"
                style={{ stroke: item.active ? "#64dfdf" : "rgba(120, 220, 255, 0.6)" }}
              />
              {item.label}
            </span>
          );
          return item.external ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </a>
          ) : (
            <Link key={item.label} href={item.href}>
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Footer glow */}
      <div className="mt-auto pt-4">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent)",
          }}
        />
        <p
          className="text-xs mt-3 px-3"
          style={{ color: "rgba(255, 255, 255, 0.35)" }}
        >
          Netsyra Neural Interface
        </p>
      </div>
    </>
  );

  const glassSidebarStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid rgba(120, 220, 255, 0.2)",
    boxShadow: "0 8px 32px 0 rgba(0, 180, 216, 0.15)",
  };

  return (
    <div
      className="min-h-screen w-full flex relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at center, #0e3b52 0%, #061522 100%)",
      }}
    >
      {/* ── Neural network backdrop overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(0, 212, 255, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(100, 223, 223, 0.06) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.4) 0%, transparent 100%)
          `,
        }}
      />

      {/* ── Desktop Sidebar (Glass Navigation, ≥768px) ── */}
      <aside
        className="hidden md:flex relative z-10 flex-shrink-0 m-4 w-[240px] lg:w-[260px] flex-col rounded-2xl p-4"
        style={glassSidebarStyle}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Drawer (overlay, <768px) ── */}
      {mobileNavOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="fixed top-0 left-0 h-full w-[260px] max-w-[80vw] z-50 flex flex-col rounded-r-2xl p-4 md:hidden animate-[slideInLeft_0.2s_ease]"
            style={glassSidebarStyle}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-bold"
                style={{ color: "#ffffff" }}
              >
                Menu
              </span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main Content Area ── */}
      <div className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4 md:lg:p-6">
        <div className="max-w-5xl mx-auto">
          {/* Mobile header with hamburger */}
          <div className="flex items-center gap-3 mb-4 md:hidden">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(120, 220, 255, 0.2)",
                background: "rgba(255, 255, 255, 0.05)",
              }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Header */}
          <h1
            className="text-xl sm:text-2xl lg:text-[2rem] font-bold mb-4 sm:mb-6"
            style={{
              color: "#ffffff",
              textShadow: "0 0 10px rgba(0, 212, 255, 0.3)",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Your Conversations
          </h1>

          {conversations.length === 0 ? (
            <div
              className="rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(120, 220, 255, 0.2)",
              }}
            >
              <Brain
                className="w-12 h-12 mx-auto mb-4"
                style={{ stroke: "#64dfdf", opacity: 0.6 }}
              />
              <p style={{ color: "rgba(255, 255, 255, 0.55)" }}>
                No conversations yet. Start a new chat to see it here.
              </p>
              <Link
                href="/chat"
                className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                style={{
                  background: "rgba(0, 212, 255, 0.15)",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                }}
              >
                Start Chatting →
              </Link>
            </div>
          ) : (
            <>
              {/* ── Featured Hero Card ── */}
              {heroConv && (
                <div
                  className="rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all duration-300"
                  style={{
                    background: "rgba(15, 35, 55, 0.45)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(135, 206, 250, 0.25)",
                    boxShadow: "0 8px 32px 0 rgba(0, 180, 216, 0.1)",
                  }}
                >
                  {/* Glowing brain icon */}
                  <div
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(0, 212, 255, 0.1)",
                      border: "1px solid rgba(100, 223, 223, 0.3)",
                    }}
                  >
                    <Brain
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      style={{
                        stroke: "#64dfdf",
                        filter: "drop-shadow(0 0 4px rgba(100, 223, 223, 0.5))",
                      }}
                    />
                  </div>

                  {/* Title + date */}
                  <Link
                    href={`/chat?conversation=${heroConv.id}`}
                    className="flex-1 min-w-0"
                  >
                    {editingId === heroConv.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none bg-white/10 text-white border border-cyan-400/30"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(heroConv.id);
                            if (e.key === "Escape") cancelRename();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveRename(heroConv.id)}
                          className="p-1.5 text-green-400 hover:bg-green-400/10 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="p-1.5 text-white/50 hover:bg-white/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p
                          className="text-base sm:text-[1.25rem] font-semibold truncate"
                          style={{ color: "#ffffff" }}
                        >
                          {heroConv.title}
                        </p>
                        <p
                          className="text-xs sm:text-[0.85rem] mt-0.5"
                          style={{ color: "#8ab4f8" }}
                        >
                          {formatDate(heroConv.created_at)}
                          {heroConv.msgCount != null && (
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>
                              {" · "}
                              {heroConv.msgCount} msg
                              {heroConv.msgCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </Link>

                  {/* Action buttons pill */}
                  {editingId !== heroConv.id && (
                    <div
                      className="flex items-center gap-1 rounded-xl px-2 py-1.5 self-end sm:self-auto"
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <button
                        onClick={() => startRename(heroConv)}
                        className="p-2 rounded-lg transition-colors hover:bg-white/10"
                        title="Rename"
                      >
                        <Edit3
                          className="w-4 h-4"
                          style={{ stroke: "#70e000" }}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(heroConv.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-500/20 group"
                        title="Delete"
                      >
                        <Trash2
                          className="w-4 h-4 transition-colors"
                          style={{ stroke: "rgba(255,255,255,0.7)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.stroke = "#ef4444";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.stroke = "rgba(255,255,255,0.7)";
                          }}
                        />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Grid of conversation cards ── */}
              {restConvs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                  {restConvs.map((conv) => (
                    <div
                      key={conv.id}
                      className="group relative rounded-[14px] p-4 transition-all duration-300"
                      style={{
                        background: "rgba(20, 45, 65, 0.35)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(0, 212, 255, 0.15)",
                      }}
                      onMouseEnter={(e) => {
                        setHoveredId(conv.id);
                        e.currentTarget.style.borderColor =
                          "rgba(0, 212, 255, 0.4)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 24px 0 rgba(0, 180, 216, 0.12)";
                      }}
                      onMouseLeave={(e) => {
                        setHoveredId(null);
                        e.currentTarget.style.borderColor =
                          "rgba(0, 212, 255, 0.15)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {editingId === conv.id ? (
                        /* ── Inline rename mode ── */
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none bg-white/10 text-white border border-cyan-400/30"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename(conv.id);
                              if (e.key === "Escape") cancelRename();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(conv.id)}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelRename}
                            className="p-1.5 text-white/50 hover:bg-white/10 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Top row: icon + equalizer */}
                          <div className="flex items-start justify-between mb-3">
                            <Link
                              href={`/chat?conversation=${conv.id}`}
                              className="flex items-center gap-2.5 flex-1 min-w-0"
                            >
                              <MessageSquare
                                className="w-4 h-4 flex-shrink-0"
                                style={{ stroke: "rgba(255,255,255,0.7)" }}
                              />
                              <p
                                className="text-[1rem] font-medium truncate"
                                style={{ color: "#ffffff" }}
                              >
                                {conv.title}
                              </p>
                            </Link>
                            {/* Equalizer / status indicator */}
                            {hoveredId === conv.id ? (
                              <Equalizer />
                            ) : (
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background: "#00f5d4",
                                  boxShadow: "0 0 6px rgba(0, 245, 212, 0.6)",
                                  animation:
                                    "neural-glow 2s ease-in-out infinite",
                                }}
                              />
                            )}
                          </div>

                          {/* Date row */}
                          <Link
                            href={`/chat?conversation=${conv.id}`}
                            className="block"
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock
                                className="w-3 h-3"
                                style={{ stroke: "rgba(255,255,255,0.4)" }}
                              />
                              <p
                                className="text-[0.8rem]"
                                style={{
                                  color: "rgba(255,255,255,0.5)",
                                }}
                              >
                                {formatDate(conv.created_at)}
                              </p>
                            </div>
                          </Link>

                          {/* Bottom row: msg count badge + hover actions */}
                          <div className="flex items-center justify-between mt-3">
                            {/* Msg count badge */}
                            <span
                              className="text-[0.75rem] px-2 py-0.5 rounded-full"
                              style={{
                                color: "rgba(255,255,255,0.6)",
                                background: "rgba(0, 212, 255, 0.08)",
                                border: "1px solid rgba(0, 212, 255, 0.12)",
                              }}
                            >
                              {conv.msgCount ?? 0} msg
                              {(conv.msgCount ?? 0) !== 1 ? "s" : ""}
                            </span>

                            {/* Hover action controls (fade in on desktop, always visible on mobile) */}
                            <div
                              className="flex items-center gap-1 transition-opacity duration-200 card-actions"
                              style={{
                                opacity: hoveredId === conv.id ? 1 : undefined,
                              }}
                            >
                              <button
                                onClick={() => startRename(conv)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                title="Rename"
                              >
                                <Edit3
                                  className="w-3.5 h-3.5"
                                  style={{ stroke: "#70e000" }}
                                />
                              </button>
                              <button
                                onClick={() => handleDelete(conv.id)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20"
                                title="Delete"
                              >
                                <Trash2
                                  className="w-3.5 h-3.5 transition-colors"
                                  style={{ stroke: "rgba(255,255,255,0.7)" }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.stroke = "#ef4444";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.stroke =
                                      "rgba(255,255,255,0.7)";
                                  }}
                                />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
