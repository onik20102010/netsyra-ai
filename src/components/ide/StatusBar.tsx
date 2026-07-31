// d:\netsyra\src\components\ide\StatusBar.tsx
"use client";

import React, { useState } from "react";
import { useIdeStore } from "@/ide";
import { GitBranch, Wifi, Circle, AlertCircle, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";

interface GitInfo {
  branch: string | null;
  ahead: number;
  behind: number;
  modified: number;
  staged: number;
  untracked: number;
  hasGit: boolean;
}

export function StatusBar() {
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const workspace = useIdeStore((s) => s.workspace);

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

  // --- Git info (local only, no server polling) ---
  const [gitInfo] = useState<GitInfo | null>(null);

  const handleProblemsClick = () => {
    if (!isBottomPanelOpen) toggleBottomPanel();
    setBottomPanelView("problems");
  };

  return (
    <div className="flex items-center justify-between h-full px-3 text-[12px] text-[#8b949e] bg-[#0d1117] select-none border-t border-[#1f2428]">
      
      {/* LEFT SIDE: Git, Connection & Problems */}
      <div className="flex items-center gap-3">
        {/* Git Branch */}
        {gitInfo?.hasGit && gitInfo.branch ? (
          <div
            className="flex items-center gap-1.5 hover:bg-[#161b22] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            title={`Branch: ${gitInfo.branch}${gitInfo.ahead > 0 ? ` · ${gitInfo.ahead} ahead` : ""}${gitInfo.behind > 0 ? ` · ${gitInfo.behind} behind` : ""}${gitInfo.modified > 0 ? ` · ${gitInfo.modified} modified` : ""}${gitInfo.staged > 0 ? ` · ${gitInfo.staged} staged` : ""}${gitInfo.untracked > 0 ? ` · ${gitInfo.untracked} untracked` : ""}`}
          >
            <GitBranch size={14} className="text-[#6e7681]" />
            <span>{gitInfo.branch}</span>
            {gitInfo.ahead > 0 && (
              <span className="flex items-center gap-0.5 text-[#3fb950]">
                <ArrowUp size={11} />
                {gitInfo.ahead}
              </span>
            )}
            {gitInfo.behind > 0 && (
              <span className="flex items-center gap-0.5 text-[#d29922]">
                <ArrowDown size={11} />
                {gitInfo.behind}
              </span>
            )}
            {gitInfo.modified > 0 && (
              <span className="text-[#d29922]">{gitInfo.modified}</span>
            )}
            {gitInfo.staged > 0 && (
              <span className="text-[#3fb950]">{gitInfo.staged}</span>
            )}
            {gitInfo.untracked > 0 && (
              <span className="text-[#58a6ff]">{gitInfo.untracked}</span>
            )}
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-1.5 py-0.5 opacity-50"
            title={gitInfo ? "Not a git repository" : "Checking git status..."}
          >
            <GitBranch size={14} className="text-[#6e7681]" />
            <span>{gitInfo ? "No Git" : "..."}</span>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center gap-1.5 hover:bg-[#161b22] px-1.5 py-0.5 rounded cursor-pointer transition-colors opacity-80 hover:opacity-100">
          <Wifi size={14} className="text-[#34e8bb]" />
          <span className="hidden sm:inline">Connected</span>
        </div>

        {/* Problems Count */}
        <div
          className="flex items-center gap-1.5 hover:bg-[#161b22] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          onClick={handleProblemsClick}
          title={`${errorCount} error(s), ${warningCount} warning(s)`}
        >
          <span className="flex items-center gap-1">
            <AlertCircle size={13} className={errorCount > 0 ? "text-[#f85149]" : "text-[#484f58]"} />
            <span>{errorCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle size={13} className={warningCount > 0 ? "text-[#d29922]" : "text-[#484f58]"} />
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
        <div className="hidden sm:flex items-center hover:bg-[#161b22] px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          UTF-8
        </div>

        {/* Line Endings */}
        <div className="hidden sm:flex items-center hover:bg-[#161b22] px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          LF
        </div>

        {/* File Language */}
        <div className="flex items-center gap-1.5 hover:bg-[#161b22] px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <Circle size={10} className="fill-[#34e8bb] text-[#34e8bb]" />
          <span>{language}</span>
        </div>
      </div>
    </div>
  );
}