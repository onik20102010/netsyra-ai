"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  History,
  BrainCircuit,
  PanelLeftClose,
  MessageSquare,
  Search,
  Pin,
  Archive,
  Link as LinkIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ChatSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onNewChat: () => void;
  onHistory: () => void;
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
  diveDeep: boolean;
  setDiveDeep: (val: boolean) => void;
  refreshKey?: number;
  onAddConversationReady?: (addFn: (conv: Conversation) => void) => void;
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
  onNewChat,
  onHistory,
  onSelectConversation,
  activeConversationId,
  diveDeep,
  setDiveDeep,
  refreshKey = 0,
  onAddConversationReady,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const handleAddConversation = useCallback((conv: Conversation) => {
    setConversations((prev) => [conv, ...prev]);
  }, []);

  useEffect(() => {
    if (onAddConversationReady) {
      onAddConversationReady(handleAddConversation);
    }
  }, [onAddConversationReady, handleAddConversation]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, title, pinned, archived")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);
      setConversations(data || []);
    };
    fetchConversations();
  }, [user, supabase, refreshKey]);

  // Load profile
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
    <motion.aside
      animate={{ width: open ? 300 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full bg-zinc-950 border-r border-zinc-800 flex flex-col overflow-hidden relative"
    >
      {open && (
        <>
          {/* Header - Glassmorphic */}
          <div className="p-5 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
              <div className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Netsyra
              </div>
            </div>

            {/* Enhanced Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-sm placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation & Content */}
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
            {/* Quick Actions */}
            <div className="space-y-1 mb-6">
              <button
                onClick={onNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.985]"
              >
                <MessageSquarePlus className="h-5 w-5" />
                New Chat
              </button>

              <button
                onClick={onHistory}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all"
              >
                <History className="h-5 w-5" />
                History
              </button>

              {/* Dive Deep Toggle - Futuristic */}
              <button
                onClick={() => setDiveDeep(!diveDeep)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all group relative overflow-hidden ${
                  diveDeep 
                    ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30" 
                    : "hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-xl ${diveDeep ? "bg-indigo-500/10" : "bg-zinc-800"}`}>
                    <BrainCircuit className={`h-5 w-5 ${diveDeep ? "text-indigo-400" : "text-zinc-400"}`} />
                  </div>
                  <span className="font-medium">Dive Deep</span>
                </div>
                
                <div className={`px-3 py-1 text-xs font-mono rounded-full border transition-all ${
                  diveDeep 
                    ? "bg-emerald-500 text-black border-emerald-500" 
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 group-hover:border-zinc-600"
                }`}>
                  {diveDeep ? "ENABLED" : "OFF"}
                </div>
              </button>
            </div>

            <div className="h-px bg-zinc-800 my-4" />

            {/* Pinned */}
            {pinnedConversations.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 px-3 mb-2 text-xs uppercase tracking-widest text-zinc-500">
                  <Pin className="w-3.5 h-3.5" />
                  Pinned
                </div>
                {pinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConversationId === conv.id}
                    onSelect={onSelectConversation}
                    onTogglePin={togglePin}
                    onArchive={archiveConv}
                    onCopyLink={copyLink}
                  />
                ))}
              </div>
            )}

            {/* All Conversations */}
            {unpinnedConversations.length > 0 && (
              <div>
                <div className="px-3 mb-2 text-xs uppercase tracking-widest text-zinc-500">Recent</div>
                {unpinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConversationId === conv.id}
                    onSelect={onSelectConversation}
                    onTogglePin={togglePin}
                    onArchive={archiveConv}
                    onCopyLink={copyLink}
                  />
                ))}
              </div>
            )}

            {searchQuery.trim() && filteredConversations.length === 0 && (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No conversations found
              </div>
            )}
          </div>

          {/* User Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950">
            <button
              onClick={() => router.push("/profile")}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-900 group transition-all"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 flex items-center justify-center text-white font-semibold shadow-inner ring-1 ring-white/20">
                {(displayName || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                {nameLoaded ? (
                  <p className="font-medium text-sm text-white truncate">
                    {displayName || user?.email?.split("@")[0] || "User"}
                  </p>
                ) : (
                  <div className="w-24 h-4 bg-zinc-800 rounded animate-pulse" />
                )}
                <p className="text-xs text-zinc-500 truncate">View profile</p>
              </div>
            </button>
          </div>
        </>
      )}
    </motion.aside>
  );
}

// Extracted Conversation Item for cleaner code
function ConversationItem({
  conv,
  isActive,
  onSelect,
  onTogglePin,
  onArchive,
  onCopyLink,
}: {
  conv: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onArchive: (id: string) => void;
  onCopyLink: (id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(conv.id)}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(conv.id); }}
      className={`group px-4 py-3 rounded-2xl flex items-center gap-3 cursor-pointer mb-1 transition-all hover:bg-zinc-900 ${
        isActive 
          ? "bg-zinc-900 border border-indigo-500/30 shadow-sm" 
          : "hover:shadow-sm"
      }`}
    >
      <MessageSquare className="w-4 h-4 text-zinc-400 flex-shrink-0" />

      <span className="truncate flex-1 text-sm text-zinc-200 font-light pr-2">
        {conv.title}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ActionButton 
          icon={<LinkIcon className="w-3.5 h-3.5" />} 
          onClick={(e) => { e.stopPropagation(); onCopyLink(conv.id); }}
          label="Copy link"
        />
        <ActionButton 
          icon={<Pin className="w-3.5 h-3.5" />} 
          onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id, conv.pinned); }}
          label="Pin"
        />
        <ActionButton 
          icon={<Archive className="w-3.5 h-3.5" />} 
          onClick={(e) => { e.stopPropagation(); onArchive(conv.id); }}
          label="Archive"
        />
      </div>
    </div>
  );
}

function ActionButton({ 
  icon, 
  onClick, 
  label 
}: { 
  icon: React.ReactNode; 
  onClick: (e: React.MouseEvent) => void; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
      aria-label={label}
    >
      {icon}
    </button>
  );
}