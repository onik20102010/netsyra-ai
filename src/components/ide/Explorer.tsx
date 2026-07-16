"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderTree,
  Folder,
  FileCode,
  FileText,
  FileJson,
  File as FileIcon,
  RefreshCw,
  FolderOpen,
  X,
} from "lucide-react";
import { useIdeStore, getFileIcon } from "@/ide";
import type { FileItem } from "@/ide";

// ── Icon helper ─────────────────────────────────────────────────

function Icon({ item, size = 14 }: { item: FileItem; size?: number }) {
  const iconName = getFileIcon(item.name, item.type);
  switch (iconName) {
    case "folder": return <Folder size={size} className="text-[#c09553]" />;
    case "folder-open": return <FolderOpen size={size} className="text-[#c09553]" />;
    case "file-code": return <FileCode size={size} className="text-[#519aba]" />;
    case "file-json": return <FileJson size={size} className="text-[#cbcb41]" />;
    case "file-text": return <FileText size={size} className="text-[#6d8086]" />;
    default: return <FileIcon size={size} className="text-[#6d8086]" />;
  }
}

// ── Tree Node ───────────────────────────────────────────────────

function TreeNode({ item, level, activePath, onOpen }: { item: FileItem; level: number; activePath: string | null; onOpen: (item: FileItem) => void }) {
  const [expanded, setExpanded] = useState(level < 1);

  if (item.type === "folder") {
    return (
      <div>
        <div
          className="flex items-center gap-1 h-[22px] cursor-pointer hover:bg-[#2a2d2e] text-[#cccccc] text-[13px]"
          style={{ paddingLeft: `${level * 8 + 8}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="w-4 flex items-center justify-center shrink-0">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          <Icon item={{ ...item, type: "folder" }} />
          <span className="truncate">{item.name}</span>
        </div>
        {expanded && item.children?.map((child) => (
          <TreeNode key={child.id} item={child} level={level + 1} activePath={activePath} onOpen={onOpen} />
        ))}
      </div>
    );
  }

  const isActive = activePath === item.path;

  return (
    <div
      className={`flex items-center gap-1 h-[22px] cursor-pointer text-[13px] ${
        isActive ? "bg-[#37373d] text-white" : "hover:bg-[#2a2d2e] text-[#cccccc]"
      }`}
      style={{ paddingLeft: `${level * 8 + 8 + 16}px` }}
      onClick={() => onOpen(item)}
    >
      <Icon item={item} />
      <span className="truncate">{item.name}</span>
    </div>
  );
}

// ── Explorer ────────────────────────────────────────────────────

export function Explorer() {
  const tree = useIdeStore((s) => s.tree);
  const openFile = useIdeStore((s) => s.openFile);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const openFiles = useIdeStore((s) => s.openFiles);
  const workspaceName = useIdeStore((s) => s.workspaceName);
  const loading = useIdeStore((s) => s.loading);
  const openFolder = useIdeStore((s) => s.openFolder);
  const refreshTree = useIdeStore((s) => s.refreshTree);
  const closeWorkspace = useIdeStore((s) => s.closeWorkspace);
  const activePath = openFiles.find((f) => f.id === activeFileId)?.path ?? null;

  const hasWorkspace = tree.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[35px] shrink-0">
        <span className="text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide">Explorer</span>
        {hasWorkspace && (
          <div className="flex items-center gap-1 text-[#858585]">
            <button onClick={() => openFolder()} className="p-1 hover:text-[#cccccc] hover:bg-[#2a2d2e] rounded" title="Open Folder">
              <FolderOpen size={14} />
            </button>
            <button onClick={() => refreshTree()} className="p-1 hover:text-[#cccccc] hover:bg-[#2a2d2e] rounded" title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => closeWorkspace()} className="p-1 hover:text-[#cccccc] hover:bg-[#2a2d2e] rounded" title="Close Workspace">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {!hasWorkspace ? (
        /* Empty state — Open Folder button */
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-3">
          {loading ? (
            <div className="text-[13px] text-[#858585]">Loading...</div>
          ) : (
            <>
              <FolderTree size={32} className="text-[#858585]" />
              <div className="text-[13px] text-[#858585] text-center">
                You have not yet opened a folder.
              </div>
              <button
                onClick={() => openFolder()}
                className="px-3 py-1.5 text-[13px] text-[#cccccc] bg-[#0e639c] hover:bg-[#1177bb] rounded transition-colors"
              >
                Open Folder
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Workspace name */}
          <div className="px-3 py-1 text-[11px] font-bold text-[#cccccc] uppercase tracking-wide flex items-center justify-between group">
            <span className="truncate">{workspaceName}</span>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto">
            {tree.map((item) => (
              <TreeNode key={item.id} item={item} level={0} activePath={activePath} onOpen={openFile} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
