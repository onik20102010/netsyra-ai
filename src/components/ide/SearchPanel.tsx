"use client";

import React from "react";
import { Search, ChevronRight, FileCode } from "lucide-react";

export function SearchPanel() {
  return (
    <div className="flex flex-col h-full bg-[#252526]">
      {/* Header */}
      <div className="px-4 h-[35px] flex items-center shrink-0">
        <span className="text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide">Search</span>
      </div>

      {/* Search inputs */}
      <div className="px-3 space-y-2">
        <div className="flex items-center bg-[#3c3c3c] border border-[#3c3c3c] rounded-sm px-2 h-[26px]">
          <Search size={12} className="text-[#858585] mr-1.5" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-[13px] text-[#cccccc] placeholder:text-[#858585] focus:outline-none"
          />
        </div>
        <div className="flex items-center bg-[#3c3c3c] border border-[#3c3c3c] rounded-sm px-2 h-[26px]">
          <ChevronRight size={12} className="text-[#858585] mr-1.5" />
          <input
            type="text"
            placeholder="Replace"
            className="flex-1 bg-transparent text-[13px] text-[#cccccc] placeholder:text-[#858585] focus:outline-none"
          />
        </div>
      </div>

      {/* Results (static) */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="px-3 py-1 text-[11px] text-[#858585]">
          0 results in 0 files
        </div>
      </div>
    </div>
  );
}
