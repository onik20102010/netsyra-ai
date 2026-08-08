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

  if (loading || !user || !clientReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  const heroConv = conversations[0] || null;
  const restConvs = conversations.slice(1);

  // ── Reusable sidebar content ──
  const sidebarContent = (
    <>
      <Link
        href="/chat"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Chat
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const content = (
            <span
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                item.active
                  ? "bg-white/5 text-white border border-white/10"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
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

      <div className="mt-auto pt-4 border-t border-white/5">
        <p className="text-xs mt-3 px-3 text-gray-500">Netsyra AI</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-black text-gray-300">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-[260px] z-10 bg-black/80 backdrop-blur-xl border-r border-white/5 p-6 flex-col">
        <div className="mb-8 pb-6 border-b border-white/5">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent"
          >
            Netsyra AI
          </Link>
        </div>
        {sidebarContent}
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-[260px] max-w-[80vw] z-50 bg-black/95 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col md:hidden animate-[slideInLeft_0.2s_ease]">
            <div className="mb-8 pb-6 border-b border-white/5 flex items-center justify-between">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent"
              >
                Netsyra AI
              </Link>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main Content Area ── */}
      <div className="md:ml-[260px] relative z-10 flex-1 overflow-y-auto min-h-screen">
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 flex items-center justify-between md:justify-end px-4 sm:px-8 py-4 border-b border-white/5 backdrop-blur-sm bg-black/40">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs sm:text-sm text-white/40 truncate max-w-[140px] sm:max-w-none">
            {user.email}
          </span>
        </header>

        <main className="relative z-10 px-4 sm:px-8 py-6 sm:py-12 max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-white mb-6 sm:mb-8">
            Your Conversations
          </h1>

          {conversations.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center">
              <MessageSquare
                className="w-12 h-12 mx-auto mb-4 text-gray-500"
              />
              <p className="text-gray-400">
                No conversations yet. Start a new chat to see it here.
              </p>
              <Link
                href="/chat"
                className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 bg-white/5 border border-white/10 hover:bg-white/10"
              >
                Start Chatting →
              </Link>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {heroConv && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all duration-300 hover:border-white/20">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  </div>

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
                          className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none bg-white/10 text-white border border-white/20"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(heroConv.id);
                            if (e.key === "Escape") cancelRename();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveRename(heroConv.id)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-base sm:text-[1.25rem] font-semibold text-white truncate">
                          {heroConv.title}
                        </p>
                        <p className="text-xs sm:text-[0.85rem] mt-0.5 text-gray-400">
                          {formatDate(heroConv.created_at)}
                          {heroConv.msgCount != null && (
                            <span className="text-gray-500">
                              {" · "}
                              {heroConv.msgCount} msg
                              {heroConv.msgCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </Link>

                  {editingId !== heroConv.id && (
                    <div className="flex items-center gap-1 rounded-xl px-2 py-1.5 self-end sm:self-auto bg-white/5">
                      <button
                        onClick={() => startRename(heroConv)}
                        className="p-2 rounded-lg transition-colors hover:bg-white/10"
                        title="Rename"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(heroConv.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {restConvs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {restConvs.map((conv) => (
                    <div
                      key={conv.id}
                      className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]"
                      onMouseEnter={(e) => {
                        setHoveredId(conv.id);
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        setHoveredId(null);
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {editingId === conv.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none bg-white/10 text-white border border-white/20"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename(conv.id);
                              if (e.key === "Escape") cancelRename();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(conv.id)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelRename}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <Link
                              href={`/chat?conversation=${conv.id}`}
                              className="flex items-center gap-2.5 flex-1 min-w-0"
                            >
                              <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-500" />
                              <p className="text-[1rem] font-medium truncate text-white">
                                {conv.title}
                              </p>
                            </Link>
                            <div
                              className="w-1.5 h-1.5 rounded-full bg-gray-500"
                            />
                          </div>

                          <Link
                            href={`/chat?conversation=${conv.id}`}
                            className="block"
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <p className="text-[0.8rem] text-gray-400">
                                {formatDate(conv.created_at)}
                              </p>
                            </div>
                          </Link>

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[0.75rem] px-2 py-0.5 rounded-full text-gray-400 bg-white/5 border border-white/10">
                              {conv.msgCount ?? 0} msg
                              {(conv.msgCount ?? 0) !== 1 ? "s" : ""}
                            </span>

                            <div
                              className="flex items-center gap-1 transition-opacity duration-200"
                              style={{
                                opacity: hoveredId === conv.id ? 1 : 0.4,
                              }}
                            >
                              <button
                                onClick={() => startRename(conv)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                title="Rename"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(conv.id)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
