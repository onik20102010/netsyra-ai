"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquarePlus,
  History,
  BrainCircuit,
  PanelLeftClose,
  MessageSquare,
  Search,
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
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setConversations(data || []);
    };
    fetchConversations();
  }, [user, supabase, refreshKey]);

  // Load profile name, goal, and custom instructions
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
          console.warn("Profile load warning:", error.message);
          if (!cancelled) setNameLoaded(true);
          return;
        }

        if (!cancelled) {
          if (data?.name) setDisplayName(data.name);
          if (data?.goal) setUserGoal(data.goal);
          if (data?.custom_instructions) setUserInstructions(data.custom_instructions);
          setNameLoaded(true);
        }
      } catch (err) {
        console.warn("Profile load warning:", err);
        if (!cancelled) setNameLoaded(true);
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [user, supabase]);

  // Filter conversations based on search
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <>
      <motion.aside
        animate={{ width: open ? 280 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="h-full bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden"
      >
        {open && (
          <>
            {/* Header with close button + search bar */}
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
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition"
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
                <MessageSquarePlus className="h-5 w-5 text-indigo-600" />
                New Chat
              </button>
              <button
                onClick={onHistory}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200/50 transition"
              >
                <History className="h-5 w-5 text-indigo-600" />
                History
              </button>

              <button
                onClick={() => setDiveDeep(!diveDeep)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  diveDeep
                    ? "bg-indigo-100 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-200/50"
                }`}
              >
                <BrainCircuit className={`h-5 w-5 ${diveDeep ? "text-indigo-600" : "text-gray-400"}`} />
                Dive Deep
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${diveDeep ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {diveDeep ? "ON" : "OFF"}
                </span>
              </button>

              <div className="my-3 border-t border-gray-200" />

              {/* Filtered conversation pills */}
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                    activeConversationId === conv.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}

              {searchQuery.trim() && filteredConversations.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  No chats found for "{searchQuery}"
                </p>
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
                        {!displayName && (
                          <p className="text-xs text-gray-500">Click to set your name</p>
                        )}
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
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        userName={displayName}
        userGoal={userGoal}
        userInstructions={userInstructions}
        onSave={async (name: string, goal: string, instructions: string) => {
          if (!user) return;
          try {
            const { error } = await supabase
              .from("profiles")
              .upsert(
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
          } catch (err) {
            toast.error("Something went wrong.");
          }
        }}
      />
    </>
  );
}