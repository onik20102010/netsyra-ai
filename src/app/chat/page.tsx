"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { Menu } from "lucide-react";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("conversation");
  const [sidebarOpen, setSidebarOpen] = useState(true);      // true = visible
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
      {/* Top bar – always shows hamburger when sidebar is closed */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 md:px-4 bg-white border-b border-gray-200 select-none">
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
              title="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center p-0.5">
            <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-indigo-600">Netsyra</span>
        </div>
        <div />
      </div>

      <div className="flex flex-1 pt-12">
        {/* Sidebar – slides open/closed; 0 width when closed */}
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