"use client";

import React, { useState, useMemo } from "react";
import { FileCode } from "lucide-react";
import { type FileItem, type OpenFile } from "./file-utils";
import { type RuntimeStatus } from "@/ide/types";
import { type RuntimeEventMessage } from "@/hooks/useRuntime";
import { type View } from "./ActivityBar";
import { WorkspaceExplorer } from "./WorkspaceExplorer";
import { ChatPanel } from "./ChatPanel";
import { RuntimePanel } from "./RuntimePanel";
import { SourceControlPanel } from "./SourceControlPanel";
import { ExtensionsPanel } from "./ExtensionsPanel";

function flattenItems(items: FileItem[]): FileItem[] {
  const list: FileItem[] = [];
  const walk = (nodes: FileItem[]) => {
    for (const item of nodes) {
      list.push(item);
      if (item.children) walk(item.children);
    }
  };
  walk(items);
  return list;
}

function SearchPanel({ workspace, onFileOpen }: { workspace: FileItem | null; onFileOpen: (item: FileItem) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const all = flattenItems(workspace?.children ?? []);
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return all.filter((item) => item.type === "file" && item.name.toLowerCase().includes(lower));
  }, [workspace, query]);

  return (
    <div className="flex flex-col h-full bg-ide-bg">
      <div className="px-3 h-9 flex items-center border-b border-ide-border bg-ide-surface text-ide-xs font-medium uppercase tracking-wide text-ide-foreground">
        Search
      </div>
      <div className="p-3 space-y-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across files..."
          className="w-full px-3 py-2 bg-ide-bg border border-ide-border rounded text-ide-sm text-ide-foreground placeholder:text-ide-foreground-dim focus:outline-none focus:border-ide-primary"
        />
        {query.trim() ? (
          <div className="text-ide-xs text-ide-foreground-dim">
            {results.length} result{results.length === 1 ? "" : "s"}
          </div>
        ) : (
          <div className="text-ide-sm text-ide-foreground-dim">Type to search files, symbols, and commands.</div>
        )}
        <div className="space-y-1 max-h-96 overflow-y-auto ide-scroll">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => onFileOpen(item)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-ide-surface transition-colors text-ide-sm text-ide-foreground"
            >
              <div className="flex items-center gap-2">
                <FileCode size={14} className="text-ide-accent" />
                <span className="truncate">{item.name}</span>
              </div>
              <div className="text-ide-xs text-ide-foreground-dim truncate pl-6">{item.path}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  active: View;
  workspace: FileItem | null;
  openFiles: OpenFile[];
  activeFile: string | null;
  onFileOpen: (item: FileItem) => void;
  onOpenFolder: () => void;
  onRefresh: () => void;
  onToast: (message: string) => void;
  onApplyChanges: (changes: { path: string; newContent?: string; operation: string }[]) => Promise<void>;
  events: RuntimeEventMessage[];
  runtimeStatus: RuntimeStatus | null;
}

export function SidebarContent({ active, workspace, openFiles, activeFile, onFileOpen, onOpenFolder, onRefresh, onToast, onApplyChanges, events, runtimeStatus }: SidebarContentProps) {
  switch (active) {
    case "explorer":
      return (
        <WorkspaceExplorer
          items={workspace?.children ?? null}
          onFileOpen={onFileOpen}
          onOpenFolder={onOpenFolder}
          onRefresh={onRefresh}
        />
      );
    case "search":
      return <SearchPanel workspace={workspace} onFileOpen={onFileOpen} />;
    case "source-control":
      return <SourceControlPanel />;
    case "extensions":
      return <ExtensionsPanel />;
    case "chat":
      return (
        <ChatPanel
          onToast={onToast}
          events={events}
          status={runtimeStatus}
          workspace={workspace}
          openFiles={openFiles}
          activeFile={activeFile}
          onApplyChanges={onApplyChanges}
        />
      );
    case "runtime":
      return <RuntimePanel events={events} status={runtimeStatus} />;
    default:
      return (
        <WorkspaceExplorer
          items={workspace?.children ?? null}
          onFileOpen={onFileOpen}
          onOpenFolder={onOpenFolder}
          onRefresh={onRefresh}
        />
      );
  }
}
