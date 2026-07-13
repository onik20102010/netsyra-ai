"use client";

import React, { useEffect, useState } from "react";
import { GitBranch, RefreshCw, FileEdit, FilePlus, FileX, AlertCircle } from "lucide-react";

interface GitInfo {
  root?: string;
  branch?: string;
  modified?: string[];
  staged?: string[];
  untracked?: string[];
  conflicts?: string[];
  error?: string;
}

export function SourceControlPanel() {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/ide/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-git" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { git: GitInfo };
      setGitInfo(data.git);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="flex flex-col h-full bg-ide-bg">
      <div className="px-3 h-9 flex items-center justify-between border-b border-ide-border bg-ide-surface text-ide-xs font-medium uppercase tracking-wide text-ide-foreground">
        <span>Source Control</span>
        <button
          onClick={load}
          disabled={loading}
          className="p-1 rounded hover:bg-ide-bg text-ide-foreground-dim hover:text-ide-foreground transition-colors"
          title="Refresh git status"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="p-3 space-y-3 overflow-y-auto ide-scroll">
        {error && (
          <div className="flex items-center gap-2 text-ide-xs text-ide-error">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}
        {!gitInfo && !error && <div className="text-ide-sm text-ide-foreground-dim">Loading git status...</div>}
        {gitInfo && (
          <>
            <div className="flex items-center gap-2 text-ide-sm text-ide-foreground">
              <GitBranch size={14} className="text-ide-accent" />
              <span className="font-medium">{gitInfo.branch || "No branch"}</span>
            </div>
            {gitInfo.root && <div className="text-ide-xs text-ide-foreground-dim truncate">{gitInfo.root}</div>}
            <Section icon={FileEdit} title="Modified" items={gitInfo.modified} color="text-ide-warning" />
            <Section icon={FilePlus} title="Staged" items={gitInfo.staged} color="text-ide-success" />
            <Section icon={FilePlus} title="Untracked" items={gitInfo.untracked} color="text-ide-info" />
            <Section icon={FileX} title="Conflicts" items={gitInfo.conflicts} color="text-ide-error" />
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  items,
  color,
}: {
  icon: React.ElementType;
  title: string;
  items?: string[];
  color: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className={`flex items-center gap-1 text-ide-xs font-medium uppercase tracking-wide ${color}`}>
        <Icon size={12} />
        {title} ({items.length})
      </div>
      <div className="mt-1 space-y-0.5">
        {items.map((path) => (
          <div
            key={path}
            className="text-ide-xs text-ide-foreground-dim truncate hover:text-ide-foreground hover:bg-ide-surface rounded px-1 py-0.5"
          >
            {path}
          </div>
        ))}
      </div>
    </div>
  );
}
