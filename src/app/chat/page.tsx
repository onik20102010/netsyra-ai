"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface from "@/components/chat/ChatInterface";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("conversation");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [diveDeep, setDiveDeep] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);   // new
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
    setSidebarRefreshKey((k) => k + 1);   // trigger sidebar refresh
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 select-none">
        {sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center p-0.5">
              <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold text-indigo-600">Netsyra</span>
          </div>
        )}
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
          refreshKey={sidebarRefreshKey}   // pass down
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