// d:\netsyra\src\components\ide\BottomPanel.tsx
"use client";

import React from "react";
import { useIdeStore, BottomPanelView } from "@/ide";
import { Terminal, FileOutput, AlertCircle, Bug, X } from "lucide-react";
import { ProblemsPanel } from "./ProblemsPanel";
import { TerminalPanel } from "./TerminalPanel";
import { OutputPanel } from "./OutputPanel";
import { DebugPanel } from "./DebugPanel";

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
        return <TerminalPanel />;
      case "output":
        return <OutputPanel />;
      case "problems":
        return <ProblemsPanel />;
      case "debug":
        return <DebugPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] select-none">
      {/* Panel Header / Tabs */}
      <div className="flex items-center h-[30px] bg-[#161b22] border-b border-[#1f2428] shrink-0 px-2">
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
                    ? "bg-[#1f2428] text-[#34e8bb]"
                    : "text-[#6e7681] hover:bg-[#1f2428] hover:text-[#e6edf3]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === "problems" && problemCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#f85149]/20 text-[#f85149] text-[10px] font-medium leading-none">
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
          className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#e6edf3] transition-colors ml-2"
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