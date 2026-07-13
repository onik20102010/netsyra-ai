import type { RuntimeEvent, RuntimeMetrics } from "@/ide/types";
import { BaseSubsystem } from "./subsystem";

export class Telemetry extends BaseSubsystem {
  private metrics: RuntimeMetrics = {
    bootTimeMs: 0,
    lastStartTime: 0,
    lastShutdownTime: 0,
    restartCount: 0,
    errorCount: 0,
    eventCount: 0,
    subsystemHealth: {},
  };

  constructor() {
    super({
      id: "telemetry",
      name: "Telemetry",
      version: "1.0.0",
      capabilities: ["telemetry", "metrics", "observability"],
    });
  }

  recordBoot(durationMs: number): void {
    this.metrics.bootTimeMs = durationMs;
    this.metrics.lastStartTime = Date.now();
  }

  recordShutdown(): void {
    this.metrics.lastShutdownTime = Date.now();
  }

  recordRestart(): void {
    this.metrics.restartCount += 1;
  }

  recordError(): void {
    this.metrics.errorCount += 1;
  }

  recordEvent(_event: RuntimeEvent): void {
    this.metrics.eventCount += 1;
  }

  updateSubsystemHealth(subsystemId: string, healthy: boolean): void {
    this.metrics.subsystemHealth[subsystemId] = healthy;
  }

  getMetrics(): RuntimeMetrics {
    return { ...this.metrics };
  }

  getDiagnostics(): Record<string, unknown> {
    return { metrics: this.getMetrics() };
  }
}
