// d:\netsyra\src\components\ide\TitleBar.tsx
"use client";

import React from "react";
import { useIdeStore } from "@/ide";
import { Menu } from "lucide-react";
import { MenuBar } from "./MenuBar";

export function TitleBar() {
  const toggleSidebar = useIdeStore((s) => s.toggleSidebar);

  return (
    <div className="flex items-center justify-between h-[35px] bg-[#0d1117] text-[#8b949e] text-[13px] select-none shrink-0 border-b border-[#1f2428]">
      
      {/* LEFT: Mobile Menu Button */}
      <button
        className="md:hidden p-2 hover:bg-[#161b22] rounded transition-colors"
        onClick={toggleSidebar}
        title="Toggle Sidebar"
      >
        <Menu size={18} />
      </button>

      {/* LEFT: Functional Menu Bar (Desktop) */}
      <MenuBar />

      {/* CENTER: App Title */}
      <div className="flex-1 text-center text-[14px] font-medium tracking-tight text-[#34e8bb]">
        Netsyra IDE
      </div>
    </div>
  );
}