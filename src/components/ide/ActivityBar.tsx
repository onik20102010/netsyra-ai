"use client";

import React from "react";
import { FolderTree, Search, GitBranch, Puzzle, Sparkles, Activity, Bell, Settings } from "lucide-react";

export type View = "explorer" | "search" | "source-control" | "extensions" | "chat" | "runtime";

interface ActivityBarProps {
  active: View;
  onSelect: (v: View) => void;
}

const activityItems: { id: View; icon: React.ReactNode; label: string }[] = [
  { id: "explorer", icon: <FolderTree size={18} />, label: "Explorer" },
  { id: "search", icon: <Search size={18} />, label: "Search" },
  { id: "source-control", icon: <GitBranch size={18} />, label: "Source Control" },
  { id: "extensions", icon: <Puzzle size={18} />, label: "Extensions" },
  { id: "chat", icon: <Sparkles size={18} />, label: "AI Chat" },
  { id: "runtime", icon: <Activity size={18} />, label: "Runtime" },
];

export function ActivityBar({ active, onSelect }: ActivityBarProps) {
  return (
    <div className="w-12 flex flex-col items-center py-2 bg-ide-surface border-r border-ide-border z-ide-sidebar">
      <div className="flex flex-col gap-1 flex-1">
        {activityItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            title={item.label}
            className={`w-9 h-9 flex items-center justify-center rounded transition-all duration-ide-fast ${
              active === item.id
                ? "text-ide-foreground bg-ide-surface-active"
                : "text-ide-foreground-dim hover:text-ide-foreground hover:bg-ide-surface-hover"
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1 mt-auto">
        <button className="w-9 h-9 flex items-center justify-center rounded text-ide-foreground-dim hover:text-ide-foreground hover:bg-ide-surface-hover transition-colors">
          <Bell size={18} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded text-ide-foreground-dim hover:text-ide-foreground hover:bg-ide-surface-hover transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
