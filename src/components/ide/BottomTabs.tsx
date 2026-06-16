"use client";
import { Home, FolderOpen, MessageSquare, Terminal, Settings } from "lucide-react";

interface BottomTabsProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const tabs = [
  { id: "editor", icon: Home, label: "Home" },
  { id: "explorer", icon: FolderOpen, label: "Explorer" },
  { id: "chat", icon: MessageSquare, label: "AI" },
  { id: "terminal", icon: Terminal, label: "Terminal" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function BottomTabs({ activeView, onViewChange }: BottomTabsProps) {
  return (
    <div className="h-14 border-t border-[#2d2d2d] flex items-center justify-around bg-[#181818] shrink-0">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-md transition-colors ${
            activeView === id ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Icon size={20} />
          <span className="text-[10px] mt-0.5">{label}</span>
        </button>
      ))}
    </div>
  );
}