// d:\netsyra\src\components\ide\DebugPanel.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDebugStore } from "@/ide/debug-store";
import { useIdeStore } from "@/ide";
import {
  Play, RefreshCw, Plus, Trash2, ChevronDown, ChevronRight,
  Circle, StopCircle, AlertCircle, Bug, Terminal, Watch,
} from "lucide-react";

export function DebugPanel() {
  const status = useDebugStore((s) => s.status);
  const callStack = useDebugStore((s) => s.callStack);
  const variables = useDebugStore((s) => s.variables);
  const breakpoints = useDebugStore((s) => s.breakpoints);
  const watchExpressions = useDebugStore((s) => s.watchExpressions);
  const consoleEntries = useDebugStore((s) => s.consoleEntries);
  const setStatus = useDebugStore((s) => s.setStatus);
  const setCallStack = useDebugStore((s) => s.setCallStack);
  const addConsoleEntry = useDebugStore((s) => s.addConsoleEntry);
  const addBreakpoint = useDebugStore((s) => s.addBreakpoint);
  const removeBreakpoint = useDebugStore((s) => s.removeBreakpoint);
  const toggleBreakpoint = useDebugStore((s) => s.toggleBreakpoint);
  const clearBreakpoints = useDebugStore((s) => s.clearBreakpoints);
  const addWatchExpression = useDebugStore((s) => s.addWatchExpression);
  const removeWatchExpression = useDebugStore((s) => s.removeWatchExpression);
  const reset = useDebugStore((s) => s.reset);

  const activeFileId = useIdeStore((s) => s.activeFileId);
  const openFiles = useIdeStore((s) => s.openFiles);

  const [configs, setConfigs] = useState<Array<{ name: string; type: string; program?: string }>>([]);
  const [selectedConfig, setSelectedConfig] = useState("Next.js: Dev Server");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    variables: true,
    watch: true,
    callStack: true,
    breakpoints: true,
  });
  const [newWatchExpr, setNewWatchExpr] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // --- Static debug configs (no server call) ---
  useEffect(() => {
    setConfigs([
      { name: "Next.js: Dev Server", type: "next" },
      { name: "Node: Current File", type: "node" },
    ]);
  }, []);

  // --- Auto-scroll console ---
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleEntries.length]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // --- Start debugging (shows message — debugging runs on user's machine) ---
  const startDebug = useCallback(async () => {
    const config = configs.find((c) => c.name === selectedConfig);
    if (!config) return;

    setStatus("running");
    addConsoleEntry({ level: "info", content: `Starting debug session: ${config.name}` });
    addConsoleEntry({ level: "warn", content: "Server-side debugging is disabled for security." });
    addConsoleEntry({ level: "info", content: "To debug on your own machine, use the Local terminal with the Netsyra Bridge:" });
    addConsoleEntry({ level: "info", content: `  node --inspect-brk ${config.type === "next" ? "node_modules/next/dist/bin/next" : "your-script.js"}` });
    addConsoleEntry({ level: "info", content: "Then open chrome://inspect in your browser to attach the debugger." });
    setStatus("terminated");
  }, [configs, selectedConfig, setStatus, addConsoleEntry]);

  // --- Stop debugging ---
  const stopDebug = useCallback(() => {
    abortRef.current?.abort();
    setStatus("terminated");
    addConsoleEntry({ level: "warn", content: "Debug session stopped by user." });
  }, [setStatus, addConsoleEntry]);

  // --- Add breakpoint for active file at a given line ---
  const handleAddBreakpoint = () => {
    const activeFile = openFiles.find((f) => f.id === activeFileId);
    if (!activeFile) return;
    // Add a breakpoint at line 1 as a placeholder (user can edit)
    addBreakpoint({ filePath: activeFile.path, line: 1, enabled: true });
  };

  const statusIcon = {
    idle: <Circle size={11} className="text-[#484f58]" />,
    running: <Circle size={11} className="text-[#3fb950] animate-pulse" />,
    paused: <Circle size={11} className="text-[#d29922]" />,
    terminated: <Circle size={11} className="text-[#6e7681]" />,
    error: <AlertCircle size={11} className="text-[#f85149]" />,
  };

  const renderSectionHeader = (id: string, label: string, icon: React.ReactNode, count?: number) => (
    <div
      className="flex items-center gap-1 px-2 py-1 hover:bg-[#161b22] cursor-pointer text-[11px] uppercase tracking-wider text-[#6e7681] font-bold select-none"
      onClick={() => toggleSection(id)}
    >
      {expandedSections[id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-[#484f58] normal-case">{count}</span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0d1117] select-none">
      {/* Debug toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[#1f2428] bg-[#161b22] shrink-0">
        {/* Config selector */}
        <select
          value={selectedConfig}
          onChange={(e) => setSelectedConfig(e.target.value)}
          disabled={status === "running"}
          className="bg-[#0d1117] text-[#e6edf3] text-[11px] px-2 py-1 rounded border border-[#30363d] focus:border-[#34e8bb] outline-none cursor-pointer disabled:opacity-50"
        >
          {configs.length === 0 && <option>Loading...</option>}
          {configs.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Start/Stop button */}
        {status === "running" ? (
          <button
            onClick={stopDebug}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#f85149]/10 text-[#f85149] hover:bg-[#f85149]/20 border border-[#f85149]/30 transition-colors"
            title="Stop debug session"
          >
            <StopCircle size={12} />
            Stop
          </button>
        ) : (
          <button
            onClick={startDebug}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#34e8bb]/10 text-[#34e8bb] hover:bg-[#34e8bb]/20 border border-[#34e8bb]/30 transition-colors"
            title="Start debugging"
          >
            <Play size={12} />
            Start
          </button>
        )}

        <div className="flex items-center gap-1 ml-1">
          {statusIcon[status]}
          <span className="text-[10px] text-[#6e7681] capitalize">{status}</span>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => { reset(); }}
          className="p-1 rounded text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#1f2428] transition-colors"
          title="Reset debug state"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Debug content — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Variables section */}
        {renderSectionHeader("variables", "Variables", <Bug size={11} />)}
        {expandedSections.variables && (
          <div className="px-3 py-1 space-y-1">
            {Object.keys(variables).length === 0 ? (
              <div className="text-[11px] text-[#484f58] py-1">No variables (session not paused).</div>
            ) : (
              Object.entries(variables).map(([scope, vars]) => (
                <div key={scope}>
                  <div className="text-[11px] text-[#6e7681] font-medium py-0.5">{scope}</div>
                  {vars.map((v, i) => (
                    <div key={i} className="flex gap-2 text-[12px] pl-3 py-0.5 hover:bg-[#161b22] rounded">
                      <span className="text-[#58a6ff]">{v.name}</span>
                      <span className="text-[#484f58]">:</span>
                      <span className="text-[#3fb950] truncate">{v.value}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* Watch expressions */}
        {renderSectionHeader("watch", "Watch", <Watch size={11} />, watchExpressions.length)}
        {expandedSections.watch && (
          <div className="px-3 py-1 space-y-1">
            {/* Add new watch */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newWatchExpr}
                onChange={(e) => setNewWatchExpr(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newWatchExpr.trim()) {
                    addWatchExpression(newWatchExpr.trim());
                    setNewWatchExpr("");
                  }
                }}
                placeholder="Add expression..."
                className="flex-1 bg-[#161b22] text-[#e6edf3] text-[11px] px-2 py-0.5 rounded border border-[#30363d] focus:border-[#34e8bb] outline-none placeholder-[#484f58]"
              />
              <button
                onClick={() => { if (newWatchExpr.trim()) { addWatchExpression(newWatchExpr.trim()); setNewWatchExpr(""); } }}
                className="p-0.5 rounded text-[#6e7681] hover:text-[#34e8bb] hover:bg-[#1f2428]"
              >
                <Plus size={12} />
              </button>
            </div>
            {watchExpressions.map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-[12px] pl-3 py-0.5 hover:bg-[#161b22] rounded group">
                <span className="text-[#58a6ff] truncate flex-1">{w.expression}</span>
                {w.value && <span className="text-[#3fb950] truncate">{w.value}</span>}
                <button
                  onClick={() => removeWatchExpression(w.id)}
                  className="text-[#484f58] hover:text-[#f85149] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Call stack */}
        {renderSectionHeader("callStack", "Call Stack", <Terminal size={11} />, callStack.length)}
        {expandedSections.callStack && (
          <div className="px-3 py-1 space-y-0.5">
            {callStack.length === 0 ? (
              <div className="text-[11px] text-[#484f58] py-1">Not paused at a breakpoint.</div>
            ) : (
              callStack.map((frame) => (
                <div key={frame.id} className="text-[12px] py-0.5 hover:bg-[#161b22] rounded px-2 cursor-pointer">
                  <span className="text-[#e6edf3]">{frame.functionName}</span>
                  <span className="text-[#484f58] ml-2 text-[11px]">{frame.location}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Breakpoints */}
        {renderSectionHeader("breakpoints", "Breakpoints", <Circle size={11} />, breakpoints.length)}
        {expandedSections.breakpoints && (
          <div className="px-3 py-1 space-y-0.5">
            <button
              onClick={handleAddBreakpoint}
              className="flex items-center gap-1 text-[11px] text-[#6e7681] hover:text-[#34e8bb] py-0.5"
            >
              <Plus size={11} />
              Add breakpoint
            </button>
            {breakpoints.map((bp) => (
              <div key={bp.id} className="flex items-center gap-2 text-[12px] py-0.5 hover:bg-[#161b22] rounded px-2 group">
                <button
                  onClick={() => toggleBreakpoint(bp.id)}
                  className={`shrink-0 ${bp.enabled ? "text-[#f85149]" : "text-[#484f58]"}`}
                >
                  <Circle size={10} fill={bp.enabled ? "currentColor" : "none"} />
                </button>
                <span className={`truncate flex-1 ${bp.enabled ? "text-[#e6edf3]" : "text-[#484f58]"}`}>
                  {bp.filePath.split("/").pop()}:{bp.line}
                </span>
                {bp.hit && <span className="text-[10px] text-[#d29922]">hit</span>}
                <button
                  onClick={() => removeBreakpoint(bp.id)}
                  className="text-[#484f58] hover:text-[#f85149] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            {breakpoints.length > 0 && (
              <button
                onClick={clearBreakpoints}
                className="flex items-center gap-1 text-[11px] text-[#6e7681] hover:text-[#f85149] py-0.5"
              >
                <Trash2 size={11} />
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Debug Console */}
        <div className="border-t border-[#1f2428] mt-2">
          <div className="flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider text-[#6e7681] font-bold">
            <Terminal size={11} />
            Debug Console
          </div>
          <div ref={consoleRef} className="px-3 py-1 max-h-[200px] overflow-y-auto font-mono text-[12px]">
            {consoleEntries.length === 0 ? (
              <div className="text-[11px] text-[#484f58] py-1">Console output will appear here.</div>
            ) : (
              consoleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`py-0.5 whitespace-pre-wrap break-all ${
                    entry.level === "error" ? "text-[#f85149]"
                    : entry.level === "warn" ? "text-[#d29922]"
                    : entry.level === "info" ? "text-[#58a6ff]"
                    : "text-[#8b949e]"
                  }`}
                >
                  {entry.content}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
