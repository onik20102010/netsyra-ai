import type { DiagnosticsSnapshot, HealthReport, RuntimeLog, SubsystemStatus } from "@/ide/types";
import { BaseSubsystem } from "./subsystem";
import type { ISubsystem, IRuntimeKernel } from "./types";

export class Diagnostics extends BaseSubsystem {
  private healthReports = new Map<string, HealthReport>();
  private kernel: IRuntimeKernel | null = null;

  constructor() {
    super({
      id: "diagnostics",
      name: "Diagnostics",
      version: "1.0.0",
      capabilities: ["diagnostics", "health", "observability"],
    });
  }

  async initialize(config?: Record<string, unknown>): Promise<void> {
    await super.initialize(config);
    this.kernel = (config as { kernel?: IRuntimeKernel })?.kernel ?? null;
  }

  async updateHealth(subsystemId: string, report: HealthReport): Promise<void> {
    this.healthReports.set(subsystemId, report);
  }

  async healthCheck(): Promise<HealthReport> {
    const reports = Array.from(this.healthReports.values());
    const errors = reports.flatMap((r) => r.errors);
    return {
      healthy: reports.every((r) => r.healthy),
      timestamp: Date.now(),
      details: { totalReports: reports.length },
      errors,
    };
  }

  getSubsystemStatuses(subsystems: ISubsystem[]): SubsystemStatus[] {
    return subsystems.map((s) => s.getStatus());
  }

  getSnapshot(subsystems: ISubsystem[], logs: { getLogs(): RuntimeLog[] }): DiagnosticsSnapshot {
    return {
      runtimeState: this.kernel?.state as import("@/ide/types").RuntimeState ?? "ready",
      subsystems: this.getSubsystemStatuses(subsystems),
      logs: logs.getLogs().slice(-100),
      health: Object.fromEntries(this.healthReports),
      timestamp: Date.now(),
    };
  }

  getDiagnostics(): Record<string, unknown> {
    return {
      healthReports: Object.fromEntries(this.healthReports),
      totalReports: this.healthReports.size,
    };
  }
}
