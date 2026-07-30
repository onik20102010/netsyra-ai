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

export function IdeShell() {
  const isSidebarOpen = useIdeStore((s) => s.isSidebarOpen);
  const isBottomPanelOpen = useIdeStore((s) => s.isBottomPanelOpen);
  const isRightPanelOpen = useIdeStore((s) => s.isRightPanelOpen);
  const toggleSidebar = useIdeStore((s) => s.toggleSidebar);
  const toggleRightPanel = useIdeStore((s) => s.toggleRightPanel);

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

  return (
    <div className="flex flex-col h-dvh w-screen bg-zinc-950 overflow-hidden select-none">
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
            <div className="flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] h-full bg-zinc-900 border-r border-[#2d2d2d] overflow-hidden z-40 fixed md:relative inset-y-0 left-0">
              <Sidebar />
            </div>
          </>
        )}

        {/* Center & Bottom Section */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-zinc-950">
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
                <div className="flex-shrink-0 w-[80vw] max-w-[400px] md:w-[400px] h-full md:h-auto bg-zinc-900 border-l border-[#2d2d2d] overflow-hidden z-40 fixed md:relative inset-y-0 right-0">
                  <AIChatPanel />
                </div>
              </>
            )}
          </div>

          {/* Bottom Terminal/Output Panel */}
          {isBottomPanelOpen && (
            <div className="flex-shrink-0 h-[150px] sm:h-[200px] bg-zinc-950 border-t border-[#2d2d2d] overflow-hidden">
              <BottomPanel />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex-shrink-0 h-[22px] sm:h-[24px] bg-[#007acc] w-full">
        <StatusBar />
      </div>
    </div>
  );
}