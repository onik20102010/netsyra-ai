"use client";

import React from "react";
import {
  FolderTree,
  Search,
  GitBranch,
  Bug,
  Puzzle,
  Settings,
  User,
} from "lucide-react";
import { useIdeStore } from "@/ide";
import type { ActivityView } from "@/ide";

const items: { id: ActivityView; icon: React.ReactNode; label: string }[] = [
  { id: "explorer", icon: <FolderTree size={24} strokeWidth={1.3} />, label: "Explorer" },
  { id: "search", icon: <Search size={24} strokeWidth={1.3} />, label: "Search" },
  { id: "source-control", icon: <GitBranch size={24} strokeWidth={1.3} />, label: "Source Control" },
  { id: "run-debug", icon: <Bug size={24} strokeWidth={1.3} />, label: "Run and Debug" },
  { id: "extensions", icon: <Puzzle size={24} strokeWidth={1.3} />, label: "Extensions" },
];

export function ActivityBar() {
  const active = useIdeStore((s) => s.activeView);
  const setActiveView = useIdeStore((s) => s.setActiveView);

  return (
    <div className="w-[48px] flex flex-col items-center bg-[#333333] shrink-0">
      <div className="flex flex-col flex-1 w-full">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            title={item.label}
            className={`relative w-full h-[48px] flex items-center justify-center transition-colors ${
              active === item.id
                ? "text-white"
                : "text-[#858585] hover:text-[#cccccc]"
            }`}
          >
            {active === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]" />
            )}
            {item.icon}
          </button>
        ))}
      </div>
      <div className="flex flex-col w-full">
        <button className="w-full h-[48px] flex items-center justify-center text-[#858585] hover:text-[#cccccc] transition-colors">
          <User size={24} strokeWidth={1.3} />
        </button>
        <button className="w-full h-[48px] flex items-center justify-center text-[#858585] hover:text-[#cccccc] transition-colors">
          <Settings size={24} strokeWidth={1.3} />
        </button>
      </div>
    </div>
  );
}
