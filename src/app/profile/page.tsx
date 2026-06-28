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
  Link,
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
    toast.success(current ? "Unpinned from dynamic terminal" : "Pinned to dynamic terminal");
  };

  const archiveConv = async (id: string) => {
    await supabase.from("conversations").update({ archived: true }).eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    toast.success("Conversation archived");
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/chat?conversation=${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Netsyra quantum link copied!");
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
      animate={{ width: open ? 280 : 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-full bg-[#0a0f1d] border-r border-[#1e293b] flex flex-col overflow-hidden text-slate-200 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.3)]"
    >
      {open && (
        <>
          {/* Header */}
          <div className="p-4 flex items-center gap-2 border-b border-[#1e293b] bg-[#0d1527]">
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[#1e293b] text-slate-400 hover:text-cyan-400 transition flex-shrink-0"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search neural index..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#11192e] border border-[#1e293b] text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 bg-[#0e172c] border border-[#1e2b4a]/60 hover:border-cyan-500/40 hover:text-white transition group shadow-sm"
            >
              <MessageSquarePlus className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" /> 
              <span>Initialize Session</span>
            </button>
            
            <button
              onClick={onHistory}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-[#121b33] border border-transparent hover:border-[#1e293b] transition"
            >
              <History className="h-4 w-4 text-slate-400" /> 
              <span>Data Logs</span>
            </button>
            
            <button
              onClick={() => setDiveDeep(!diveDeep)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition border ${
                diveDeep 
                  ? "bg-[#0b2341] border-cyan-500/50 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]" 
                  : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#121b33] hover:border-[#1e293b]"
              }`}
            >
              <BrainCircuit className={`h-4 w-4 ${diveDeep ? "text-cyan-400 animate-pulse" : "text-slate-500"}`} /> 
              <span>Dive Deep</span>
              <span className={`ml-auto text-[10px] tracking-wider font-bold px-2 py-0.5 rounded ${
                diveDeep ? "bg-cyan-500 text-[#070a13]" : "bg-[#16223f] text-slate-400"
              }`}>
                {diveDeep ? "ACTIVE" : "STDBY"}
              </span>
            </button>

            <div className="my-4 border-t border-[#131d33]" />

            {/* Pinned Nodes */}
            {pinnedConversations.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-500/70 pt-1 pb-1 px-2">
                  <Pin className="w-3 h-3 rotate-45 text-cyan-500" />
                  <span>Anchored Streams</span>
                </div>
                {pinnedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectConversation(conv.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") onSelectConversation(conv.id); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2.5 group cursor-pointer border ${
                      activeConversationId === conv.id
                        ? "bg-[#112240] border-cyan-500/30 text-cyan-300 font-medium shadow-[inset_0_0_8px_rgba(6,182,212,0.05)]"
                        : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#101930]"
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeConversationId === conv.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate flex-1">{conv.title}</span>
                    
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyLink(conv.id); }}
                        className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-[#1e293b]"
                        aria-label="Copy link"
                      >
                        <Link className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePin(conv.id, conv.pinned); }}
                        className="p-1 rounded text-cyan-400 hover:bg-[#1e293b]"
                        aria-label="Toggle pin"
                      >
                        <Pin className="w-3 h-3 rotate-45" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); archiveConv(conv.id); }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#1e293b]"
                        aria-label="Archive"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="my-3 border-t border-[#131d33]/50" />
              </>
            )}

            {/* Regular Nodes */}
            {unpinnedConversations.map((conv) => (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectConversation(conv.id)}
                onKeyDown={(e) => { if (e.key === "Enter") onSelectConversation(conv.id); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2.5 group cursor-pointer border ${
                  activeConversationId === conv.id
                    ? "bg-[#112240] border-cyan-500/30 text-cyan-300 font-medium shadow-[inset_0_0_8px_rgba(6,182,212,0.05)]"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#101930]"
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeConversationId === conv.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="truncate flex-1">{conv.title}</span>
                
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyLink(conv.id); }}
                    className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-[#1e293b]"
                    aria-label="Copy link"
                  >
                    <Link className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(conv.id, conv.pinned); }}
                    className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-[#1e293b]"
                    aria-label="Toggle pin"
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); archiveConv(conv.id); }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#1e293b]"
                    aria-label="Archive"
                  >
                    <Archive className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {searchQuery.trim() && filteredConversations.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6 font-mono">No matching nodes indexed</p>
            )}
          </div>

          {/* Operator Footer Profile */}
          <div className="p-4 border-t border-[#1e293b] bg-[#0d1527]">
            <button
              onClick={() => router.push("/profile")}
              className="w-full hover:bg-[#141f38] border border-transparent hover:border-[#223458] transition text-left rounded-xl p-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 flex items-center justify-center text-[#070a13] text-xs font-bold shadow-[0_2px_10px_rgba(6,182,212,0.3)]">
                  {(displayName || user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {nameLoaded ? (
                    <>
                      <p className="text-sm text-slate-200 truncate font-semibold">
                        {displayName || user?.email?.split("@")[0] || "Operator"}
                      </p>
                      {!displayName && <p className="text-[10px] text-cyan-400/70 font-mono tracking-tight">Configure core identity</p>}
                    </>
                  ) : (
                    <div className="w-24 h-4 bg-[#1b2644] rounded animate-pulse" />
                  )}
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </motion.aside>
  );
}