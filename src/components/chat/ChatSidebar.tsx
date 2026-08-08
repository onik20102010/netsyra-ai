"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Check,
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

  // Hard delete: removes conversation AND all its messages from Supabase to free up space
  const deleteConv = async (id: string) => {
    // Delete all messages belonging to this conversation first
    const { error: msgError } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", id);
    if (msgError) {
      console.error("Error deleting messages:", msgError);
      toast.error("Failed to delete chat messages");
      return;
    }

    // Then delete the conversation itself
    const { error: convError } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);
    if (convError) {
      console.error("Error deleting conversation:", convError);
      toast.error("Failed to delete chat");
      return;
    }

    // Remove from local state
    setConversations((prev) => prev.filter((c) => c.id !== id));
    toast.success("Chat deleted");

    // If the deleted conversation was active, navigate to new chat
    if (activeConversationId === id) {
      onNewChat();
    }
  };

  const renameConv = async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("conversations")
      .update({ title: trimmed })
      .eq("id", id);
    if (error) {
      toast.error("Failed to rename chat");
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
    );
    toast.success("Chat renamed");
  };

  const copyChat = async (id: string, title: string) => {
    // Fetch all messages for this conversation
    const { data: messages, error } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error || !messages || messages.length === 0) {
      toast.error("Failed to copy chat");
      return;
    }

    // Format as readable text
    const text = messages
      .map((m) => {
        const role = m.role === "user" ? "You" : "Netsyra";
        return `${role}: ${m.content}`;
      })
      .join("\n\n");

    await navigator.clipboard.writeText(`# ${title}\n\n${text}`);
    toast.success("Chat copied to clipboard");
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
      <div className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/40 flex-shrink-0">
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
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConversationId === conv.id}
                    onSelect={onSelectConversation}
                    onPin={togglePin}
                    onArchive={archiveConv}
                    onDelete={deleteConv}
                    onRename={renameConv}
                    onCopyChat={copyChat}
                    onCopyLink={copyLink}
                  />
                ))}
                <div className="my-2 border-t border-white/30" />
              </>
            )}

            {/* Unpinned conversations */}
            {unpinnedConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={activeConversationId === conv.id}
                onSelect={onSelectConversation}
                onPin={togglePin}
                onArchive={archiveConv}
                onDelete={deleteConv}
                onRename={renameConv}
                onCopyChat={copyChat}
                onCopyLink={copyLink}
              />
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

// ── ConversationItem: chat history pill with ellipsis popup menu ──
function ConversationItem({
  conv,
  isActive,
  onSelect,
  onPin,
  onArchive,
  onDelete,
  onRename,
  onCopyChat,
  onCopyLink,
}: {
  conv: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onPin: (id: string, current: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onCopyChat: (id: string, title: string) => void;
  onCopyLink: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conv.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (renaming) {
      setTimeout(() => {
        renameRef.current?.focus();
        renameRef.current?.select();
      }, 0);
    }
  }, [renaming]);

  const handleRenameSubmit = () => {
    onRename(conv.id, renameValue);
    setRenaming(false);
    setMenuOpen(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSubmit();
    }
    if (e.key === "Escape") {
      setRenaming(false);
      setRenameValue(conv.title);
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (confirm(`Delete "${conv.title}"? This will permanently remove the chat and all its messages.`)) {
      onDelete(conv.id);
    }
  };

  // Rename mode — inline input
  if (renaming) {
    return (
      <div className="w-full px-3 py-1.5 flex items-center gap-2">
        <input
          ref={renameRef}
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameSubmit}
          className="flex-1 bg-white border border-indigo-300 rounded-md px-2 py-1 text-sm outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleRenameSubmit}
          className="p-1 rounded hover:bg-black/10 text-green-600"
          aria-label="Confirm rename"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(conv.id)}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(conv.id); }}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 group cursor-pointer ${
        isActive
          ? "bg-indigo-50 text-indigo-700 font-medium"
          : "text-gray-500 hover:text-gray-900"
      }`}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      <span className="truncate flex-1">{conv.title}</span>

      {/* Ellipsis button — always visible on active, hover on others */}
      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className={`p-1 rounded hover:bg-black/10 text-gray-400 hover:text-gray-700 transition ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          aria-label="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Popup menu */}
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rename */}
            <button
              onClick={() => { setRenaming(true); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
              Rename
            </button>

            {/* Copy chat */}
            <button
              onClick={() => { onCopyChat(conv.id, conv.title); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400" />
              Copy chat
            </button>

            {/* Copy link */}
            <button
              onClick={() => { onCopyLink(conv.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Link className="w-3.5 h-3.5 text-gray-400" />
              Copy link
            </button>

            {/* Pin / Unpin */}
            <button
              onClick={() => { onPin(conv.id, conv.pinned); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Pin className="w-3.5 h-3.5 text-gray-400" />
              {conv.pinned ? "Unpin" : "Pin"}
            </button>

            {/* Archive */}
            <button
              onClick={() => { onArchive(conv.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Archive className="w-3.5 h-3.5 text-gray-400" />
              Archive
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-100 my-1" />

            {/* Delete — permanent, red */}
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}