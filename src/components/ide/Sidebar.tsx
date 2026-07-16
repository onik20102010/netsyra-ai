"use client";

import React from "react";
import { Explorer } from "./Explorer";
import { SearchPanel } from "./SearchPanel";
import { SettingsPanel } from "./SettingsPanel";
import { useIdeStore } from "@/ide";

export function Sidebar() {
  const activeView = useIdeStore((s) => s.activeView);

  return (
    <div className="h-full w-full bg-[#252526] border-r border-[#1e1e1e]">
      {activeView === "explorer" && <Explorer />}
      {activeView === "search" && <SearchPanel />}
      {activeView === "source-control" && (
        <div className="flex items-center justify-center h-full text-[#858585] text-[13px]">
          Source Control
        </div>
      )}
      {activeView === "run-debug" && (
        <div className="flex items-center justify-center h-full text-[#858585] text-[13px]">
          Run and Debug
        </div>
      )}
      {activeView === "extensions" && <SettingsPanel />}
    </div>
  );
}
