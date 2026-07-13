"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, RefreshCw, Search, FolderTree, ChevronRight, ChevronDown } from "lucide-react";
import { type FileItem, getFileIcon } from "./file-utils";

interface WorkspaceExplorerProps {
  items: FileItem[] | null;
  onFileOpen: (item: FileItem) => void;
  onOpenFolder: () => void;
  onRefresh: () => void;
}

function FileTreeNode({
  item,
  level,
  expandedIds,
  selectedId,
  onToggle,
  onOpen,
  onSelect,
}: {
  item: FileItem;
  level: number;
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onOpen: (item: FileItem) => void;
  onSelect: (id: string) => void;
}) {
  const isExpanded = expandedIds.has(item.id);
  const isSelected = selectedId === item.id;
  const hasChildren = item.type === "folder" && (item.children?.length ?? 0) > 0;

  const handleClick = () => {
    onSelect(item.id);
    if (item.type === "file") {
      onOpen(item);
    } else {
      onToggle(item.id);
    }
  };

  const handleDoubleClick = () => {
    if (item.type === "file") onOpen(item);
    else onToggle(item.id);
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`group flex items-center gap-1.5 px-3 py-1 select-none cursor-pointer transition-colors duration-ide-fast ${
          isSelected ? "bg-ide-surface-active text-ide-foreground" : "text-ide-foreground hover:bg-ide-surface-hover"
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {item.type === "folder" ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
            className="text-ide-foreground-dim hover:text-ide-foreground p-0.5 rounded"
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span className="w-3" />}
          </button>
        ) : (
          <span className="w-3" />
        )}
        {getFileIcon(item.name, item.type)}
        <span className="flex-1 truncate text-ide-sm">{item.name}</span>
      </div>

      <AnimatePresence initial={false}>
        {item.type === "folder" && isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {item.children!.map((child) => (
              <FileTreeNode
                key={child.id}
                item={child}
                level={level + 1}
                expandedIds={expandedIds}
                selectedId={selectedId}
                onToggle={onToggle}
                onOpen={onOpen}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function filterTree(items: FileItem[], query: string): FileItem[] {
  const q = query.toLowerCase();
  return items
    .map((item) => {
      if (item.type === "folder") {
        const children = item.children ? filterTree(item.children, query) : [];
        if (item.name.toLowerCase().includes(q) || children.length > 0) {
          return { ...item, children };
        }
      } else if (item.name.toLowerCase().includes(q)) {
        return item;
      }
      return null;
    })
    .filter((item): item is FileItem => item !== null);
}

export function WorkspaceExplorer({ items, onFileOpen, onOpenFolder, onRefresh }: WorkspaceExplorerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const files = useMemo(() => (items ? items : null), [items]);
  const filteredFiles = useMemo(() => {
    if (!files) return null;
    if (!filter.trim()) return files;
    return filterTree(files, filter);
  }, [files, filter]);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setExpandedIds(new Set());
    setSelectedId(null);
  }, [items]);

  return (
    <div className="flex flex-col h-full bg-ide-bg">
      <div className="flex items-center justify-between px-3 h-9 border-b border-ide-border bg-ide-surface">
        <span className="text-ide-xs font-medium text-ide-foreground uppercase tracking-wide">Explorer</span>
        <div className="flex items-center gap-1 text-ide-foreground-dim">
          {files ? (
            <button
              onClick={onRefresh}
              className="p-1 hover:text-ide-foreground hover:bg-ide-surface-hover rounded"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          ) : (
            <button
              onClick={onOpenFolder}
              className="p-1 hover:text-ide-foreground hover:bg-ide-surface-hover rounded"
              title="Open Folder"
            >
              <FolderOpen size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="px-3 py-2 border-b border-ide-border bg-ide-surface">
        <div className="flex items-center gap-2 px-2 py-1 bg-ide-bg border border-ide-border rounded text-ide-sm">
          <Search size={12} className="text-ide-foreground-dim" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files"
            className="flex-1 bg-transparent text-ide-foreground placeholder:text-ide-foreground-dim focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto ide-scroll py-1">
        {!files && (
          <div className="flex flex-col items-center justify-center h-full text-ide-foreground-dim gap-3 p-6">
            <FolderTree size={40} className="opacity-20" />
            <div className="text-center">
              <p className="text-ide-sm font-medium text-ide-foreground">No folder open</p>
              <p className="text-ide-xs mt-1">Open a local project to start editing</p>
            </div>
            <button
              onClick={onOpenFolder}
              className="px-3 py-1.5 bg-ide-primary text-ide-primary-foreground rounded text-ide-sm hover:bg-ide-primary/90 transition-colors"
            >
              Open Folder
            </button>
          </div>
        )}
        {filteredFiles && filteredFiles.length === 0 && (
          <div className="px-3 py-2 text-ide-sm text-ide-foreground-dim">No files match your filter</div>
        )}
        {filteredFiles && filteredFiles.map((item) => (
          <FileTreeNode
            key={item.id}
            item={item}
            level={0}
            expandedIds={expandedIds}
            selectedId={selectedId}
            onToggle={toggle}
            onOpen={onFileOpen}
            onSelect={setSelectedId}
          />
        ))}
      </div>
    </div>
  );
}
