import type { RuntimeLog } from "@/ide/types";
import { BaseSubsystem } from "./subsystem";

export class Logger extends BaseSubsystem {
  private logs: RuntimeLog[] = [];
  private maxLogs: number;

  constructor(maxLogs = 2000) {
    super({
      id: "logger",
      name: "Runtime Logger",
      version: "1.0.0",
      capabilities: ["logging", "diagnostics"],
    });
    this.maxLogs = maxLogs;
  }

  log(level: RuntimeLog["level"], message: string, source: string, metadata?: Record<string, unknown>): void {
    const log: RuntimeLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      level,
      message,
      source,
      timestamp: Date.now(),
      metadata,
    };
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (level === "error") {
      this.healthy = false;
    } else {
      this.healthy = true;
    }
  }

  debug(message: string, source: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, source, metadata);
  }

  info(message: string, source: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, source, metadata);
  }

  warn(message: string, source: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, source, metadata);
  }

  error(message: string, source: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, source, metadata);
  }

  getLogs(): RuntimeLog[] {
    return [...this.logs];
  }

  getRecentLogs(level: RuntimeLog["level"] | "all" = "all", limit = 100): RuntimeLog[] {
    const filtered = level === "all" ? this.logs : this.logs.filter((l) => l.level === level);
    return filtered.slice(-limit);
  }

  getDiagnostics(): Record<string, unknown> {
    return {
      totalLogs: this.logs.length,
      errors: this.logs.filter((l) => l.level === "error").length,
      warnings: this.logs.filter((l) => l.level === "warn").length,
    };
  }
}
