"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { PanelLeftClose, PanelLeft } from "lucide-react";

// Inner component that uses useSearchParams – must be separate
function ChatContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("conversation");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [diveDeep, setDiveDeep] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialId);
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

  return (
    <div className="flex h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 select-none">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center p-0.5">
            <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-indigo-600">Netsyra</span>
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4 text-gray-400 ml-1" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-gray-400 ml-1" />
          )}
        </button>
        <div />
      </div>

      <div className="flex flex-1 pt-12">
        <ChatSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onNewChat={handleNewChat}
          onHistory={handleHistory}
          onSelectConversation={handleSelectConversation}
          activeConversationId={conversationId}
          diveDeep={diveDeep}
          setDiveDeep={setDiveDeep}
        />
        <div className="flex-1 flex flex-col" key={conversationId || "new"}>
          <ChatInterface
            conversationId={conversationId}
            setConversationId={setConversationId}
            diveDeep={diveDeep}
          />
        </div>
      </div>
    </div>
  );
}

// Default export – wraps the inner component with Suspense
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white" />}>
      <ChatContent />
    </Suspense>
  );
}