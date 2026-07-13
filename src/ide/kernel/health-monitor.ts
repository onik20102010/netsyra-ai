import type { RuntimeEvent } from "@/ide/types";
import { BaseSubsystem } from "./subsystem";
import type { ISubsystem, IRuntimeKernel } from "./types";

export interface HealthMonitorOptions {
  intervalMs?: number;
  autoRestart?: boolean;
  maxConsecutiveFailures?: number;
}

export class HealthMonitor extends BaseSubsystem {
  private interval: ReturnType<typeof setInterval> | null = null;
  private options: HealthMonitorOptions;
  private kernel: IRuntimeKernel | null = null;
  private failureCounts = new Map<string, number>();

  constructor(options: HealthMonitorOptions = {}) {
    super({
      id: "health-monitor",
      name: "Health Monitor",
      version: "1.0.0",
      capabilities: ["health", "diagnostics"],
      dependencies: ["diagnostics"],
    });
    this.options = {
      intervalMs: 10000,
      autoRestart: true,
      maxConsecutiveFailures: 3,
      ...options,
    };
  }

  async initialize(config?: Record<string, unknown>): Promise<void> {
    await super.initialize(config);
    this.kernel = (config?.kernel as IRuntimeKernel) ?? null;
  }

  async start(): Promise<void> {
    await super.start();
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      void this.check();
    }, this.options.intervalMs ?? 10000);
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    await super.stop();
  }

  async check(): Promise<void> {
    if (!this.kernel) return;

    const subsystems = this.kernel.getSubsystems();
    for (const subsystem of subsystems) {
      try {
        const report = await subsystem.healthCheck();
        subsystem.healthy = report.healthy;
        if (!report.healthy) {
          const failures = (this.failureCounts.get(subsystem.id) ?? 0) + 1;
          this.failureCounts.set(subsystem.id, failures);
          if (this.options.autoRestart && failures >= (this.options.maxConsecutiveFailures ?? 3)) {
            await this.restartSubsystem(subsystem);
            this.failureCounts.set(subsystem.id, 0);
          }
        } else {
          this.failureCounts.set(subsystem.id, 0);
        }
      } catch (error) {
        subsystem.healthy = false;
        const failures = (this.failureCounts.get(subsystem.id) ?? 0) + 1;
        this.failureCounts.set(subsystem.id, failures);
        if (this.options.autoRestart && failures >= (this.options.maxConsecutiveFailures ?? 3)) {
          await this.restartSubsystem(subsystem);
          this.failureCounts.set(subsystem.id, 0);
        }
      }
    }

    await this.kernel.emit("kernel:health-check", { subsystems: subsystems.map((s) => s.id) }, "health-monitor");
  }

  async restartSubsystem(subsystem: ISubsystem): Promise<void> {
    if (!this.kernel) return;
    await this.kernel.emit("kernel:subsystem-restarting", { subsystemId: subsystem.id }, "health-monitor");
    try {
      await subsystem.restart();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      subsystem.lastError = message;
    }
  }

  onEvent(_event: RuntimeEvent): void {
    // No action needed for runtime events.
  }
}
