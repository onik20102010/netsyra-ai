"use client";

import React, { useEffect, useRef } from "react";
import { TitleBar } from "./TitleBar";
import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { EditorArea } from "./EditorArea";
import { BottomPanel } from "./BottomPanel";
import { StatusBar } from "./StatusBar";
import { useIdeStore } from "@/ide";

export function IdeShell() {
  const sidebarVisible = useIdeStore((s) => s.sidebarVisible);
  const bottomVisible = useIdeStore((s) => s.bottomVisible);
  const sidebarWidth = useIdeStore((s) => s.sidebarWidth);
  const bottomHeight = useIdeStore((s) => s.bottomHeight);
  const setSidebarWidth = useIdeStore((s) => s.setSidebarWidth);
  const setBottomHeight = useIdeStore((s) => s.setBottomHeight);
  const restoreWorkspace = useIdeStore((s) => s.restoreWorkspace);

  useEffect(() => {
    restoreWorkspace();
  }, [restoreWorkspace]);

  const draggingRef = useRef<"sidebar" | "bottom" | null>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleSidebarDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = "sidebar";
    startPosRef.current = e.clientX;
    startSizeRef.current = sidebarWidth;
  };

  const handleBottomDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = "bottom";
    startPosRef.current = e.clientY;
    startSizeRef.current = bottomHeight;
  };

  useEffect(() => {
    if (!draggingRef.current) return;

    const onMove = (e: MouseEvent) => {
      if (draggingRef.current === "sidebar") {
        const delta = e.clientX - startPosRef.current;
        setSidebarWidth(startSizeRef.current + delta);
      } else if (draggingRef.current === "bottom") {
        const delta = startPosRef.current - e.clientY;
        setBottomHeight(startSizeRef.current + delta);
      }
    };

    const onUp = () => {
      draggingRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setSidebarWidth, setBottomHeight]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />

        {sidebarVisible && (
          <>
            <div style={{ width: sidebarWidth }} className="shrink-0 h-full overflow-hidden">
              <Sidebar />
            </div>
            <div
              onMouseDown={handleSidebarDrag}
              className="w-1 shrink-0 bg-transparent hover:bg-[#007acc] cursor-col-resize transition-colors"
            />
          </>
        )}

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <EditorArea />
          </div>

          {bottomVisible && (
            <>
              <div
                onMouseDown={handleBottomDrag}
                className="h-1 shrink-0 bg-transparent hover:bg-[#007acc] cursor-row-resize transition-colors"
              />
              <div style={{ height: bottomHeight }} className="shrink-0 overflow-hidden">
                <BottomPanel />
              </div>
            </>
          )}
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
