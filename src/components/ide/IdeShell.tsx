// d:\netsyra\src\components\ide\IdeShell.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useIdeStore } from "@/ide";
import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { EditorArea } from "./EditorArea";
import { BottomPanel } from "./BottomPanel";
import { StatusBar } from "./StatusBar";
import { AIChatPanel } from "./AIChatPanel";
import { CommandPalette } from "./CommandPalette";

// Resizable panel constraints
const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 500;
const RIGHT_MIN = 280;
const RIGHT_MAX = 700;

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

  // Track mobile state for layout decisions
  const [isMobile, setIsMobile] = useState(false);

  // Resizable panel widths (desktop only)
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(420);

  // Drag state
  const dragRef = useRef<"sidebar" | "right" | null>(null);

  const startDrag = useCallback((which: "sidebar" | "right") => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = which;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      if (dragRef.current === "sidebar") {
        // ActivityBar is 44px; sidebar starts at x=44
        const w = e.clientX - 44;
        setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w)));
      } else if (dragRef.current === "right") {
        // Right panel width = window.innerWidth - e.clientX
        const w = window.innerWidth - e.clientX;
        setRightWidth(Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, w)));
      }
    };
    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
        {/* Left-most Icon Bar — always visible (desktop + mobile) */}
        <ActivityBar />

        {/* ── Left Sidebar (Explorer / Search / Settings) ──
            Desktop: inline, pushes editor right, slides in/out
            Mobile: fixed overlay with backdrop, slides from left */}
        {isSidebarOpen && (
          <>
            {/* Mobile backdrop */}
            {isMobile && (
              <div
                className="fixed inset-0 z-30 bg-black/50 animate-[fadeIn_0.15s_ease]"
                onClick={toggleSidebar}
              />
            )}
            <div
              className={`
                h-full bg-[#0d1117] border-r border-[#1f2428] overflow-hidden z-40
                ${isMobile
                  ? "fixed inset-y-0 left-[44px] w-[78vw] max-w-[280px] animate-[slideInLeft_0.2s_ease]"
                  : "relative flex-shrink-0"
                }
              `}
              style={isMobile ? undefined : { width: sidebarWidth }}
            >
              <Sidebar />
            </div>
            {/* Resize handle for sidebar (desktop only) */}
            {!isMobile && (
              <div
                onMouseDown={startDrag("sidebar")}
                className="relative flex-shrink-0 w-[3px] cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors z-50"
                title="Drag to resize"
              />
            )}
          </>
        )}

        {/* Center & Bottom Section */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-[#0d1117]">
          {/* Editor (Monaco) Area + Right Panel */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 min-h-0">
              <EditorArea />
            </div>

            {/* ── Right AI Chat Panel ──
                Desktop: inline, pushes editor left, slides in/out
                Mobile: fixed overlay with backdrop, slides from right */}
            {isRightPanelOpen && (
              <>
                {/* Resize handle for right panel (desktop only) */}
                {!isMobile && (
                  <div
                    onMouseDown={startDrag("right")}
                    className="relative flex-shrink-0 w-[3px] cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors z-50"
                    title="Drag to resize"
                  />
                )}
                {/* Mobile backdrop */}
                {isMobile && (
                  <div
                    className="fixed inset-0 z-30 bg-black/50 animate-[fadeIn_0.15s_ease]"
                    onClick={toggleRightPanel}
                  />
                )}
                <div
                  className={`
                    h-full bg-[#0d1117] border-l border-[#1f2428] overflow-hidden z-40
                    ${isMobile
                      ? "fixed inset-y-0 right-0 w-[85vw] max-w-[400px] animate-[slideInRight_0.2s_ease]"
                      : "relative flex-shrink-0"
                    }
                  `}
                  style={isMobile ? undefined : { width: rightWidth }}
                >
                  <AIChatPanel />
                </div>
              </>
            )}
          </div>

          {/* Bottom Terminal/Output Panel */}
          {isBottomPanelOpen && (
            <div className="flex-shrink-0 h-[160px] sm:h-[200px] bg-[#0d1117] border-t border-[#1f2428] overflow-hidden">
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
