// d:\netsyra\src\components\ide\TitleBar.tsx
"use client";

import React from "react";
import { useIdeStore } from "@/ide";
import { Minus, Square, X, Menu } from "lucide-react";

export function TitleBar() {
  const isSidebarOpen = useIdeStore((s) => s.isSidebarOpen);
  const toggleSidebar = useIdeStore((s) => s.toggleSidebar);

  return (
    <div className="flex items-center justify-between h-[35px] bg-[#3c3c3c] text-[#cccccc] text-[13px] select-none shrink-0 border-b border-[#252526]">
      
      {/* LEFT: Mobile Menu Button */}
      <button
        className="md:hidden p-2 hover:bg-[#2a2d2e] rounded transition-colors"
        onClick={toggleSidebar}
        title="Toggle Sidebar"
      >
        <Menu size={18} />
      </button>

      {/* LEFT: Menu Items (Desktop) */}
      <div className="hidden sm:flex items-center gap-0.5 px-2 h-full">
        <div className="px-2.5 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors">File</div>
        <div className="px-2.5 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors">Edit</div>
        <div className="px-2.5 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors">Selection</div>
        <div className="px-2.5 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors">View</div>
        <div className="px-2.5 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors">Go</div>
        <div className="px-2.5 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors">Run</div>
        <div className="px-2.5 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors">Terminal</div>
        <div className="px-2.5 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors">Help</div>
      </div>

      {/* CENTER: App Title */}
      <div className="flex-1 text-center text-[14px] font-medium tracking-tight text-[#cccccc]">
        Netsyra IDE
      </div>
    </div>
  );
}