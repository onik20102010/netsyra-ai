"use client";

import React from "react";
import { Search } from "lucide-react";

interface TitleBarProps {
  onCommandPalette: () => void;
}

export function TitleBar({ onCommandPalette }: TitleBarProps) {
  return (
    <div className="h-9 flex items-center justify-between px-3 bg-ide-surface border-b border-ide-border text-ide-foreground select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-ide-primary flex items-center justify-center text-ide-primary-foreground text-[10px] font-bold">N</div>
          <span className="text-xs font-medium">Netsyra IDE</span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-ide-foreground-dim text-ide-xs">
          <span className="hover:text-ide-foreground cursor-pointer">File</span>
          <span className="hover:text-ide-foreground cursor-pointer">Edit</span>
          <span className="hover:text-ide-foreground cursor-pointer">View</span>
          <span className="hover:text-ide-foreground cursor-pointer">Go</span>
          <span className="hover:text-ide-foreground cursor-pointer">Run</span>
          <span className="hover:text-ide-foreground cursor-pointer">AI</span>
          <span className="hover:text-ide-foreground cursor-pointer">Help</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCommandPalette}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-ide-bg border border-ide-border text-ide-foreground-dim hover:text-ide-foreground hover:border-ide-border transition-colors text-ide-xs"
        >
          <Search size={12} />
          <span className="hidden sm:inline">Command Palette</span>
          <span className="hidden md:inline text-[10px] opacity-60">⌘K</span>
        </button>
      </div>
    </div>
  );
}
