"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquarePlus,
  History,
  BrainCircuit,
  PanelLeftClose,
  Menu,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import ProfileModal from "./ProfileModal";
import { toast } from "sonner";

interface ChatSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
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
  collapsed,
  setCollapsed,
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
  const [nameLoaded, setNameLoaded] = useState(false);   // ✅ prevent flicker
  const supabase = createClient();

  // Fetch conversations – re‑fetch when user, supabase, or refreshKey changes
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

  // ✅ Load profile name only once when user first appears
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
          console.error("Failed to load profile:", error.message);
          return;
        }
        if (!cancelled && data?.name) {
          setDisplayName(data.name);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        if (!cancelled) setNameLoaded(true);
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [user, supabase]);

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 60 : 280 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="h-full bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden"
      >
        {collapsed ? (
          <div className="flex flex-col items-center py-4 gap-4">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition"
              title="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={onNewChat}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition"
              title="New chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
            <button
              onClick={onHistory}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition"
              title="History"
            >
              <History className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center p-0.5">
                  <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-lg font-bold text-indigo-600">Netsyra</h2>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
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

              {/* Dive Deep toggle */}
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
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    diveDeep ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {diveDeep ? "ON" : "OFF"}
                </span>
              </button>

              <div className="my-3 border-t border-gray-200" />

              {/* Conversation pills */}
              {conversations.map((conv) => (
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
            </div>

            {/* User footer */}
            <button
              onClick={() => setProfileOpen(true)}
              className="w-full p-4 border-t border-gray-200 hover:bg-gray-100 transition text-left"
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
          </>
        )}
      </motion.aside>
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        userName={displayName}
        onSave={async (name: string) => {
          if (!user) return;

          try {
            const { error } = await supabase.from("profiles").upsert(
              { user_id: user.id, name },
              { onConflict: "user_id" }
            );
            if (error) {
              console.error("Failed to save profile:", error.message);
              toast.error("Could not save name. Please try again.");
              return;
            }
            setDisplayName(name);
            toast.success("Profile updated!");
          } catch (err) {
            console.error("Profile save error:", err);
            toast.error("Something went wrong.");
          }
        }}
      />
    </>
  );
}