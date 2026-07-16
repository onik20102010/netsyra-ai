"use client";

import React from "react";
import { X, Circle, FileCode, FileJson, FileText, File as FileIcon } from "lucide-react";
import { useIdeStore, getFileIcon } from "@/ide";

function TabFileIcon({ name }: { name: string }) {
  const iconName = getFileIcon(name, "file");
  switch (iconName) {
    case "file-code": return <FileCode size={14} className="shrink-0 text-[#519aba]" />;
    case "file-json": return <FileJson size={14} className="shrink-0 text-[#cbcb41]" />;
    case "file-text": return <FileText size={14} className="shrink-0 text-[#6d8086]" />;
    default: return <FileIcon size={14} className="shrink-0 text-[#6d8086]" />;
  }
}

export function TabBar() {
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const setActiveFile = useIdeStore((s) => s.setActiveFile);
  const closeFile = useIdeStore((s) => s.closeFile);

  const handleClose = (e: React.MouseEvent, id: string, unsaved: boolean) => {
    e.stopPropagation();
    if (unsaved) {
      const file = openFiles.find((f) => f.id === id);
      if (file && !confirm(`Do you want to save the changes you made to ${file.name}?\n\nYour changes will be lost if you don't save them.`)) {
        return;
      }
    }
    closeFile(id);
  };

  if (openFiles.length === 0) {
    return (
      <div className="flex items-center h-[31px] bg-[#252526] shrink-0">
        <div className="px-3 text-[13px] text-[#858585]">No files open</div>
      </div>
    );
  }

  return (
    <div className="flex items-center h-[31px] bg-[#252526] overflow-x-auto shrink-0">
      {openFiles.map((tab) => {
        const active = tab.id === activeFileId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveFile(tab.id)}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                handleClose(e, tab.id, tab.unsaved);
              }
            }}
            className={`group flex items-center gap-1.5 px-2 h-full min-w-[100px] max-w-[200px] border-r border-[#252526] text-[13px] cursor-pointer select-none ${
              active
                ? "bg-[#1e1e1e] text-white"
                : "bg-[#2d2d2d] text-[#969696] hover:bg-[#2b2b2b]"
            }`}
            style={{
              borderTop: active ? "1px solid #007acc" : "1px solid transparent",
            }}
          >
            <TabFileIcon name={tab.name} />
            <span className={`flex-1 truncate text-left ${tab.unsaved ? "italic" : ""}`}>{tab.name}</span>
            {tab.unsaved ? (
              <Circle
                size={8}
                fill="currentColor"
                className="text-[#e8e8e8] shrink-0 group-hover:hidden"
              />
            ) : null}
            <X
              size={16}
              onClick={(e) => handleClose(e, tab.id, tab.unsaved)}
              className={`shrink-0 hover:bg-white/15 rounded p-0.5 transition-all text-[#cccccc] ${
                tab.unsaved
                  ? "opacity-0 group-hover:opacity-100"
                  : active
                    ? "opacity-60 group-hover:opacity-100"
                    : "opacity-0 group-hover:opacity-100"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
