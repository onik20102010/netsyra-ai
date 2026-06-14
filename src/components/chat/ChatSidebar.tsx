"use client";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import ProfileModal from "./ProfileModal";
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
}: ChatSidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [userInstructions, setUserInstructions] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

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
          .select("name, goal, custom_instructions")
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
          if (data?.goal) setUserGoal(data.goal);
          if (data?.custom_instructions) setUserInstructions(data.custom_instructions);
          setNameLoaded(true);
        }
      } catch {
        if (!cancelled) setNameLoaded(true);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, [user, supabase]);

  // Toggle pin
  const togglePin = async (id: string, current: boolean) => {
    await supabase.from("conversations").update({ pinned: !current }).eq("id", id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !current } : c))
    );
    toast.success(current ? "Unpinned" : "Pinned");
  };

  // Archive conversation
  const archiveConv = async (id: string) => {
    await supabase.from("conversations").update({ archived: true }).eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    toast.success("Archived");
  };

  // Filter conversations
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.pinned);

  return (
    <>
      <motion.aside
        animate={{ width: open ? 280 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="h-full bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden"
      >
        {open && (
          <>
            {/* Header */}
            <div className="p-4 flex items-center gap-2 border-b border-gray-200">
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition flex-shrink-0"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-300 transition"
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
            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
              <button
                onClick={onNewChat}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200/50 transition"
              >
                <MessageSquarePlus className="h-5 w-5 text-indigo-600" /> New Chat
              </button>
              <button
                onClick={onHistory}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200/50 transition"
              >
                <History className="h-5 w-5 text-indigo-600" /> History
              </button>

              <button
                onClick={() => setDiveDeep(!diveDeep)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  diveDeep ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-200/50"
                }`}
              >
                <BrainCircuit className={`h-5 w-5 ${diveDeep ? "text-indigo-600" : "text-gray-400"}`} /> Dive Deep
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${diveDeep ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {diveDeep ? "ON" : "OFF"}
                </span>
              </button>

              <div className="my-3 border-t border-gray-200" />

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
                        onClick={(e) => { e.stopPropagation(); togglePin(conv.id, conv.pinned); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 text-gray-400"
                        aria-label="Toggle pin"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); archiveConv(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 text-gray-400"
                        aria-label="Archive"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="my-2 border-t border-gray-100" />
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
                    onClick={(e) => { e.stopPropagation(); togglePin(conv.id, conv.pinned); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 text-gray-400"
                    aria-label="Toggle pin"
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); archiveConv(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 text-gray-400"
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

            {/* User footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setProfileOpen(true)}
                className="w-full hover:bg-gray-100 transition text-left rounded-lg p-2 -m-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                    {(displayName || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {nameLoaded ? (
                      <>
                        <p className="text-sm text-gray-900 truncate font-medium">
                          {displayName || user?.email?.split("@")[0] || "User"}
                        </p>
                        {!displayName && <p className="text-xs text-gray-500">Click to set your name</p>}
                      </>
                    ) : (
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </motion.aside>

      {/* Portal‑based ProfileModal – rendered outside the sidebar container */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        userName={displayName}
        userGoal={userGoal}
        userInstructions={userInstructions}
        onSave={async (name, goal, instructions) => {
          if (!user) return;
          try {
            const { error } = await supabase.from("profiles").upsert(
              { user_id: user.id, name, goal, custom_instructions: instructions },
              { onConflict: "user_id" }
            );
            if (error) {
              toast.error("Could not save profile.");
              return;
            }
            setDisplayName(name);
            setUserGoal(goal);
            setUserInstructions(instructions);
            toast.success("Profile updated!");
          } catch {
            toast.error("Something went wrong.");
          }
        }}
      />
    </>
  );
}