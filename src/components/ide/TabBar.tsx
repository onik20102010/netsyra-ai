// d:\netsyra\src\components\ide\TabBar.tsx
"use client";

import React, { useRef, useEffect } from "react";
import { useIdeStore, getFileIconDetails } from "@/ide";
import { X, File, FileCode, FileJson, FileText, Image, Check } from "lucide-react";

export function TabBar() {
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const setActiveTab = useIdeStore((s) => s.setActiveTab);
  const closeFile = useIdeStore((s) => s.closeFile);
  const saveFile = useIdeStore((s) => s.saveFile);
  
  // Auto-scroll to active tab
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollContainerRef.current && activeFileId) {
      const activeElement = scrollContainerRef.current.querySelector(`[data-fileid="${activeFileId}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeFileId, openFiles.length]);

  if (openFiles.length === 0) return null;

  // Helper to get icon for a tab
  const getTabIcon = (path: string) => {
    const { iconName, color } = getFileIconDetails(path, false);
    const IconComponent = 
      iconName === "FileCode" ? FileCode :
      iconName === "FileJson" ? FileJson :
      iconName === "FileText" ? FileText :
      iconName === "Image" ? Image :
      File;
    return <IconComponent size={14} color={color} />;
  };

  return (
    <div className="flex h-[35px] bg-zinc-900 border-b border-[#2d2d2d] overflow-x-auto shrink-0 items-stretch select-none no-scrollbar">
      {/* Scrollable Tab Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto scrollbar-hide items-stretch h-full"
      >
        {openFiles.map((file) => {
          const isActive = file.id === activeFileId;
          const filename = file.path.split('/').pop() || file.path;

          return (
            <div
              key={file.id}
              data-fileid={file.id}
              className={`group flex items-center h-full px-3 gap-1.5 border-r border-[#2d2d2d] cursor-pointer min-w-[80px] max-w-[200px] transition-colors relative ${
                isActive 
                  ? "bg-[#1e1e1e] text-white" 
                  : "bg-[#2d2d2d] text-[#969696] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
              }`}
              onClick={() => setActiveTab(file.id)}
            >
              {/* Tab Icon */}
              <span className="shrink-0 flex items-center justify-center">
                {getTabIcon(file.path)}
              </span>
              
              {/* Filename */}
              <span className="text-[13px] truncate flex-1 text-center min-w-[40px]">
                {filename}
              </span>

              {/* Dirty Indicator / Close Button */}
              <div className="flex items-center justify-center shrink-0 w-[16px] h-[16px] rounded hover:bg-[#4a4a4a] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (file.isDirty) {
                    saveFile(file.id);
                  } else {
                    closeFile(file.id);
                  }
                }}
              >
                {file.isDirty ? (
                  // Dirty state: Show a small dot instead of the close button (VS Code behavior)
                  <span className="w-[8px] h-[8px] rounded-full bg-[#cccccc] group-hover:hidden" />
                ) : (
                  // Clean state: Show the close button
                  <span className="hidden group-hover:flex text-[#cccccc] hover:text-white">
                    <X size={12} />
                  </span>
                )}
                
                {/* Fallback: Always show X if hovering over the tab, regardless of dirty state */}
                <span className={`hidden ${isActive ? 'flex' : 'group-hover:hidden'} group-hover:flex text-[#cccccc] hover:text-white`}>
                  <X size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right side contextual actions (just like VS Code) */}
      {openFiles.some(f => f.isDirty) && (
        <button
          onClick={() => {
            openFiles.forEach(f => { if (f.isDirty) saveFile(f.id); });
          }}
          className="px-3 h-full bg-zinc-900 text-[#969696] hover:text-white hover:bg-[#2a2d2e] transition-colors border-l border-[#2d2d2d] flex items-center gap-1.5 text-[12px] whitespace-nowrap"
          title="Save All"
        >
          <Check size={14} />
          <span className="hidden sm:inline">Save All</span>
        </button>
      )}
    </div>
  );
}