// d:\netsyra\src\components\ide\BottomPanel.tsx
"use client";

import React from "react";
import { useIdeStore, BottomPanelView } from "@/ide";
import { Terminal, FileOutput, AlertCircle, Bug, X } from "lucide-react";
import { ProblemsPanel } from "./ProblemsPanel";

export function BottomPanel() {
  const bottomPanelView = useIdeStore((s) => s.bottomPanelView);
  const toggleBottomPanel = useIdeStore((s) => s.toggleBottomPanel);
  const problems = useIdeStore((s) => s.problems);

  const problemCount = Object.values(problems).flat().filter(p => p.severity === 'error' || p.severity === 'warning').length;

  // Available tabs
  const tabs: { id: BottomPanelView; label: string; icon: React.ReactNode }[] = [
    { id: "terminal", label: "Terminal", icon: <Terminal size={14} /> },
    { id: "output", label: "Output", icon: <FileOutput size={14} /> },
    { id: "problems", label: "Problems", icon: <AlertCircle size={14} /> },
    { id: "debug", label: "Debug", icon: <Bug size={14} /> },
  ];

  // --- Render Active Panel Content ---
  const renderContent = () => {
    switch (bottomPanelView) {
      case "terminal":
        return (
          <div className="font-mono text-[13px] text-[#cccccc] p-3 overflow-auto h-full bg-[#1e1e1e]">
            <div className="flex gap-2 items-center text-[#89e051] mb-1">
              <span>➜</span>
              <span className="text-[#569cd6]">~/workspace</span>
              <span className="text-white">$</span>
              <span className="text-[#ce9178]">_</span>
            </div>
            <div className="text-[#cccccc]">Netsyra Web IDE Terminal (Mock)</div>
            <div className="text-[#858585] text-[12px] mt-1">
              Type `npm start` or `python app.py` to simulate a command...
            </div>
            <div className="mt-4 flex gap-2 items-center text-[#89e051]">
              <span>➜</span>
              <span className="text-[#569cd6]">~/workspace</span>
              <span className="text-white">$</span>
              <span className="animate-pulse text-white">|</span>
            </div>
          </div>
        );
      case "output":
        return (
          <div className="font-mono text-[13px] text-[#cccccc] p-3 overflow-auto h-full bg-[#1e1e1e]">
            <div className="text-[#858585]">[12:00:00] ⏺️ Output panel ready.</div>
            <div className="text-[#858585]">[12:00:01] 📁 Workspace loaded successfully.</div>
            <div className="text-[#569cd6]">[12:00:02] ℹ️  Build process started...</div>
            <div className="text-[#89e051]">[12:00:03] ✅ Build completed in 1.2s.</div>
          </div>
        );
      case "problems":
        return <ProblemsPanel />;
      case "debug":
        return (
          <div className="font-mono text-[13px] text-[#cccccc] p-3 overflow-auto h-full bg-[#1e1e1e]">
            <div className="text-[#569cd6]">🔍 Debug console ready.</div>
            <div className="text-[#858585]">Breakpoint at main.ts:15.</div>
            <div className="text-[#858585]">Variables: {`{ count: 0, status: "idle" }`}</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] select-none">
      {/* Panel Header / Tabs */}
      <div className="flex items-center h-[30px] bg-[#252526] border-b border-[#2d2d2d] shrink-0 px-2">
        {/* Tab Buttons */}
        <div className="flex-1 flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = bottomPanelView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => useIdeStore.getState().setBottomPanelView(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 text-[12px] rounded transition-colors ${
                  isActive
                    ? "bg-[#37373d] text-white"
                    : "text-[#858585] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === "problems" && problemCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#5a1d1d] text-red-400 text-[10px] font-medium leading-none">
                    {problemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel Close Button */}
        <button
          onClick={toggleBottomPanel}
          className="p-1 rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-white transition-colors ml-2"
          title="Close Panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}