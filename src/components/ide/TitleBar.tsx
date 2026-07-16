"use client";

import React from "react";
import { Search } from "lucide-react";

interface TitleBarProps {
  onCommandPalette?: () => void;
}

export function TitleBar({ onCommandPalette }: TitleBarProps) {
  return (
    <div className="h-[35px] flex items-center justify-between px-2 bg-[#323233] text-[#cccccc] select-none text-[13px] shrink-0">
      {/* Left: logo + menu */}
      <div className="flex items-center gap-3">
        <div className="w-[16px] h-[16px] rounded-sm bg-[#007acc] flex items-center justify-center text-white text-[10px] font-bold">
          N
        </div>
        <div className="hidden md:flex items-center gap-0">
          {["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"].map((item) => (
            <span
              key={item}
              className="px-2 py-0.5 hover:bg-white/10 cursor-pointer transition-colors"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Center: command palette */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <button
          onClick={onCommandPalette}
          className="flex items-center justify-center gap-2 px-3 py-0.5 w-[600px] max-w-[50vw] rounded bg-[#3c3c3c] hover:bg-[#4a4a4a] border border-[#3c3c3c] text-[#cccccc] transition-colors text-[13px]"
        >
          <Search size={14} />
          <span>Netsyra IDE</span>
        </button>
      </div>

      {/* Right: window controls */}
      <div className="flex items-center gap-2 opacity-80">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 cursor-pointer" />
      </div>
    </div>
  );
}
