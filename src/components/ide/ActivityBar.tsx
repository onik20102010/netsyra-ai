// d:\netsyra\src\components\ide\ActivityBar.tsx
"use client";

import React from "react";
import { useIdeStore, SidebarView } from "@/ide";
import { Files, Search, Puzzle, Settings, Bot, TerminalSquare } from "lucide-react";

export function ActivityBar() {
  const sidebarView = useIdeStore((s) => s.sidebarView);
  const setSidebarView = useIdeStore((s) => s.setSidebarView);
  const isSidebarOpen = useIdeStore((s) => s.isSidebarOpen);
  const toggleSidebar = useIdeStore((s) => s.toggleSidebar);
  const isRightPanelOpen = useIdeStore((s) => s.isRightPanelOpen);
  const toggleRightPanel = useIdeStore((s) => s.toggleRightPanel);
  const isBottomPanelOpen = useIdeStore((s) => s.isBottomPanelOpen);
  const toggleBottomPanel = useIdeStore((s) => s.toggleBottomPanel);
  const setBottomPanelView = useIdeStore((s) => s.setBottomPanelView);

  // Helper to toggle or switch views to match VS Code behavior
  const handleViewClick = (view: SidebarView) => {
    // AI chat opens right panel instead of left sidebar
    if (view === 'ai-chat') {
      toggleRightPanel();
      return;
    }

    if (sidebarView === view && isSidebarOpen) {
      toggleSidebar(); // If clicking the active view, toggle the panel closed
    } else {
      setSidebarView(view);
      if (!isSidebarOpen) toggleSidebar(); // If panel is closed, open it with the new view
    }
  };

  return (
    <div
      className="hidden md:flex flex-col w-[50px] bg-[#0d1117] h-full items-center shrink-0 border-r border-[#1f2428]"
      role="toolbar"
      aria-label="Activity Bar"
      aria-orientation="vertical"
    >
      {/* Top Activity Icons */}
      <div className="flex flex-col gap-1 pt-2 w-full items-center">
        {/* Explorer */}
        <button
          onClick={() => handleViewClick("explorer")}
          className={`relative w-full h-[42px] flex items-center justify-center transition-colors hover:bg-[#161b22] group ${
            sidebarView === "explorer" && isSidebarOpen
              ? "text-[#34e8bb] bg-[#161b22]"
              : "text-[#6e7681] hover:text-[#e6edf3]"
          }`}
          title="Explorer (Ctrl+Shift+E)"
          aria-label="Explorer"
          aria-pressed={sidebarView === "explorer" && isSidebarOpen}
        >
          <Files size={22} />
          {sidebarView === "explorer" && isSidebarOpen && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#34e8bb]" />
          )}
        </button>

        {/* Search */}
        <button
          onClick={() => handleViewClick("search")}
          className={`relative w-full h-[42px] flex items-center justify-center transition-colors hover:bg-[#161b22] group ${
            sidebarView === "search" && isSidebarOpen
              ? "text-[#34e8bb] bg-[#161b22]"
              : "text-[#6e7681] hover:text-[#e6edf3]"
          }`}
          title="Search (Ctrl+Shift+F)"
          aria-label="Search"
          aria-pressed={sidebarView === "search" && isSidebarOpen}
        >
          <Search size={22} />
          {sidebarView === "search" && isSidebarOpen && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#34e8bb]" />
          )}
        </button>

        {/* Extensions */}
        <button
          onClick={() => handleViewClick("extensions")}
          className={`relative w-full h-[42px] flex items-center justify-center transition-colors hover:bg-[#161b22] group ${
            sidebarView === "extensions" && isSidebarOpen
              ? "text-[#34e8bb] bg-[#161b22]"
              : "text-[#6e7681] hover:text-[#e6edf3]"
          }`}
          title="Extensions (Ctrl+Shift+X)"
          aria-label="Extensions"
          aria-pressed={sidebarView === "extensions" && isSidebarOpen}
        >
          <Puzzle size={22} />
          {sidebarView === "extensions" && isSidebarOpen && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#34e8bb]" />
          )}
        </button>

        {/* AI Assistant */}
        <button
          onClick={() => handleViewClick("ai-chat")}
          className={`relative w-full h-[42px] flex items-center justify-center transition-colors hover:bg-[#161b22] group ${
            isRightPanelOpen
              ? "text-[#34e8bb] bg-[#161b22]"
              : "text-[#6e7681] hover:text-[#e6edf3]"
          }`}
          title="AI Assistant (Ctrl+Shift+A)"
          aria-label="AI Assistant"
          aria-pressed={isRightPanelOpen}
        >
          <Bot size={22} />
          {isRightPanelOpen && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#34e8bb]" />
          )}
        </button>
      </div>

      {/* Bottom Activity Icons (Spaced to bottom) */}
      <div className="flex-1" />

      <div className="flex flex-col gap-1 pb-2 w-full items-center">
        {/* Terminal Toggle */}
        <button
          onClick={() => {
            setBottomPanelView("terminal");
            if (!isBottomPanelOpen) toggleBottomPanel();
          }}
          className={`relative w-full h-[42px] flex items-center justify-center transition-colors hover:bg-[#161b22] ${
            isBottomPanelOpen
              ? "text-[#34e8bb] bg-[#161b22]"
              : "text-[#6e7681] hover:text-[#e6edf3]"
          }`}
          title="Toggle Terminal (Ctrl+`)"
          aria-label="Toggle Terminal"
          aria-pressed={isBottomPanelOpen}
        >
          <TerminalSquare size={22} />
          {isBottomPanelOpen && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#34e8bb]" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => handleViewClick("settings")}
          className={`relative w-full h-[42px] flex items-center justify-center transition-colors hover:bg-[#161b22] group ${
            sidebarView === "settings" && isSidebarOpen
              ? "text-[#34e8bb] bg-[#161b22]"
              : "text-[#6e7681] hover:text-[#e6edf3]"
          }`}
          title="Settings (Ctrl+,)"
          aria-label="Settings"
          aria-pressed={sidebarView === "settings" && isSidebarOpen}
        >
          <Settings size={22} />
          {sidebarView === "settings" && isSidebarOpen && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#34e8bb]" />
          )}
        </button>
      </div>
    </div>
  );
}