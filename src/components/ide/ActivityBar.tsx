"use client";
import { Files, Search, MessageSquare } from "lucide-react";

interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const activities = [
  { id: "explorer", icon: Files, label: "Explorer" },
  { id: "search", icon: Search, label: "Search" },
  { id: "chat", icon: MessageSquare, label: "AI Chat" },
];

export default function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <div className="flex flex-col items-center w-12 h-full bg-[#333333] border-r border-[#252526] py-2 space-y-4">
      {activities.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={`p-2 rounded-md transition-colors ${
            activeView === id
              ? "text-white bg-[#37373d]"
              : "text-gray-400 hover:text-white hover:bg-[#2a2d2e]"
          }`}
          title={label}
        >
          <Icon size={24} />
        </button>
      ))}
    </div>
  );
}