"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  MessageSquarePlus,
  History,
  BrainCircuit,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ChatSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onNewChat: () => void;
  onHistory: () => void;
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
  diveDeep: boolean;
  setDiveDeep: (val: boolean) => void;
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
}: ChatSidebarProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const supabase = createClient();

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

    let channel: any = null;
    if (supabase.realtime.isConnected()) {
      channel = supabase
        .channel("conversations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchConversations()
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 0 : 280 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-screen bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden"
    >

      {/* inline */}
      <div className="flex items-center gap-2">
  <div className="w-7 h-7 rounded-md overflow-hidden">
    <img
      src="/logo.png"   // 👈 same file name as above
      alt="Netsyra"
      className="w-full h-full object-contain"
    />
  </div>
  <h2 className="text-lg font-bold text-indigo-600">Netsyra</h2>
</div>

      {/* Nav */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="mr-3 h-5 w-5 text-indigo-600" />
          New Chat
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all"
          onClick={onHistory}
        >
          <History className="mr-3 h-5 w-5 text-indigo-600" />
          History
        </Button>

        {/* Dive Deep toggle */}
        <button
          onClick={() => setDiveDeep(!diveDeep)}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all ${
            diveDeep
              ? "bg-indigo-100 text-indigo-700 font-medium"
              : "text-gray-600 hover:bg-gray-200/50"
          }`}
        >
          <BrainCircuit
            className={`h-5 w-5 ${diveDeep ? "text-indigo-600" : "text-gray-400"}`}
          />
          Dive Deep
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              diveDeep
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {diveDeep ? "ON" : "OFF"}
          </span>
        </button>

        {/* Separator */}
        <div className="my-3 border-t border-gray-200" />

        {/* Conversation pills */}
        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <motion.button
              key={conv.id}
              whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                activeConversationId === conv.id
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{conv.title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* User footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500">Signed in</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}