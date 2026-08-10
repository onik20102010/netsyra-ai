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
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAllowedTiers } from "@/lib/plan-access";
import { StylePrefs, DEFAULT_STYLE_PREFS } from "@/hooks/useStylePrefs";

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
  const [chatTheme, setChatTheme] = useState<"default" | "dark">("default");

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

  // Load chat theme from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("netsyra_style_prefs");
      if (raw) {
        const prefs = { ...DEFAULT_STYLE_PREFS, ...JSON.parse(raw) } as StylePrefs;
        setChatTheme(prefs.chatTheme || "default");
      }
    } catch {}
    const onStyleUpdate = () => {
      try {
        const raw = localStorage.getItem("netsyra_style_prefs");
        if (raw) {
          const prefs = { ...DEFAULT_STYLE_PREFS, ...JSON.parse(raw) } as StylePrefs;
          setChatTheme(prefs.chatTheme || "default");
        }
      } catch {}
    };
    window.addEventListener("netsyra-style-update", onStyleUpdate as EventListener);
    return () => window.removeEventListener("netsyra-style-update", onStyleUpdate as EventListener);
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
    <div className={`chat-layout flex flex-col lg:flex-row h-dvh overflow-hidden bg-white text-gray-900 safe-top safe-bottom ${chatTheme === "dark" ? "dark-theme" : ""}`}>
      {/* Hover strip — left edge of screen, opens sidebar on mouse enter (desktop only) */}
      {!sidebarOpen && (
        <div
          className="hidden lg:block fixed left-0 top-0 bottom-0 z-20 w-3"
          onMouseEnter={handleHoverEnter}
        />
      )}

      {/* ── Sidebar ──
          Desktop: always visible as a flex item. Narrow strip when closed
                   (just the Netsyra logo), full width when open.
          Mobile: top bar when closed (logo only, messages flow below),
                  overlay sidebar when open. */}
      <div
        className={`${
          sidebarOpen
            ? "fixed lg:relative inset-y-0 left-0 z-40 w-[85vw] max-w-[320px] lg:w-72"
            : "relative lg:w-auto lg:h-full border-b lg:border-b-0 lg:border-r border-white/40 z-10 flex-shrink-0"
        } transition-all duration-200 ease-out`}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
        }}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <ChatSidebar
          open={sidebarOpen}
          setOpen={(open) => {
            setHoverOpened(false);
            setSidebarOpen(open);
          }}
          onToggleSidebar={toggleSidebar}
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

      {/* Mobile overlay backdrop when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setHoverOpened(false);
            setSidebarOpen(false);
          }}
        />
      )}

      {/* ── Main chat content ── */}
      <div className="flex flex-1 min-h-0 min-w-0 flex-col relative">
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
            sidebarOpen={sidebarOpen}
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