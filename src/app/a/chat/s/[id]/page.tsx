"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatSidebar from "@/components/chat/ChatSidebar";
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
    <div className="chat-layout flex flex-col lg:flex-row h-dvh bg-white text-gray-900 overflow-hidden">
      {/* ── Sidebar ──
          Desktop: always visible, narrow strip when closed, full when open.
          Mobile: top bar when closed, overlay when open. */}
      <div
        className={`${
          sidebarOpen
            ? "fixed lg:relative inset-y-0 left-0 z-40 w-[85vw] max-w-[320px] lg:w-72 bg-white"
            : "relative lg:w-auto bg-white border-b lg:border-b-0 lg:border-r border-gray-200 z-10"
        } transition-all duration-200 ease-out`}
      >
        <ChatSidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onNewChat={handleNewChat}
          onHistory={handleHistory}
          onSelectConversation={handleSelectConversation}
          activeConversationId={conversationId}
          diveDeep={diveDeep}
          setDiveDeep={setDiveDeep}
        />
      </div>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main chat content ── */}
      <div className="flex flex-1 min-w-0 flex-col relative" key={conversationId}>
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
  );
}