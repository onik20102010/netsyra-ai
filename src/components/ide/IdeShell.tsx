// d:\netsyra\src\components\ide\IdeShell.tsx
"use client";

import React, { useEffect } from "react";
import { useIdeStore } from "@/ide";
import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { EditorArea } from "./EditorArea";
import { BottomPanel } from "./BottomPanel";
import { StatusBar } from "./StatusBar";
import { AIChatPanel } from "./AIChatPanel";
import { CommandPalette } from "./CommandPalette";

export function IdeShell() {
  const isSidebarOpen = useIdeStore((s) => s.isSidebarOpen);
  const isBottomPanelOpen = useIdeStore((s) => s.isBottomPanelOpen);
  const isRightPanelOpen = useIdeStore((s) => s.isRightPanelOpen);
  const toggleSidebar = useIdeStore((s) => s.toggleSidebar);
  const toggleRightPanel = useIdeStore((s) => s.toggleRightPanel);
  const toggleBottomPanel = useIdeStore((s) => s.toggleBottomPanel);
  const setBottomPanelView = useIdeStore((s) => s.setBottomPanelView);
  const splitEditor = useIdeStore((s) => s.splitEditor);
  const closeSplitEditor = useIdeStore((s) => s.closeSplitEditor);
  const splitEditorFileId = useIdeStore((s) => s.splitEditorFileId);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const openFiles = useIdeStore((s) => s.openFiles);

  // Auto-collapse panels on small screens
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        // On mobile, close both side panels by default
        if (isSidebarOpen && window.innerWidth < 768) toggleSidebar();
        if (isRightPanelOpen && window.innerWidth < 768) toggleRightPanel();
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut: Ctrl+` to toggle terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setBottomPanelView("terminal");
        toggleBottomPanel();
      }
      // Ctrl+\ → toggle split editor
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        if (splitEditorFileId) {
          closeSplitEditor();
        } else if (activeFileId) {
          const other = openFiles.find(f => f.id !== activeFileId);
          if (other) splitEditor(other.id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleBottomPanel, setBottomPanelView, splitEditor, closeSplitEditor, splitEditorFileId, activeFileId, openFiles]);

  return (
    <div className="flex flex-col h-dvh w-screen bg-[#0d1117] overflow-hidden select-none">
      {/* Command Palette overlay (Ctrl+Shift+P / Ctrl+P) */}
      <CommandPalette />
      {/* Top/Middle Section: ActivityBar + Sidebar + Editor + BottomPanel */}
      <div className="flex flex-1 min-h-0">
        {/* Left-most Icon Bar */}
        <ActivityBar />

        {/* File Explorer / Search Sidebar */}
        {isSidebarOpen && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={toggleSidebar}
            />
            <div className="flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] h-full bg-[#0d1117] border-r border-[#1f2428] overflow-hidden z-40 fixed md:relative inset-y-0 left-0">
              <Sidebar />
            </div>
          </>
        )}

        {/* Center & Bottom Section */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-[#0d1117]">
          {/* Editor (Monaco) Area */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 min-h-0">
              <EditorArea />
            </div>

            {/* Right AI Chat Panel */}
            {isRightPanelOpen && (
              <>
                {/* Mobile backdrop */}
                <div
                  className="fixed inset-0 z-30 bg-black/50 md:hidden"
                  onClick={toggleRightPanel}
                />
                <div className="flex-shrink-0 w-[80vw] max-w-[400px] md:w-[400px] h-full md:h-auto bg-[#0d1117] border-l border-[#1f2428] overflow-hidden z-40 fixed md:relative inset-y-0 right-0">
                  <AIChatPanel />
                </div>
              </>
            )}
          </div>

          {/* Bottom Terminal/Output Panel */}
          {isBottomPanelOpen && (
            <div className="flex-shrink-0 h-[150px] sm:h-[200px] bg-[#0d1117] border-t border-[#1f2428] overflow-hidden">
              <BottomPanel />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex-shrink-0 h-[22px] sm:h-[24px] bg-[#0d1117] border-t border-[#1f2428] w-full">
        <StatusBar />
      </div>
    </div>
  );
}