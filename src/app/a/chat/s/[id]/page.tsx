"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import NetsyraLogo from "@/components/chat/NetsyraLogo";
import { createChatClient } from "@/lib/supabase/client";

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [diveDeep, setDiveDeep] = useState(false);
  const [selectedModel, setSelectedModel] = useState("auto");   // ✅ default to auto-router
  const [isPro, setIsPro] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const supabase = createChatClient();

  useEffect(() => {
    const check = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        setIsValid(false);
        return;
      }
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", sessionData.session.user.id)
        .single();
      setIsValid(!!data);

      // Check Pro status and set NI model
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", sessionData.session.user.id)
        .eq("status", "active")
        .maybeSingle();
      const proStatus = !!subData;
      setIsPro(proStatus);
      if (proStatus) {
        setSelectedModel("ni");
      }
    };
    check();
  }, [conversationId, supabase]);

  const handleNewChat = useCallback(() => router.push("/chat"), [router]);
  const handleHistory = useCallback(() => router.push("/history"), [router]);
  const handleSelectConversation = useCallback(
    (id: string) => router.push(`/a/chat/s/${id}`),
    [router]
  );

  if (isValid === null) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-lg">Conversation not found</p>
          <button
            onClick={() => router.push("/chat")}
            className="text-indigo-600 hover:underline text-sm"
          >
            Start a new chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-layout flex h-dvh bg-white text-gray-900 relative overflow-hidden">
      {/* Top bar – Netsyra logo (always visible, toggles sidebar) */}
      <div className="absolute top-3 left-4 sm:left-5 z-20 select-none">
        <NetsyraLogo onClick={() => setSidebarOpen((prev) => !prev)} size="sm" />
      </div>
      <div className="flex flex-1 pt-12">
        <ChatSidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onNewChat={handleNewChat}
          onHistory={handleHistory}
          onSelectConversation={handleSelectConversation}
          activeConversationId={conversationId}
          diveDeep={diveDeep}
          setDiveDeep={setDiveDeep}
        />
        <div className="flex-1 flex flex-col" key={conversationId}>
          <ChatInterface
            conversationId={conversationId}
            setConversationId={() => {}}
            diveDeep={diveDeep}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            isPro={isPro}
            sidebarOpen={sidebarOpen}
          />
        </div>
      </div>
    </div>
  );
}