// d:\netsyra\src\components\ide\IdeShell.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useIdeStore,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_DEFAULT_WIDTH,
  RIGHT_PANEL_MIN_WIDTH,
  RIGHT_PANEL_MAX_WIDTH,
  RIGHT_PANEL_DEFAULT_WIDTH,
} from "@/ide";
import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { EditorArea } from "./EditorArea";
import { BottomPanel } from "./BottomPanel";
import { StatusBar } from "./StatusBar";
import { AIChatPanel } from "./AIChatPanel";
import { CommandPalette } from "./CommandPalette";

// Width of the ActivityBar, which the left sidebar starts after
const ACTIVITY_BAR_WIDTH = 44;
// How far the pointer can stray from the divider and still resize it. The
// visible line stays thin, but this makes the ↔ cursor easy to catch.
const RESIZE_HIT_AREA = 11;

/**
 * ResizeDivider — a thin vertical divider between panels. Hovering anywhere in
 * its (wider) hit area shows the ↔ col-resize cursor; dragging resizes the
 * panel. Double-click resets to the default width, and arrow keys nudge it.
 */
function ResizeDivider({
  onResizeStart,
  onReset,
  onNudge,
  label,
  value,
  min,
  max,
  isDragging,
}: {
  onResizeStart: (e: React.PointerEvent) => void;
  onReset: () => void;
  onNudge: (delta: number) => void;
  label: string;
  value: number;
  min: number;
  max: number;
  isDragging: boolean;
}) {
  return (
    <div
      onPointerDown={onResizeStart}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          onNudge(-16);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          onNudge(16);
        } else if (e.key === "Enter") {
          e.preventDefault();
          onReset();
        }
      }}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title="Drag to resize — double-click to reset"
      className="group relative z-50 flex-shrink-0 cursor-col-resize touch-none outline-none"
      style={{ width: RESIZE_HIT_AREA, marginLeft: -(RESIZE_HIT_AREA - 1) / 2, marginRight: -(RESIZE_HIT_AREA - 1) / 2 }}
    >
      {/* Visible 1px line, thickens on hover/drag */}
      <div
        className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] transition-colors ${
          isDragging
            ? "bg-[#34e8bb]"
            : "bg-transparent group-hover:bg-[#34e8bb]/60 group-focus-visible:bg-[#34e8bb]/60"
        }`}
      />
    </div>
  );
}

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

  // Resizable panel widths (desktop only) — persisted in the store
  const sidebarWidth = useIdeStore((s) => s.sidebarWidth);
  const rightWidth = useIdeStore((s) => s.rightPanelWidth);
  const setSidebarWidth = useIdeStore((s) => s.setSidebarWidth);
  const setRightWidth = useIdeStore((s) => s.setRightPanelWidth);

  // Which divider is being dragged (null = none)
  const [dragging, setDragging] = useState<"sidebar" | "right" | null>(null);
  const dragRef = useRef<"sidebar" | "right" | null>(null);

  const startDrag = useCallback(
    (which: "sidebar" | "right") => (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = which;
      setDragging(which);
      // Keep receiving move events even if the pointer outruns the divider
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    []
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();
      if (dragRef.current === "sidebar") {
        // Sidebar starts right after the ActivityBar
        setSidebarWidth(e.clientX - ACTIVITY_BAR_WIDTH);
      } else {
        setRightWidth(window.innerWidth - e.clientX);
      }
    };
    const endDrag = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      setDragging(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [setSidebarWidth, setRightWidth]);

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
            {/* Resize divider for sidebar (desktop only) */}
            {!isMobile && (
              <ResizeDivider
                onResizeStart={startDrag("sidebar")}
                onReset={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
                onNudge={(delta) => setSidebarWidth(sidebarWidth + delta)}
                label="Resize sidebar"
                value={sidebarWidth}
                min={SIDEBAR_MIN_WIDTH}
                max={SIDEBAR_MAX_WIDTH}
                isDragging={dragging === "sidebar"}
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
                {/* Resize divider for right panel (desktop only) */}
                {!isMobile && (
                  <ResizeDivider
                    onResizeStart={startDrag("right")}
                    onReset={() => setRightWidth(RIGHT_PANEL_DEFAULT_WIDTH)}
                    onNudge={(delta) => setRightWidth(rightWidth - delta)}
                    label="Resize AI panel"
                    value={rightWidth}
                    min={RIGHT_PANEL_MIN_WIDTH}
                    max={RIGHT_PANEL_MAX_WIDTH}
                    isDragging={dragging === "right"}
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
