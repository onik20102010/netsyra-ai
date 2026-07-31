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
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Sidebar Header with Title */}
      <div className="h-[35px] flex items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-[#e6edf3] border-b border-[#1f2428] shrink-0 select-none">
        <span>{getHeaderTitle()}</span>
        <button
          className="md:hidden p-1 rounded hover:bg-[#161b22] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
          onClick={toggleSidebar}
          title="Close"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-auto min-h-0 bg-[#0d1117]">
        {sidebarView === "explorer" && <Explorer />}
        {sidebarView === "search" && <SearchPanel />}
        {sidebarView === "extensions" && (
          <div className="flex items-center justify-center h-full text-[#6e7681] text-sm">
            Extensions marketplace coming soon.
          </div>
        )}
        {sidebarView === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}