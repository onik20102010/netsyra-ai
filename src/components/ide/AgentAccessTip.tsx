"use client";

import React, { useState } from "react";
import { X, Shield, Terminal, FolderOpen } from "lucide-react";

interface AgentAccessTipProps {
  open: boolean;
  onClose: () => void;
  token: string | null;
  setToken: (token: string | null) => void;
  agentConnected: boolean;
  onOpenFolder?: () => void;
}

export function AgentAccessTip({ open, onClose, token, setToken, agentConnected, onOpenFolder }: AgentAccessTipProps) {
  const [draft, setDraft] = useState(token ?? "");

  if (!open) return null;

  const saveToken = () => {
    const value = draft.trim();
    setToken(value || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-ide-bg border border-ide-border rounded-lg shadow-ide-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-ide-surface border-b border-ide-border">
          <div className="flex items-center gap-2 text-ide-foreground font-medium">
            <Shield size={16} className="text-ide-primary" />
            Get full access to the Netsyra IDE
          </div>
          <button
            onClick={onClose}
            className="text-ide-foreground-dim hover:text-ide-foreground transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-ide-sm text-ide-foreground">
          <p className="text-ide-foreground-dim">
            The Netsyra IDE runs in your browser. To access your terminal, local files, search, git, and runtime, you must run the <strong>netsyra-agent</strong> on your machine.
          </p>

          <div className="space-y-2">
            <h4 className="text-ide-foreground font-medium flex items-center gap-2">
              <Terminal size={14} /> 1. Start the local agent
            </h4>
            <p className="text-ide-foreground-dim">
              Open PowerShell in your project folder and run:
            </p>
            <code className="block bg-ide-surface border border-ide-border rounded px-3 py-2 text-ide-xs font-mono">
              npm run agent
            </code>
            <p className="text-ide-foreground-dim">
              The agent will print an <strong>Agent token</strong> and a connection URL.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-ide-foreground font-medium">2. Secure your connection</h4>
            <ul className="list-disc list-inside text-ide-foreground-dim text-ide-xs space-y-1">
              <li>For local dev with <code className="text-ide-foreground">npm run dev</code> the agent uses <code className="text-ide-foreground">ws://localhost:3001</code>.</li>
              <li>For <code className="text-ide-foreground">https://www.netsyraai.com</code> you must start the agent with a TLS certificate:</li>
            </ul>
            <code className="block bg-ide-surface border border-ide-border rounded px-3 py-2 text-ide-xs font-mono">
              $env:AGENT_TLS_CERT=&quot;C:\certs\cert.pem&quot;; $env:AGENT_TLS_KEY=&quot;C:\certs\key.pem&quot;; npm run agent
            </code>
          </div>

          <div className="space-y-2">
            <h4 className="text-ide-foreground font-medium">3. Enter the agent token</h4>
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveToken(); }}
                placeholder="Paste agent token here"
                className="flex-1 bg-ide-surface border border-ide-border rounded px-3 py-2 text-ide-foreground text-ide-sm focus:outline-none focus:border-ide-primary"
              />
              <button
                onClick={saveToken}
                className="px-4 py-2 bg-ide-primary text-ide-primary-foreground rounded text-ide-sm hover:bg-ide-primary/90 transition-colors"
              >
                Save
              </button>
            </div>
            <div className="flex items-center gap-2 text-ide-xs">
              <span className={`w-2 h-2 rounded-full ${agentConnected ? "bg-ide-success" : "bg-ide-error"}`} />
              <span className={agentConnected ? "text-ide-success" : "text-ide-error"}>
                {agentConnected ? "Connected to local agent" : "Not connected to local agent"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-ide-foreground font-medium flex items-center gap-2">
              <FolderOpen size={14} /> 4. Open a workspace and use the Terminal
            </h4>
            <p className="text-ide-foreground-dim text-ide-xs">
              Click <strong>Open Folder</strong> in the IDE, choose your project, then open the bottom Terminal panel and type PowerShell commands like:
            </p>
            <code className="block bg-ide-surface border border-ide-border rounded px-3 py-2 text-ide-xs font-mono">
              powershell -Command &quot;Get-Process&quot;
            </code>
            {onOpenFolder && (
              <button
                onClick={onOpenFolder}
                className="mt-2 px-3 py-1.5 border border-ide-border rounded text-ide-xs text-ide-foreground hover:bg-ide-surface transition-colors"
              >
                Open workspace folder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
