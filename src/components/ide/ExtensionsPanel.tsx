"use client";

import React, { useState } from "react";
import { Puzzle, Search, Download, CheckCircle2 } from "lucide-react";

const INSTALLED = [
  { id: "nextjs", name: "Next.js Extension Pack", version: "16.2.6", enabled: true },
  { id: "tailwind", name: "Tailwind CSS IntelliSense", version: "4.0.0", enabled: true },
  { id: "typescript", name: "TypeScript Language Features", version: "5.8.0", enabled: true },
];

const RECOMMENDED = [
  { id: "prettier", name: "Prettier", description: "Code formatter" },
  { id: "eslint", name: "ESLint", description: "JavaScript/TypeScript linter" },
  { id: "github", name: "GitHub Pull Requests", description: "Review PRs inside the IDE" },
];

export function ExtensionsPanel() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col h-full bg-ide-bg">
      <div className="px-3 h-9 flex items-center border-b border-ide-border bg-ide-surface text-ide-xs font-medium uppercase tracking-wide text-ide-foreground">
        Extensions
      </div>
      <div className="p-3 space-y-3 overflow-y-auto ide-scroll">
        <div className="flex items-center gap-2">
          <Search size={12} className="text-ide-foreground-dim" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search extensions..."
            className="flex-1 px-2 py-1 bg-ide-bg border border-ide-border rounded text-ide-xs text-ide-foreground placeholder:text-ide-foreground-dim focus:outline-none focus:border-ide-primary"
          />
        </div>

        <div>
          <div className="text-ide-xs font-medium uppercase tracking-wide text-ide-foreground-dim mb-1">Installed</div>
          {INSTALLED.filter((ext) => ext.name.toLowerCase().includes(query.toLowerCase())).map((ext) => (
            <div
              key={ext.id}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-ide-surface transition-colors"
            >
              <div className="flex items-center gap-2">
                <Puzzle size={14} className="text-ide-accent" />
                <div>
                  <div className="text-ide-sm text-ide-foreground">{ext.name}</div>
                  <div className="text-ide-xs text-ide-foreground-dim">{ext.version}</div>
                </div>
              </div>
              <CheckCircle2 size={14} className="text-ide-success" />
            </div>
          ))}
        </div>

        <div>
          <div className="text-ide-xs font-medium uppercase tracking-wide text-ide-foreground-dim mb-1">Recommended</div>
          {RECOMMENDED.filter((ext) => ext.name.toLowerCase().includes(query.toLowerCase())).map((ext) => (
            <div
              key={ext.id}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-ide-surface transition-colors"
            >
              <div>
                <div className="text-ide-sm text-ide-foreground">{ext.name}</div>
                <div className="text-ide-xs text-ide-foreground-dim">{ext.description}</div>
              </div>
              <button
                onClick={() => alert("Extension installation is not available in this preview")}
                className="p-1 rounded bg-ide-primary text-ide-primary-foreground hover:bg-ide-primary-dim transition-colors"
                title="Install"
              >
                <Download size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
