// d:\netsyra\src\components\ide\TabBar.tsx
"use client";

import React, { useRef, useEffect } from "react";
import { useIdeStore, getFileIconDetails } from "@/ide";
import { X, File, FileCode, FileJson, FileText, Image, Check, SplitSquareHorizontal } from "lucide-react";

export function TabBar() {
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const setActiveTab = useIdeStore((s) => s.setActiveTab);
  const closeFile = useIdeStore((s) => s.closeFile);
  const saveFile = useIdeStore((s) => s.saveFile);
  const problems = useIdeStore((s) => s.problems);
  const splitEditorFileId = useIdeStore((s) => s.splitEditorFileId);
  const splitEditor = useIdeStore((s) => s.splitEditor);
  const closeSplitEditor = useIdeStore((s) => s.closeSplitEditor);
  
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
    <div className="flex h-[35px] bg-[#161b22] border-b border-[#1f2428] overflow-x-auto shrink-0 items-stretch select-none no-scrollbar">
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
              className={`group flex items-center h-full px-3 gap-1.5 border-r border-[#1f2428] cursor-pointer min-w-[80px] max-w-[200px] transition-colors relative ${
                isActive 
                  ? "bg-[#0d1117] text-[#e6edf3]" 
                  : "bg-[#161b22] text-[#6e7681] hover:bg-[#1f2428] hover:text-[#8b949e]"
              }`}
              onClick={() => setActiveTab(file.id)}
            >
              {isActive && <span className="absolute top-0 left-0 right-0 h-[2px] bg-[#34e8bb]" />}
              {/* Tab Icon */}
              <span className="shrink-0 flex items-center justify-center">
                {getTabIcon(file.path)}
              </span>
              
              {/* Filename */}
              <span className="text-[13px] truncate flex-1 text-center min-w-[40px]">
                {filename}
              </span>

              {/* Problem indicator dot */}
              {(() => {
                const fileProblems = problems[file.id] || [];
                const hasError = fileProblems.some(p => p.severity === 'error');
                const hasWarning = fileProblems.some(p => p.severity === 'warning');
                if (hasError || hasWarning) {
                  return (
                    <span
                      className={`shrink-0 w-[7px] h-[7px] rounded-full ${hasError ? 'bg-[#f85149]' : 'bg-[#d29922]'}`}
                      title={hasError ? `${fileProblems.filter(p => p.severity === 'error').length} error(s)` : `${fileProblems.filter(p => p.severity === 'warning').length} warning(s)`}
                    />
                  );
                }
                return null;
              })()}

              {/* Dirty Indicator / Close Button */}
              <div className="flex items-center justify-center shrink-0 w-[16px] h-[16px] rounded hover:bg-[#30363d] transition-colors"
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
                  <span className="w-[8px] h-[8px] rounded-full bg-[#34e8bb] group-hover:hidden" />
                ) : (
                  <span className="hidden group-hover:flex text-[#8b949e] hover:text-[#e6edf3]">
                    <X size={12} />
                  </span>
                )}
                
                {/* Fallback: Always show X if hovering over the tab, regardless of dirty state */}
                <span className={`hidden ${isActive ? 'flex' : 'group-hover:hidden'} group-hover:flex text-[#8b949e] hover:text-[#e6edf3]`}>
                  <X size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right side contextual actions */}
      <div className="flex items-center shrink-0">
        {/* Split editor toggle */}
        {activeFileId && (
          <button
            onClick={() => {
              if (splitEditorFileId) {
                closeSplitEditor();
              } else if (activeFileId) {
                // Split with the most recently opened other file, or just open the active one in split
                const otherFile = openFiles.find(f => f.id !== activeFileId);
                if (otherFile) {
                  splitEditor(otherFile.id);
                }
              }
            }}
            className={`px-2.5 h-full transition-colors border-l border-[#1f2428] flex items-center ${
              splitEditorFileId
                ? 'text-[#34e8bb] bg-[#1f2428]'
                : 'text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#1f2428]'
            }`}
            title={splitEditorFileId ? 'Close split editor' : 'Split editor'}
          >
            <SplitSquareHorizontal size={14} />
          </button>
        )}
        {openFiles.some(f => f.isDirty) && (
          <button
            onClick={() => {
              openFiles.forEach(f => { if (f.isDirty) saveFile(f.id); });
            }}
            className="px-3 h-full bg-[#161b22] text-[#6e7681] hover:text-[#34e8bb] hover:bg-[#1f2428] transition-colors border-l border-[#1f2428] flex items-center gap-1.5 text-[12px] whitespace-nowrap"
            title="Save All"
          >
            <Check size={14} />
            <span className="hidden sm:inline">Save All</span>
          </button>
        )}
      </div>
    </div>
  );
}