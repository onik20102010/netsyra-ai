// d:\netsyra\src\components\ide\OutputPanel.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useOutputStore, type OutputLevel } from "@/ide/output-store";
import { Play, Square, Trash2, Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";

const LEVEL_COLORS: Record<OutputLevel, string> = {
  info: "text-[#8b949e]",
  success: "text-[#3fb950]",
  warning: "text-[#d29922]",
  error: "text-[#f85149]",
  command: "text-[#34e8bb]",
};

const STATUS_ICON = {
  idle: <Circle size={11} className="text-[#484f58]" />,
  running: <Loader2 size={11} className="text-[#58a6ff] animate-spin" />,
  success: <CheckCircle2 size={11} className="text-[#3fb950]" />,
  failed: <XCircle size={11} className="text-[#f85149]" />,
  cancelled: <Circle size={11} className="text-[#d29922]" />,
};

export function OutputPanel() {
  const channels = useOutputStore((s) => s.channels);
  const activeChannelId = useOutputStore((s) => s.activeChannelId);
  const setActiveChannel = useOutputStore((s) => s.setActiveChannel);
  const appendLine = useOutputStore((s) => s.appendLine);
  const clearChannel = useOutputStore((s) => s.clearChannel);
  const startChannel = useOutputStore((s) => s.startChannel);
  const finishChannel = useOutputStore((s) => s.finishChannel);
  const setChannelStatus = useOutputStore((s) => s.setChannelStatus);

  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeChannel = channels[activeChannelId];
  const lines = activeChannel?.lines ?? [];
  const status = activeChannel?.status ?? "idle";

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines.length, autoScroll]);

  // Cancel any running task on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // --- Run a task — shows message that tasks run on user's machine ---
  const runTask = useCallback(async (channelId: string) => {
    startChannel(channelId);
    appendLine(channelId, {
      level: "command",
      content: `$ ${getTaskLabel(channelId)}`,
      source: channelId,
    });
    appendLine(channelId, {
      level: "warning",
      content: "Server-side task execution is disabled for security. Run this command on your own machine via the Local terminal.",
      source: channelId,
    });
    appendLine(channelId, {
      level: "info",
      content: "Switch to the Local terminal tab and run the command there after starting the Netsyra Bridge.",
      source: channelId,
    });
    finishChannel(channelId, "failed");
  }, [appendLine, startChannel, finishChannel]);

  const stopTask = useCallback(() => {
    abortRef.current?.abort();
    setChannelStatus(activeChannelId, "cancelled");
  }, [activeChannelId, setChannelStatus]);

  const handleRun = () => {
    if (status === "running") {
      stopTask();
    } else {
      runTask(activeChannelId);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toTimeString().slice(0, 8);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] select-none">
      {/* Channel selector + actions */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[#1f2428] bg-[#161b22] shrink-0">
        {/* Channel dropdown */}
        <select
          value={activeChannelId}
          onChange={(e) => setActiveChannel(e.target.value)}
          className="bg-[#0d1117] text-[#e6edf3] text-[12px] px-2 py-1 rounded border border-[#30363d] focus:border-[#34e8bb] outline-none cursor-pointer"
        >
          {Object.values(channels).map((ch) => (
            <option key={ch.id} value={ch.id}>{ch.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-1">
          {STATUS_ICON[status]}
          <span className="text-[11px] text-[#6e7681] capitalize">{status}</span>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <button
          onClick={handleRun}
          disabled={false}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${
            status === "running"
              ? "bg-[#f85149]/10 text-[#f85149] hover:bg-[#f85149]/20 border border-[#f85149]/30"
              : "bg-[#34e8bb]/10 text-[#34e8bb] hover:bg-[#34e8bb]/20 border border-[#34e8bb]/30"
          }`}
          title={status === "running" ? "Stop task" : `Run ${getTaskLabel(activeChannelId)}`}
        >
          {status === "running" ? <Square size={11} /> : <Play size={11} />}
          <span>{status === "running" ? "Stop" : "Run"}</span>
        </button>
        <button
          onClick={() => clearChannel(activeChannelId)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#1f2428] transition-colors border border-transparent hover:border-[#30363d]"
          title="Clear output"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Output lines */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-[12.5px] leading-[1.5] px-3 py-2"
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
          setAutoScroll(atBottom);
        }}
      >
        {lines.length === 0 ? (
          <div className="text-[#484f58] text-[12px] py-4 text-center">
            No output yet. Click <span className="text-[#34e8bb]">Run</span> to start {getTaskLabel(activeChannelId)}.
          </div>
        ) : (
          lines.map((line) => (
            <div key={line.id} className="flex gap-2 hover:bg-[#161b22]/50 px-1 -mx-1 rounded">
              <span className="text-[#484f58] shrink-0 select-none">{formatTime(line.timestamp)}</span>
              <span className={`${LEVEL_COLORS[line.level]} whitespace-pre-wrap break-all`}>
                {line.content}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getTaskLabel(taskId: string): string {
  const map: Record<string, string> = {
    build: "npm run build",
    typecheck: "tsc --noEmit",
    lint: "npm run lint",
    dev: "npm run dev",
  };
  return map[taskId] || taskId;
}
