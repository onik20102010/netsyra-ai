"use client";

import React, { useState, useEffect, useCallback } from "react";
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

  useEffect(() => {
    if (!open) return;
    setDraft(token ?? "");
  }, [token, open]);

  if (!open) return null;

  const saveToken = () => {
    const value = draft.trim();
    setToken(value || null);
  };

  const copy = useCallback(async (text = "") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl max-h-[80vh] bg-ide-bg border border-ide-border rounded-ide-lg shadow-ide-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-ide-surface border-b border-ide-border shrink-0">
          <div className="flex items-center gap-2 text-ide-foreground font-medium">
            <Shield size={16} className="text-ide-primary" />
            Get full access to Netsyra IDE
          </div>
          <button onClick={onClose} className="text-ide-foreground-dim hover:text-ide-foreground transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-ide-sm text-ide-foreground">
          <p className="text-ide-foreground-dim mb-4">
            Netsyra IDE runs in your browser. The <strong>local agent</strong> runs on your computer and unlocks files, terminal, AI, search, and git. Think of it like Cursor, VS Code, or Windsurf — the IDE displays files, the agent edits them locally.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <StepCard number={1} title="Start the local agent" icon={<Terminal size={14} />}>
                <p className="text-ide-foreground-dim text-ide-xs mb-2">Open PowerShell in your project folder and run:</p>
                <CodeBlock text="cd d:\netsyra\nnpm run agent" onCopy={copy} />
                <p className="text-ide-foreground-dim text-ide-xs mt-2">You will see an <strong>Agent token</strong> printed. Copy it. The agent now binds to <code>127.0.0.1:3001</code> by default for Windows compatibility.</p>
              </StepCard>

              <StepCard number={2} title="Enter the agent token" icon={<Shield size={14} />}>
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveToken(); }}
                    placeholder="Paste the agent token here"
                    className="flex-1 bg-ide-surface border border-ide-border rounded px-3 py-2 text-ide-foreground text-ide-sm focus:outline-none focus:border-ide-primary"
                  />
                  <button onClick={saveToken} className="px-4 py-2 bg-ide-primary text-ide-primary-foreground rounded text-ide-sm hover:bg-ide-primary/90 transition-colors">Save</button>
                </div>
                <div className="flex items-center gap-2 text-ide-xs mt-2">
                  <span className={`w-2 h-2 rounded-full ${agentConnected ? "bg-ide-success" : "bg-ide-error"}`} />
                  <span className={agentConnected ? "text-ide-success" : "text-ide-error"}>
                    {agentConnected ? "Connected to local agent" : "Not connected — start the agent and save token"}
                  </span>
                </div>
              </StepCard>

              <StepCard number={3} title="Open a project folder" icon={<FolderOpen size={14} />}>
                <p className="text-ide-foreground-dim text-ide-xs mb-2">Click the button, then select your project folder. The agent can only read/write that folder.</p>
                {onOpenFolder && (
                  <button onClick={onOpenFolder} className="px-3 py-1.5 border border-ide-border rounded text-ide-xs text-ide-foreground hover:bg-ide-surface transition-colors">Open workspace folder</button>
                )}
              </StepCard>

              <StepCard number={4} title="Use the Terminal" icon={<Terminal size={14} />}>
                <p className="text-ide-foreground-dim text-ide-xs">Open the bottom Terminal panel. Choose <strong>CMD</strong> or <strong>PowerShell</strong>, type a command, and press Enter. The command runs on your machine, and the output streams back into the IDE.</p>
              </StepCard>
            </div>

            <div className="space-y-4">
              <div className="bg-ide-surface border border-ide-border rounded p-3">
                <h4 className="font-medium text-ide-foreground mb-2">Common commands — copy & run</h4>
                <div className="max-h-60 overflow-y-auto ide-scroll space-y-2 pr-1">
                  {COMMANDS.map((cmd) => (
                    <div key={cmd.label} className="bg-ide-bg border border-ide-border rounded p-2">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-ide-xs font-mono text-ide-foreground break-all">{cmd.command}</code>
                        <button onClick={() => copy(cmd.command)} className="shrink-0 px-2 py-1 bg-ide-primary text-ide-primary-foreground rounded text-ide-xs hover:bg-ide-primary/90">Copy</button>
                      </div>
                      <p className="text-ide-foreground-dim text-ide-xs mt-1">{cmd.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-ide-surface border border-ide-border rounded p-3">
                <h4 className="font-medium text-ide-foreground mb-2">For https://www.netsyraai.com</h4>
                <p className="text-ide-foreground-dim text-ide-xs mb-2">Remote sites require a secure <code className="text-ide-foreground">wss://</code> connection. Install <strong>mkcert</strong> first, then generate a certificate:</p>
                <CodeBlock text='winget install mkcert; mkcert -install; mkcert localhost' onCopy={copy} />
                <p className="text-ide-foreground-dim text-ide-xs mt-2">If you use Chocolatey instead of winget, run:</p>
                <CodeBlock text='choco install mkcert; mkcert -install; mkcert localhost' onCopy={copy} />
                <p className="text-ide-foreground-dim text-ide-xs mt-2">Then run the agent with the generated files:</p>
                <CodeBlock text='$env:AGENT_TLS_CERT="localhost.pem"; $env:AGENT_TLS_KEY="localhost-key.pem"; npm run agent' onCopy={copy} />
                <p className="text-ide-foreground-dim text-ide-xs mt-2 text-ide-warning">If you see <code>ENOENT: no such file or directory</code>, it means the certificate file path is wrong or the file does not exist. Fix the path or generate the cert first. Make sure the terminal is in the <code>d:\netsyra</code> folder when you run <code>npm run agent</code>.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-4 py-3 bg-ide-surface border-t border-ide-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-ide-primary text-ide-primary-foreground rounded text-ide-sm hover:bg-ide-primary/90 transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
}

function StepCard({ number, title, icon, children }: { number: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-ide-surface border border-ide-border rounded p-3">
      <h4 className="font-medium text-ide-foreground flex items-center gap-2 mb-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-ide-primary text-ide-primary-foreground text-ide-xs">{number}</span>
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function CodeBlock({ text, onCopy }: { text: string; onCopy: (text: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-ide-bg border border-ide-border rounded px-2 py-1.5">
      <code className="flex-1 text-ide-xs font-mono text-ide-foreground break-all">{text}</code>
      <button onClick={() => onCopy(text)} className="shrink-0 px-2 py-1 bg-ide-surface hover:bg-ide-border rounded text-ide-xs text-ide-foreground transition-colors">Copy</button>
    </div>
  );
}

const COMMANDS: { label: string; command: string; description: string }[] = [
  { label: "goto-project", command: "cd d:\\netsyra", description: "Move to the project folder before running the agent." },
  { label: "start-agent", command: "cd d:\\netsyra\nnpm run agent", description: "Start the local agent (do this first)." },
  { label: "install-mkcert", command: "winget install mkcert; choco install mkcert", description: "Install mkcert for TLS certificates (use one of the commands)." },
  { label: "list-files", command: "dir", description: "List files in the opened project folder." },
  { label: "git-status", command: "git status", description: "Check which files have changed." },
  { label: "npm-install", command: "npm install", description: "Install project dependencies." },
  { label: "npm-dev", command: "npm run dev", description: "Start the project dev server." },
  { label: "powershell", command: "powershell -Command \"Get-Process | Select-Object -First 5\"", description: "Run a PowerShell command and see the output in the IDE." },
  { label: "cmd-command", command: "cmd /c echo Hello from CMD", description: "Run a CMD command and see the output in the IDE." },
];
