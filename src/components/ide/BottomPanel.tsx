"use client";

import React from "react";
import { Terminal as TerminalIcon, List, AlertCircle, Zap, X, Plus } from "lucide-react";
import { useIdeStore } from "@/ide";
import type { BottomTab } from "@/ide";

const tabs: { id: BottomTab; label: string; icon: React.ReactNode }[] = [
  { id: "terminal", label: "Terminal", icon: <TerminalIcon size={12} /> },
  { id: "output", label: "Output", icon: <List size={12} /> },
  { id: "problems", label: "Problems", icon: <AlertCircle size={12} /> },
  { id: "debug", label: "Debug Console", icon: <Zap size={12} /> },
];

export function BottomPanel() {
  const activeTab = useIdeStore((s) => s.bottomTab);
  const setBottomTab = useIdeStore((s) => s.setBottomTab);
  const toggleBottom = useIdeStore((s) => s.toggleBottom);
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-[#3c3c3c]">
      {/* Tab bar */}
      <div className="flex items-center h-[35px] bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setBottomTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 h-full text-[11px] uppercase tracking-wide font-semibold border-r border-[#3c3c3c] transition-colors ${
              activeTab === tab.id
                ? "bg-[#1e1e1e] text-[#cccccc] border-t-2 border-t-[#007acc]"
                : "text-[#858585] hover:text-[#cccccc] hover:bg-[#1e1e1e]"
            }`}
            style={{ marginTop: activeTab === tab.id ? "-1px" : 0 }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1 px-2">
          <button className="p-1 text-[#858585] hover:text-[#cccccc]" title="New Terminal">
            <Plus size={14} />
          </button>
          <button onClick={toggleBottom} className="p-1 text-[#858585] hover:text-[#cccccc]" title="Close Panel">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-2">
        {activeTab === "terminal" && (
          <div className="font-mono text-[13px] text-[#cccccc] space-y-0.5">
            <div className="text-[#858585]">$ netsyra --version</div>
            <div className="text-[#89d185]">Netsyra IDE v0.1.0</div>
            <div className="text-[#858585]">$ <span className="inline-block w-2 h-3.5 bg-[#cccccc] animate-pulse" /></div>
          </div>
        )}
        {activeTab === "output" && (
          <div className="text-[13px] text-[#858585]">No output yet.</div>
        )}
        {activeTab === "problems" && (
          <div className="flex items-center gap-2 text-[13px] text-[#89d185]">
            <AlertCircle size={14} /> No problems detected.
          </div>
        )}
        {activeTab === "debug" && (
          <div className="text-[13px] text-[#858585]">Debug console ready.</div>
        )}
      </div>
    </div>
  );
}
