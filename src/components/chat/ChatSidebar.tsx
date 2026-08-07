"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  History,
  BrainCircuit,
  MessageSquare,
  Search,
  Pin,
  Archive,
  Link,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import NetsyraLogo from "./NetsyraLogo";

interface ChatSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onToggleSidebar?: () => void;
  onNewChat: () => void;
  onHistory: () => void;
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
  diveDeep: boolean;
  setDiveDeep: (val: boolean) => void;
  refreshKey?: number;
  onAddConversationReady?: (addFn: (conv: Conversation) => void) => void;
  selectedModel?: string;
}

type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
};

export default function ChatSidebar({
  open,
  setOpen,
  onToggleSidebar,
  onNewChat,
  onHistory,
  onSelectConversation,
  activeConversationId,
  diveDeep,
  setDiveDeep,
  refreshKey = 0,
  onAddConversationReady,
  selectedModel,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'Free' | 'Go Plus' | 'Pro' | '+ Pro'>('Free');
  const supabase = createClient();

  const handleAddConversation = useCallback((conv: Conversation) => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
  }, []);

  useEffect(() => {
    if (onAddConversationReady) {
      onAddConversationReady(handleAddConversation);
    }
  }, [onAddConversationReady, handleAddConversation]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        setIsPro(!!data);
        if (data?.plan) {
          // Map plan names from database to display names
          const planMap: Record<string, 'Free' | 'Go Plus' | 'Pro' | '+ Pro'> = {
            'free': 'Free',
            'go_plus': 'Go Plus',
            'pro': 'Pro',
            'plus_pro': '+ Pro',
          };
          setCurrentPlan(planMap[data.plan] || 'Free');
        } else {
          setCurrentPlan('Free');
        }
      });
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, pinned, archived")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        console.error("Error fetching conversations:", error);
      } else {
        setConversations(data || []);
      }
    };
    fetchConversations();
  }, [user, supabase, refreshKey]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) {
          if (error.message.includes("JWT issued at future")) {
            if (!cancelled) setTimeout(loadProfile, 3000);
            return;
          }
          if (!cancelled) setNameLoaded(true);
          return;
        }
        if (!cancelled) {
          if (data?.name) setDisplayName(data.name);
          setNameLoaded(true);
        }
      } catch {
        if (!cancelled) setNameLoaded(true);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, [user, supabase]);

  const togglePin = async (id: string, current: boolean) => {
    await supabase.from("conversations").update({ pinned: !current }).eq("id", id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !current } : c))
    );
    toast.success(current ? "Unpinned" : "Pinned");
  };

  const archiveConv = async (id: string) => {
    await supabase.from("conversations").update({ archived: true }).eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    toast.success("Archived");
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/chat?conversation=${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.pinned);

  return (
    <div
      className={`flex flex-col overflow-hidden border-r border-white/40 ${open ? "h-full" : "h-auto lg:h-full"}`}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
      }}
    >
      {/* ── Netsyra Logo — always visible at top, toggles sidebar ── */}
      <div className="flex items-center px-4 py-3 border-b border-white/40 flex-shrink-0">
        <NetsyraLogo
          onClick={onToggleSidebar || (() => setOpen(!open))}
          size="sm"
        />
      </div>

      {/* ── Sidebar content — only visible when open ── */}
      {open && (
        <>
          {/* Search bar — below the logo */}
          <div className="p-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/60 border border-white/40 text-sm text-gray-700 outline-none focus:border-indigo-300 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 px-3 space-y-1 overflow-y-auto sidebar-scroll">
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-black/5 transition"
            >
              <MessageSquarePlus className="h-5 w-5 text-indigo-600" /> New Chat
            </button>
            <button
              onClick={onHistory}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-black/5 transition"
            >
              <History className="h-5 w-5 text-indigo-600" /> History
            </button>

            {/* N Live toggle button */}
            <button
              onClick={() => setDiveDeep(!diveDeep)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                diveDeep
                  ? "bg-cyan-100 text-cyan-700 font-medium"
                  : "text-gray-600 hover:bg-black/5"
              }`}
              title="Enable real-time web search for any model"
            >
              <BrainCircuit className={`h-5 w-5 ${diveDeep ? "text-cyan-600" : "text-gray-400"}`} />
              Deep Dive
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                diveDeep ? "bg-cyan-600 text-white" : "bg-black/10 text-gray-500"
              }`}>
                {diveDeep ? "ON" : "OFF"}
              </span>
            </button>

            <div className="my-3 border-t border-white/40" />

            {/* Pinned section */}
            {pinnedConversations.length > 0 && (
              <>
                <div className="flex items-center gap-1 text-xs text-gray-400 pt-2 pb-1 px-1">
                  <Pin className="w-3 h-3" />
                  <span>Pinned</span>
                </div>
                {pinnedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectConversation(conv.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") onSelectConversation(conv.id); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 group cursor-pointer ${
                      activeConversationId === conv.id
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate flex-1">{conv.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyLink(conv.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-gray-400"
                      aria-label="Copy link"
                    >
                      <Link className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(conv.id, conv.pinned); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-gray-400"
                      aria-label="Toggle pin"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); archiveConv(conv.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-gray-400"
                      aria-label="Archive"
                    >
                      <Archive className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="my-2 border-t border-white/30" />
              </>
            )}

            {/* Unpinned conversations */}
            {unpinnedConversations.map((conv) => (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectConversation(conv.id)}
                onKeyDown={(e) => { if (e.key === "Enter") onSelectConversation(conv.id); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 group cursor-pointer ${
                  activeConversationId === conv.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); copyLink(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-gray-400"
                  aria-label="Copy link"
                >
                  <Link className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(conv.id, conv.pinned); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-gray-400"
                  aria-label="Toggle pin"
                >
                  <Pin className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); archiveConv(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-gray-400"
                  aria-label="Archive"
                >
                  <Archive className="w-3 h-3" />
                </button>
              </div>
            ))}

            {searchQuery.trim() && filteredConversations.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No chats found</p>
            )}
          </div>

          {/* User footer – now navigates to /profile */}
          <div className="p-4 border-t border-white/40 flex-shrink-0">
            <button
              onClick={() => router.push("/profile")}
              className="w-full hover:bg-black/5 transition text-left rounded-lg p-2 -m-2"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {(displayName || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    currentPlan === '+ Pro'
                      ? 'bg-purple-500'
                      : currentPlan === 'Pro'
                      ? 'bg-blue-500'
                      : currentPlan === 'Go Plus'
                      ? 'bg-indigo-500'
                      : 'bg-gray-300'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  {nameLoaded ? (
                    <p className="text-sm text-gray-900 truncate font-medium">
                      {displayName || user?.email?.split("@")[0] || "User"}
                    </p>
                  ) : (
                    <div className="w-20 h-4 bg-black/10 rounded animate-pulse" />
                  )}
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}