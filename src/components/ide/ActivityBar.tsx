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
    <div className="hidden md:flex flex-col w-[50px] bg-[#333333] h-full items-center shrink-0 border-r border-[#2d2d2d]">
      {/* Top Activity Icons */}
      <div className="flex flex-col gap-2 pt-2 w-full items-center">
        {/* Explorer */}
        <button
          onClick={() => handleViewClick("explorer")}
          className={`relative w-full h-[48px] flex items-center justify-center transition-colors hover:bg-[#2a2d2e] group ${
            sidebarView === "explorer" && isSidebarOpen
              ? "text-white border-l-2 border-[#007acc] bg-[#2a2d2e]"
              : "text-[#858585] border-l-2 border-transparent"
          }`}
          title="Explorer (Ctrl+Shift+E)"
        >
          <Files size={24} />
          {sidebarView === "explorer" && isSidebarOpen && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]" />
          )}
        </button>

        {/* Search */}
        <button
          onClick={() => handleViewClick("search")}
          className={`relative w-full h-[48px] flex items-center justify-center transition-colors hover:bg-[#2a2d2e] group ${
            sidebarView === "search" && isSidebarOpen
              ? "text-white border-l-2 border-[#007acc] bg-[#2a2d2e]"
              : "text-[#858585] border-l-2 border-transparent"
          }`}
          title="Search (Ctrl+Shift+F)"
        >
          <Search size={24} />
        </button>

        {/* Extensions */}
        <button
          onClick={() => handleViewClick("extensions")}
          className={`relative w-full h-[48px] flex items-center justify-center transition-colors hover:bg-[#2a2d2e] group ${
            sidebarView === "extensions" && isSidebarOpen
              ? "text-white border-l-2 border-[#007acc] bg-[#2a2d2e]"
              : "text-[#858585] border-l-2 border-transparent"
          }`}
          title="Extensions (Ctrl+Shift+X)"
        >
          <Puzzle size={24} />
        </button>

        {/* AI Assistant */}
        <button
          onClick={() => handleViewClick("ai-chat")}
          className={`relative w-full h-[48px] flex items-center justify-center transition-colors hover:bg-[#2a2d2e] group ${
            isRightPanelOpen
              ? "text-white border-l-2 border-[#007acc] bg-[#2a2d2e]"
              : "text-[#858585] border-l-2 border-transparent"
          }`}
          title="AI Assistant (Ctrl+Shift+A)"
        >
          <Bot size={24} />
        </button>
      </div>

      {/* Bottom Activity Icons (Spaced to bottom) */}
      <div className="flex-1" /> {/* Spacer */}
      
      <div className="flex flex-col gap-2 pb-2 w-full items-center">
        {/* Terminal Toggle */}
        <button
          onClick={() => {
            setBottomPanelView("terminal");
            if (!isBottomPanelOpen) toggleBottomPanel();
          }}
          className={`relative w-full h-[48px] flex items-center justify-center transition-colors hover:bg-[#2a2d2e] ${
            isBottomPanelOpen
              ? "text-white border-l-2 border-[#007acc] bg-[#2a2d2e]"
              : "text-[#858585] border-l-2 border-transparent"
          }`}
          title="Toggle Terminal (Ctrl+`)"
        >
          <TerminalSquare size={24} />
        </button>

        {/* Settings */}
        <button
          onClick={() => handleViewClick("settings")}
          className={`relative w-full h-[48px] flex items-center justify-center transition-colors hover:bg-[#2a2d2e] group ${
            sidebarView === "settings" && isSidebarOpen
              ? "text-white border-l-2 border-[#007acc] bg-[#2a2d2e]"
              : "text-[#858585] border-l-2 border-transparent"
          }`}
          title="Settings (Ctrl+,)"
        >
          <Settings size={24} />
        </button>
      </div>
    </div>
  );
}