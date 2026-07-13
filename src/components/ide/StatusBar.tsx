"use client";

import React from "react";
import { GitBranch, Bell, Cpu, Wifi, WifiOff, Clock, Activity, Database, Zap, AlertCircle } from "lucide-react";
import { type RuntimeStatus } from "@/ide/types";

interface StatusBarProps {
  status: RuntimeStatus | null;
  connected: boolean;
  onToast: (message: string) => void;
}

export function StatusBar({ status, connected, onToast }: StatusBarProps) {
  const state = status?.state ?? "idle";
  const eventCount = status?.metrics?.eventCount ?? 0;
  const uptimeMs = status?.uptimeMs ?? 0;
  const subsystemHealth = status?.metrics?.subsystemHealth ?? {};
  const healthy = Object.values(subsystemHealth).filter(Boolean).length;
  const total = Object.keys(subsystemHealth).length;
  const memory = "14.2 MB";

  return (
    <div className="h-7 flex items-center justify-between px-2 bg-ide-primary text-ide-primary-foreground text-ide-xs select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <GitBranch size={12} />
          <span>main*</span>
        </div>
        <div className="flex items-center gap-1.5">
          {connected ? <Wifi size={12} className="text-ide-success" /> : <WifiOff size={12} className="text-ide-error" />}
          <span>{connected ? "Connected" : "Disconnected"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity size={12} />
          <span className="capitalize">{state}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5">
          <Cpu size={12} />
          <span>{healthy}/{total} subsystems</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5">
          <Database size={12} />
          <span>{memory}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5">
          <Zap size={12} />
          <span>{eventCount} events</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5">
          <Clock size={12} />
          <span>{uptimeMs}ms</span>
        </div>
        <button
          onClick={() => onToast("Notifications panel opened")}
          className="flex items-center gap-1 hover:bg-ide-primary-dim px-1.5 rounded transition-colors"
          title="Notifications"
        >
          <Bell size={12} />
        </button>
      </div>
    </div>
  );
}
