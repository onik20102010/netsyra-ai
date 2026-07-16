"use client";

import React from "react";

export function SettingsPanel() {
  const settings = [
    { label: "Editor: Font Size", value: "14" },
    { label: "Editor: Font Family", value: "Consolas" },
    { label: "Editor: Tab Size", value: "2" },
    { label: "Editor: Word Wrap", value: "off" },
    { label: "Editor: Minimap", value: "enabled" },
    { label: "Editor: Line Numbers", value: "on" },
    { label: "Files: Auto Save", value: "off" },
    { label: "Theme", value: "Netsyra Dark" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      <div className="px-4 h-[35px] flex items-center shrink-0">
        <span className="text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide">Settings</span>
      </div>
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="Search settings"
          className="w-full bg-[#3c3c3c] border border-[#3c3c3c] rounded-sm px-2 h-[26px] text-[13px] text-[#cccccc] placeholder:text-[#858585] focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {settings.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 h-[30px] text-[13px] hover:bg-[#2a2d2e] cursor-default"
          >
            <span className="text-[#cccccc]">{s.label}</span>
            <span className="text-[#858585]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
