"use client";

import React from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface DiffViewerProps {
  original: string;
  modified: string;
  path: string;
  selected?: boolean;
  onToggle?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onRestore?: () => void;
  canRestore?: boolean;
}

export function DiffViewer({
  original,
  modified,
  path,
  selected,
  onToggle,
  onAccept,
  onReject,
  onRestore,
  canRestore,
}: DiffViewerProps) {
  const oldLines = original.split("\n");
  const newLines = modified.split("\n");
  const maxLines = Math.max(oldLines.length, newLines.length);

  return (
    <div className="mt-2 rounded border border-ide-border overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 bg-ide-surface text-ide-xs text-ide-foreground-dim">
        <span className="flex items-center gap-1">
          {onToggle && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="mr-1 accent-ide-primary"
            />
          )}
          <span className="text-ide-error">-</span> Original
          <span className="text-ide-success">+</span> Modified
        </span>
        <span className="truncate flex-1 mx-2">{path}</span>
        <span className="flex items-center gap-1">
          {onAccept && (
            <button onClick={onAccept} className="hover:text-ide-success" title="Accept file">
              <CheckCircle2 size={12} />
            </button>
          )}
          {onReject && (
            <button onClick={onReject} className="hover:text-ide-error" title="Reject file">
              <XCircle size={12} />
            </button>
          )}
          {canRestore && onRestore && (
            <button onClick={onRestore} className="hover:text-ide-warning" title="Restore original">
              <RotateCcw size={12} />
            </button>
          )}
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-ide-border">
        <pre className="p-2 max-h-48 overflow-y-auto ide-scroll bg-ide-bg font-mono text-ide-xs text-ide-foreground whitespace-pre">
          {oldLines.map((line, i) => {
            const changed = line !== newLines[i];
            return (
              <div key={i} className={`${changed ? "bg-ide-error/10 text-ide-error" : ""}`}>
                {line || " "}
              </div>
            );
          })}
        </pre>
        <pre className="p-2 max-h-48 overflow-y-auto ide-scroll bg-ide-bg font-mono text-ide-xs text-ide-foreground whitespace-pre">
          {newLines.map((line, i) => {
            const changed = line !== oldLines[i];
            return (
              <div key={i} className={`${changed ? "bg-ide-success/10 text-ide-success" : ""}`}>
                {line || " "}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
