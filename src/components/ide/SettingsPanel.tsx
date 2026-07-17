// d:\netsyra\src\components\ide\SettingsPanel.tsx
"use client";

import React, { useState } from "react";
import { useIdeStore } from "@/ide";
import { Search, ChevronRight, ToggleLeft, ToggleRight, Puzzle, Settings as SettingsIcon } from "lucide-react";

export function SettingsPanel() {
  const sidebarView = useIdeStore((s) => s.sidebarView);

  // Mock state for settings toggles
  const [settings, setSettings] = useState({
    autoSave: true,
    formatOnSave: true,
    wordWrap: false,
    minimap: true,
    bracketPairColorization: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // If we are in the Extensions view
  if (sidebarView === "extensions") {
    return (
      <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] p-3 select-none">
        <div className="flex items-center relative mb-4">
          <Search size={14} className="absolute left-2 text-[#858585]" />
          <input
            type="text"
            placeholder="Search Extensions"
            className="w-full bg-[#3c3c3c] text-[#cccccc] text-[13px] py-1.5 pl-7 pr-2 rounded-sm border border-transparent focus:border-[#007acc] outline-none placeholder-[#858585] transition-colors"
          />
        </div>
        
        <div className="flex-1 overflow-auto space-y-3">
          {/* Extension Card 1 */}
          <div className="bg-[#2a2d2e] p-3 rounded-sm border border-[#3e3e3e] hover:border-[#007acc] transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-[#007acc] flex items-center justify-center text-white font-bold text-[10px]">
                TS
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">TypeScript IntelliSense</div>
                <div className="text-[11px] text-[#858585] truncate">Microsoft · 12.4M downloads</div>
                <div className="text-[12px] text-[#cccccc] mt-1 line-clamp-2">
                  TypeScript support for Netsyra IDE. Includes advanced type checking and auto-completion.
                </div>
              </div>
            </div>
          </div>

          {/* Extension Card 2 */}
          <div className="bg-[#2a2d2e] p-3 rounded-sm border border-[#3e3e3e] hover:border-[#007acc] transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-[#e34c26] flex items-center justify-center text-white font-bold text-[10px]">
                &lt;/&gt;
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">HTML CSS Support</div>
                <div className="text-[11px] text-[#858585] truncate">Microsoft · 8.1M downloads</div>
                <div className="text-[12px] text-[#cccccc] mt-1 line-clamp-2">
                  Rich HTML and CSS language features. Auto-close tags, emmet, and CSS IntelliSense.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we are in the Settings view
  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] p-3 select-none overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#3e3e3e]">
        <SettingsIcon size={16} className="text-[#cccccc]" />
        <span className="text-[13px] font-medium">Settings</span>
      </div>

      {/* Editor Settings Group */}
      <div className="space-y-3">
        <div className="text-[11px] text-[#858585] uppercase tracking-wider font-bold">Editor</div>
        
        {/* Toggle: Auto Save */}
        <div className="flex items-center justify-between hover:bg-[#2a2d2e] p-1.5 rounded transition-colors cursor-pointer" onClick={() => toggleSetting('autoSave')}>
          <div className="flex flex-col">
            <span className="text-[13px]">Auto Save</span>
            <span className="text-[11px] text-[#858585]">Automatically save files after typing</span>
          </div>
          {settings.autoSave ? <ToggleRight size={20} className="text-[#007acc]" /> : <ToggleLeft size={20} className="text-[#858585]" />}
        </div>

        {/* Toggle: Format on Save */}
        <div className="flex items-center justify-between hover:bg-[#2a2d2e] p-1.5 rounded transition-colors cursor-pointer" onClick={() => toggleSetting('formatOnSave')}>
          <div className="flex flex-col">
            <span className="text-[13px]">Format on Save</span>
            <span className="text-[11px] text-[#858585]">Automatically format code when saving</span>
          </div>
          {settings.formatOnSave ? <ToggleRight size={20} className="text-[#007acc]" /> : <ToggleLeft size={20} className="text-[#858585]" />}
        </div>

        {/* Toggle: Word Wrap */}
        <div className="flex items-center justify-between hover:bg-[#2a2d2e] p-1.5 rounded transition-colors cursor-pointer" onClick={() => toggleSetting('wordWrap')}>
          <div className="flex flex-col">
            <span className="text-[13px]">Word Wrap</span>
            <span className="text-[11px] text-[#858585]">Wrap long lines to fit the editor width</span>
          </div>
          {settings.wordWrap ? <ToggleRight size={20} className="text-[#007acc]" /> : <ToggleLeft size={20} className="text-[#858585]" />}
        </div>

        <div className="border-t border-[#3e3e3e] my-2"></div>

        {/* Toggle: Minimap */}
        <div className="flex items-center justify-between hover:bg-[#2a2d2e] p-1.5 rounded transition-colors cursor-pointer" onClick={() => toggleSetting('minimap')}>
          <div className="flex flex-col">
            <span className="text-[13px]">Minimap</span>
            <span className="text-[11px] text-[#858585]">Show a code overview on the right side</span>
          </div>
          {settings.minimap ? <ToggleRight size={20} className="text-[#007acc]" /> : <ToggleLeft size={20} className="text-[#858585]" />}
        </div>

        {/* Toggle: Bracket Pair Colorization */}
        <div className="flex items-center justify-between hover:bg-[#2a2d2e] p-1.5 rounded transition-colors cursor-pointer" onClick={() => toggleSetting('bracketPairColorization')}>
          <div className="flex flex-col">
            <span className="text-[13px]">Bracket Pair Colorization</span>
            <span className="text-[11px] text-[#858585]">Colorize matching brackets for readability</span>
          </div>
          {settings.bracketPairColorization ? <ToggleRight size={20} className="text-[#007acc]" /> : <ToggleLeft size={20} className="text-[#858585]" />}
        </div>
      </div>
    </div>
  );
}