"use client";

import React from "react";
import { GitBranch, Bell, Wifi, Activity, Cpu, Database, Zap, Circle } from "lucide-react";
import { useIdeStore } from "@/ide";

export function StatusBar() {
  const cursor = useIdeStore((s) => s.cursor);
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const activeFile = openFiles.find((f) => f.id === activeFileId);
  const unsavedCount = openFiles.filter((f) => f.unsaved).length;

  return (
    <div className="h-[22px] flex items-center justify-between bg-[#007acc] text-white text-[11px] select-none shrink-0">
      {/* Left */}
      <div className="flex items-center h-full">
        <div className="flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <GitBranch size={12} />
          <span>main</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <Wifi size={12} />
          <span>Connected</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <Activity size={12} />
          <span>idle</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <Cpu size={12} />
          <span>0/0 subsystems</span>
        </div>
        {unsavedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
            <Circle size={8} fill="currentColor" />
            <span>{unsavedCount} unsaved</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center h-full">
        <div className="hidden md:flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <Zap size={12} />
          <span>0 events</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <Database size={12} />
          <span>0 MB</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <span>Ln {cursor.lineNumber}, Col {cursor.column}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 h-full hover:bg-white/15 cursor-pointer transition-colors">
          <span>{activeFile?.language ? activeFile.language.charAt(0).toUpperCase() + activeFile.language.slice(1) : "Plain Text"}</span>
        </div>
        <button className="flex items-center px-2 h-full hover:bg-white/15 transition-colors" title="Notifications">
          <Bell size={12} />
        </button>
      </div>
    </div>
  );
}
