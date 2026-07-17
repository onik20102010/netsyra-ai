// d:\netsyra\src\components\ide\IdeShell.tsx
"use client";

import React from "react";
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

  return (
    // CRITICAL FIX: 'h-screen' and 'w-screen' locks the IDE to exact viewport size.
    // 'overflow-hidden' prevents scrollbars on the root, forcing internal flex panels to behave.
    <div className="flex flex-col h-screen w-screen bg-zinc-950 overflow-hidden select-none">
      
      {/* Top/Middle Section: ActivityBar + Sidebar + Editor + BottomPanel */}
      <div className="flex flex-1 min-h-0">
        
        {/* Left-most Icon Bar */}
        <ActivityBar />

        {/* File Explorer / Search Sidebar (Conditionally Rendered) */}
        {isSidebarOpen && (
          <div className="flex-shrink-0 w-[280px] h-full bg-zinc-900 border-r border-[#2d2d2d] overflow-hidden">
            <Sidebar />
          </div>
        )}

        {/* Center & Bottom Section */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-zinc-950">
          {/* Editor (Monaco) Area */}
          <div className="flex-1 min-h-0 overflow-hidden flex">
            <div className="flex-1 min-h-0">
              <EditorArea />
            </div>

            {/* Right AI Chat Panel (Conditionally Rendered) */}
            {isRightPanelOpen && (
              <div className="flex-shrink-0 w-[400px] h-full bg-zinc-900 border-l border-[#2d2d2d] overflow-hidden">
                <AIChatPanel />
              </div>
            )}
          </div>

          {/* Bottom Terminal/Output Panel (Conditionally Rendered) */}
          {isBottomPanelOpen && (
            <div className="flex-shrink-0 h-[200px] bg-zinc-950 border-t border-[#2d2d2d] overflow-hidden">
              <BottomPanel />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex-shrink-0 h-[22px] bg-[#007acc] w-full">
        <StatusBar />
      </div>
    </div>
  );
}