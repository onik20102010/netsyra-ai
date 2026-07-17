// d:\netsyra\src\components\ide\Sidebar.tsx
"use client";

import React from "react";
import { useIdeStore } from "@/ide";
import { Explorer } from "./Explorer";
import { SearchPanel } from "./SearchPanel";
import { SettingsPanel } from "./SettingsPanel";
import { X } from "lucide-react";

export function Sidebar() {
  const sidebarView = useIdeStore((s) => s.sidebarView);
  const toggleSidebar = useIdeStore((s) => s.toggleSidebar);

  // Generate header title based on active view
  const getHeaderTitle = () => {
    switch (sidebarView) {
      case "explorer": return "EXPLORER";
      case "search": return "SEARCH";
      case "extensions": return "EXTENSIONS";
      case "settings": return "SETTINGS";
      default: return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Sidebar Header with Title */}
      <div className="h-[35px] flex items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-[#cccccc] border-b border-[#3e3e3e] shrink-0 select-none">
        <span>{getHeaderTitle()}</span>
        <button
          className="md:hidden p-1 rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-white transition-colors"
          onClick={toggleSidebar}
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-auto min-h-0 bg-zinc-900">
        {sidebarView === "explorer" && <Explorer />}
        {sidebarView === "search" && <SearchPanel />}
        {sidebarView === "extensions" && (
          <div className="flex items-center justify-center h-full text-[#858585] text-sm">
            Extensions marketplace coming soon.
          </div>
        )}
        {sidebarView === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}