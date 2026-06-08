"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { Menu } from "lucide-react";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("conversation");
  const initialModel = searchParams.get("model") || "auto";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [diveDeep, setDiveDeep] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const router = useRouter();

  const handleNewChat = () => {
    setConversationId(null);
    router.push("/chat");
  };
  const handleHistory = () => router.push("/history");
  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    router.push(`/chat?conversation=${id}`);
  };
  const handleConversationCreated = (id: string) => {
    setSidebarRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 md:px-4 bg-white border-b border-gray-200 select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center p-0.5">
            <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-[#4D6BFE] font-mono tracking-tight">Netsyra</span>
        </div>
        <div />
      </div>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-[52px] left-2 z-30 w-10 h-10 rounded-full bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_0_15px_rgba(0,0,0,0.05)] flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-[0_0_25px_rgba(0,0,0,0.08)] transition-all"
          title="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex flex-1 pt-[46px]">
        <ChatSidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onNewChat={handleNewChat}
          onHistory={handleHistory}
          onSelectConversation={handleSelectConversation}
          activeConversationId={conversationId}
          diveDeep={diveDeep}
          setDiveDeep={setDiveDeep}
          refreshKey={sidebarRefreshKey}
        />
        <div className="flex-1 flex flex-col" key={conversationId || "new"}>
          <ChatInterface
            conversationId={conversationId}
            setConversationId={setConversationId}
            diveDeep={diveDeep}
            onConversationCreated={handleConversationCreated}
            initialModel={initialModel}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white" />}>
      <ChatContent />
    </Suspense>
  );
}