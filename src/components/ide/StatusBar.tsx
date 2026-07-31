// d:\netsyra\src\components\ide\StatusBar.tsx
"use client";

import React from "react";
import { useIdeStore } from "@/ide";
import { GitBranch, Wifi, Circle, AlertCircle, AlertTriangle } from "lucide-react";

export function StatusBar() {
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);

  // Find the currently active file to extract cursor position and language
  const activeFile = openFiles.find((f) => f.id === activeFileId);
  const problems = useIdeStore((s) => s.problems);
  const setBottomPanelView = useIdeStore((s) => s.setBottomPanelView);
  const toggleBottomPanel = useIdeStore((s) => s.toggleBottomPanel);
  const isBottomPanelOpen = useIdeStore((s) => s.isBottomPanelOpen);

  const line = activeFile?.cursorPosition?.lineNumber || 1;
  const column = activeFile?.cursorPosition?.column || 1;
  const language = activeFile?.language || "Plain Text";

  const allProblems = Object.values(problems).flat();
  const errorCount = allProblems.filter((p) => p.severity === "error").length;
  const warningCount = allProblems.filter((p) => p.severity === "warning").length;

  const handleProblemsClick = () => {
    if (!isBottomPanelOpen) toggleBottomPanel();
    setBottomPanelView("problems");
  };

  return (
    <div className="flex items-center justify-between h-full px-3 text-[12px] text-white bg-[#007acc] select-none">
      
      {/* LEFT SIDE: Git, Connection & Problems */}
      <div className="flex items-center gap-3">
        {/* Git Branch */}
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <GitBranch size={14} className="opacity-90" />
          <span>main</span>
        </div>

        {/* Connection Status / Live Share */}
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors opacity-80 hover:opacity-100">
          <Wifi size={14} />
          <span className="hidden sm:inline">Connected</span>
        </div>

        {/* Problems Count */}
        <div
          className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          onClick={handleProblemsClick}
          title={`${errorCount} error(s), ${warningCount} warning(s)`}
        >
          <span className="flex items-center gap-1">
            <AlertCircle size={13} className={errorCount > 0 ? "text-red-300" : "opacity-50"} />
            <span>{errorCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle size={13} className={warningCount > 0 ? "text-yellow-300" : "opacity-50"} />
            <span>{warningCount}</span>
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Editor Metadata */}
      <div className="flex items-center gap-3">
        {/* Cursor Position */}
        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
          <span className="hidden sm:inline">Ln</span>
          <span>{line}</span>
          <span className="hidden sm:inline">Col</span>
          <span>{column}</span>
        </div>

        {/* File Encoding */}
        <div className="hidden sm:flex items-center hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          UTF-8
        </div>

        {/* Line Endings */}
        <div className="hidden sm:flex items-center hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          LF
        </div>

        {/* File Language */}
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors bg-white/5">
          <Circle size={10} className="fill-current opacity-60" />
          <span>{language}</span>
        </div>
      </div>
    </div>
  );
}