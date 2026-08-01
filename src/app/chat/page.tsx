"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { Menu, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAllowedTiers } from "@/lib/plan-access";

function ChatContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("conversation");
  const initialModel = searchParams.get("model") || "auto";  // default to "auto" (router picks best model)

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [diveDeep, setDiveDeep] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const [hoverOpened, setHoverOpened] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userPlan, setUserPlan] = useState("free");
  const [allowedTiers, setAllowedTiers] = useState<string[]>(["fast", "plus", "pro", "code", "live", "aai"]);

  // Lifted model state – shared between sidebar (maybe for future use) and chat interface
  // For Pro users, default to NI model
  const [selectedModel, setSelectedModel] = useState<string>(initialModel);

  const router = useRouter();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addConversationRef = useRef<((conv: any) => void) | null>(null);
  const supabase = createClient();

  // ── All hooks must be called before any early return ──
  const handleHoverEnter = useCallback(() => {
    if (window.innerWidth < 1024) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setHoverOpened(true);
    }
  }, [sidebarOpen]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (!hoverOpened) return;
    closeTimer.current = setTimeout(() => {
      setSidebarOpen(false);
      setHoverOpened(false);
    }, 300);
  }, [hoverOpened]);

  const handleNewChat = useCallback(() => {
    setConversationId(null);
    router.push("/chat");
  }, [router]);

  const handleHistory = useCallback(() => {
    router.push("/history");
  }, [router]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setConversationId(id);
      router.push(`/chat?conversation=${id}`);
    },
    [router]
  );

  const handleConversationCreated = useCallback(
    (id: string, firstMessage?: string) => {
      setConversationId(id);
      router.push(`/chat?conversation=${id}`);
      if (addConversationRef.current) {
        addConversationRef.current({
          id,
          title: firstMessage?.slice(0, 50) || "New conversation",
          pinned: false,
          archived: false,
        });
      }
      setSidebarRefreshKey((k) => k + 1);
    },
    [router]
  );

  const toggleSidebar = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHoverOpened(false);
    setSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        const plan = data?.plan || "free";
        setUserPlan(plan);
        const tiers = getAllowedTiers(plan);
        setAllowedTiers(tiers);
        setIsPro(!!data);
        // If plan has only one tier, auto-select it
        if (tiers.length === 1 && selectedModel !== tiers[0]) {
          setSelectedModel(tiers[0]);
        }
      });
  }, [user, supabase]);


  // ── Auth guard (now placed AFTER all hooks) ──
  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white text-gray-600">
        Please log in to use the chat.
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-gray-900 safe-top safe-bottom">
      {!sidebarOpen && (
        <div
          className="hidden lg:block fixed left-0 top-0 bottom-0 z-20 w-3"
          onMouseEnter={handleHoverEnter}
        />
      )}

      <div
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-[85vw] max-w-[320px] lg:w-72 transform transition-transform duration-200 ease-out bg-white ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <ChatSidebar
          open={sidebarOpen}
          setOpen={(open) => {
            setHoverOpened(false);
            setSidebarOpen(open);
          }}
          onNewChat={handleNewChat}
          onHistory={handleHistory}
          onSelectConversation={handleSelectConversation}
          activeConversationId={conversationId}
          diveDeep={diveDeep}
          setDiveDeep={setDiveDeep}
          refreshKey={sidebarRefreshKey}
          onAddConversationReady={(addFn) => {
            addConversationRef.current = addFn;
          }}
          selectedModel={selectedModel}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setHoverOpened(false);
            setSidebarOpen(false);
          }}
        />
      )}

      <div className="flex flex-1 min-w-0 flex-col relative">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition shadow-sm border border-gray-200/50"
        >
          <Menu className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <div className="flex-1 min-h-0">
          <ChatInterface
            conversationId={conversationId}
            setConversationId={setConversationId}
            diveDeep={diveDeep}
            onConversationCreated={handleConversationCreated}
            initialModel={selectedModel}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            isPro={isPro}
            allowedTiers={allowedTiers}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}