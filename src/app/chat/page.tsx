"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { Menu } from "lucide-react";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("conversation");
  const initialModel = searchParams.get("model") || "auto";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [diveDeep, setDiveDeep] = useState(false);
  const [conversationId, setConversationId] =
    useState<string | null>(initialId);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const [hoverOpened, setHoverOpened] = useState(false);

  const router = useRouter();

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const updateLayout = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    updateLayout();

    window.addEventListener("resize", updateLayout);

    return () => {
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  const handleNewChat = () => {
    setConversationId(null);
    router.push("/chat");
  };

  const handleHistory = () => {
    router.push("/history");
  };

  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    router.push(`/chat?conversation=${id}`);
  };

  const handleConversationCreated = () => {
    setSidebarRefreshKey((k) => k + 1);
  };

  // Desktop hover-open
  const handleHoverEnter = useCallback(() => {
    if (window.innerWidth < 1024) return;

    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

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

  const toggleSidebar = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    setHoverOpened(false);
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-gray-900">
      {/* Desktop hover zone */}
      {!sidebarOpen && (
        <div
          className="hidden lg:block fixed left-0 top-0 bottom-0 z-20 w-3"
          onMouseEnter={handleHoverEnter}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative
          inset-y-0 left-0
          z-40
          w-[85vw] max-w-[320px] lg:w-72
          transform transition-transform duration-200 ease-out
          bg-white
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
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
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setHoverOpened(false);
            setSidebarOpen(false);
          }}
        />
      )}

      {/* Main Area */}
      <div className="flex flex-1 min-w-0 flex-col relative">
        {/* Floating Menu Button – closer to ChatGPT style */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="
            fixed
            top-4
            left-4
            z-50
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white/80
            backdrop-blur-md
            text-gray-600
            hover:bg-gray-100
            hover:text-gray-900
            transition-all
            duration-200
          "
        >
          <Menu className="h-5 w-5" strokeWidth={2.2} />
        </button>

        {/* Chat Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
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