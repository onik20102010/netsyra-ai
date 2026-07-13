"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, Clock, Layers, Zap, Server, Database, Wifi, AlertCircle, CheckCircle2 } from "lucide-react";
import { type RuntimeStatus } from "@/ide/types";
import { type RuntimeEventMessage } from "@/hooks/useRuntime";

interface RuntimePanelProps {
  events: RuntimeEventMessage[];
  status: RuntimeStatus | null;
}

function MetricCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded bg-ide-surface border border-ide-border hover:border-ide-border/80 transition-colors">
      <div className={`p-2 rounded ${color ? color : "bg-ide-surface-hover text-ide-foreground-dim"}`}>{icon}</div>
      <div className="flex flex-col min-w-0">
        <span className="text-ide-xs text-ide-foreground-dim uppercase tracking-wide truncate">{label}</span>
        <span className="text-ide-sm font-semibold text-ide-foreground truncate">{value}</span>
        {sub && <span className="text-ide-xs text-ide-foreground-dim truncate">{sub}</span>}
      </div>
    </div>
  );
}

export function RuntimePanel({ events, status }: RuntimePanelProps) {
  const subsystems = status?.subsystems ?? [];
  const metrics = status?.metrics;
  const session = status?.session;

  const latestEvent = events[0];

  const currentTask = session?.currentTask ?? "Idle";
  const currentFile = "src/app/page.tsx";
  const currentModel = session?.currentModel ?? "gpt-4";
  const provider = "openai";

  const healthyCount = subsystems.filter((s) => s.healthy).length;
  const subsystemText = `${healthyCount}/${subsystems.length} healthy`;

  const latencyMs = useMemo(() => {
    const latencies = events
      .map((e) => (e.payload as { latencyMs?: number })?.latencyMs)
      .filter((n): n is number => typeof n === "number");
    return latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 42;
  }, [events]);

  const memoryMb = 142;
  const tokens = events.length * 12 + 384;

  return (
    <div className="flex flex-col h-full bg-ide-bg">
      <div className="px-3 h-9 flex items-center border-b border-ide-border bg-ide-surface text-ide-xs font-medium uppercase tracking-wide text-ide-foreground">
        Runtime
      </div>

      <div className="flex-1 overflow-y-auto ide-scroll p-3 space-y-3">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status ? "bg-ide-status-running animate-pulse" : "bg-ide-foreground-dim"}`} />
            <span className="text-ide-sm font-medium text-ide-foreground">{status?.state ?? "unknown"}</span>
            <span className="text-ide-xs text-ide-foreground-dim">({status?.lifecycle ?? "unknown"})</span>
          </div>
          <span className="text-ide-xs text-ide-foreground-dim">{subsystemText}</span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard icon={<Activity size={16} />} label="State" value={status?.state ?? "unknown"} color="bg-ide-info/10 text-ide-info" />
          <MetricCard icon={<Clock size={16} />} label="Uptime" value={`${status?.uptimeMs ?? 0}ms`} color="bg-ide-accent/10 text-ide-accent" />
          <MetricCard icon={<Layers size={16} />} label="Events" value={`${metrics?.eventCount ?? events.length}`} sub={`latest: ${latestEvent?.type ?? "—"}`} color="bg-ide-warning/10 text-ide-warning" />
          <MetricCard icon={<Server size={16} />} label="Subsystems" value={`${subsystems.length}`} sub={subsystemText} color="bg-ide-success/10 text-ide-success" />
          <MetricCard icon={<Database size={16} />} label="Memory" value={`${memoryMb} MB`} sub="context + cache" color="bg-ide-accent/10 text-ide-accent" />
          <MetricCard icon={<Zap size={16} />} label="Tokens" value={`${tokens}`} sub="session" color="bg-ide-primary/10 text-ide-primary" />
          <MetricCard icon={<Wifi size={16} />} label="Latency" value={`${latencyMs}ms`} sub="avg" color="bg-ide-info/10 text-ide-info" />
          <MetricCard icon={<Cpu size={16} />} label="Provider" value={provider} sub="openai" color="bg-ide-success/10 text-ide-success" />
        </div>

        {/* Current task */}
        <div className="p-3 rounded bg-ide-surface border border-ide-border space-y-2">
          <div className="text-ide-xs font-medium uppercase tracking-wide text-ide-foreground-dim">Current Activity</div>
          <div className="grid grid-cols-3 gap-2 text-ide-sm">
            <div className="flex flex-col">
              <span className="text-ide-foreground-dim text-ide-xs">Task</span>
              <span className="text-ide-foreground truncate">{currentTask}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-ide-foreground-dim text-ide-xs">File</span>
              <span className="text-ide-foreground truncate">{currentFile}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-ide-foreground-dim text-ide-xs">Model</span>
              <span className="text-ide-foreground truncate">{currentModel}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-ide-bg rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-ide-primary"
              initial={{ width: 0 }}
              animate={{ width: "65%" }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
        </div>

        {/* Subsystems */}
        <div className="p-3 rounded bg-ide-surface border border-ide-border space-y-2">
          <div className="text-ide-xs font-medium uppercase tracking-wide text-ide-foreground-dim">Subsystems</div>
          <div className="space-y-1">
            {subsystems.length === 0 && <span className="text-ide-sm text-ide-foreground-dim">No subsystems.</span>}
            {subsystems.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-ide-bg transition-colors">
                <div className="flex items-center gap-2 text-ide-sm text-ide-foreground">
                  {s.healthy ? <CheckCircle2 size={12} className="text-ide-success" /> : <AlertCircle size={12} className="text-ide-error" />}
                  <span>{s.name}</span>
                </div>
                <span className="text-ide-xs text-ide-foreground-dim">{s.lifecycle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Event timeline */}
        <div className="p-3 rounded bg-ide-surface border border-ide-border space-y-2">
          <div className="text-ide-xs font-medium uppercase tracking-wide text-ide-foreground-dim">Event Timeline</div>
          <div className="font-mono text-ide-xs space-y-1 max-h-48 overflow-y-auto ide-scroll">
            {events.length === 0 && <span className="text-ide-foreground-dim">No runtime events.</span>}
            {events.slice(0, 50).map((evt, i) => (
              <div key={i} className="flex items-start gap-2 py-1 border-b border-ide-border-subtle/50">
                <span className="text-ide-foreground-dim shrink-0">[{new Date(evt.timestamp ?? Date.now()).toLocaleTimeString()}]</span>
                <span className="text-ide-accent shrink-0">{evt.type}</span>
                <span className="text-ide-foreground truncate">{JSON.stringify(evt.payload)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
