"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { createClient } from "@/lib/supabase/client";

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);   // ✅ renamed
  const [diveDeep, setDiveDeep] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const supabase = createClient();

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
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
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
    <div className="flex h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* Top bar – show logo only when sidebar is closed */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 md:px-4 py-2 bg-white border-b border-gray-200 select-none">
        {!sidebarOpen && (
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
          />
        </div>
      </div>
    </div>
  );
}