import type {
  RuntimeEvent,
  SubsystemConfig,
  SubsystemStatus,
  HealthReport,
  SubsystemLifecycle,
} from "@/ide/types";
import type { ISubsystem } from "./types";

export abstract class BaseSubsystem implements ISubsystem {
  id: string;
  name: string;
  version: string;
  capabilities: string[] = [];
  dependencies: string[] = [];
  lifecycle: SubsystemLifecycle = "uninitialized";
  healthy = true;
  lastError: string | null = null;

  protected config: SubsystemConfig = {};

  constructor(options: {
    id: string;
    name?: string;
    version?: string;
    capabilities?: string[];
    dependencies?: string[];
  }) {
    this.id = options.id;
    this.name = options.name ?? options.id;
    this.version = options.version ?? "0.0.1";
    this.capabilities = options.capabilities ?? [];
    this.dependencies = options.dependencies ?? [];
  }

  async initialize(config?: SubsystemConfig): Promise<void> {
    this.config = { ...this.config, ...(config ?? {}) };
    this.lifecycle = "initialized";
  }

  async start(): Promise<void> {
    this.lifecycle = "starting";
    this.lifecycle = "running";
  }

  async pause(): Promise<void> {
    if (this.lifecycle === "running") {
      this.lifecycle = "paused";
    }
  }

  async resume(): Promise<void> {
    if (this.lifecycle === "paused") {
      this.lifecycle = "running";
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async stop(): Promise<void> {
    this.lifecycle = "stopped";
  }

  async shutdown(): Promise<void> {
    await this.stop();
    this.lifecycle = "stopped";
  }

  async dispose(): Promise<void> {
    await this.shutdown();
    this.lifecycle = "uninitialized";
  }

  async healthCheck(): Promise<HealthReport> {
    return {
      healthy: this.healthy,
      timestamp: Date.now(),
      details: { lifecycle: this.lifecycle },
      errors: this.lastError ? [this.lastError] : [],
    };
  }

  getStatus(): SubsystemStatus {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      lifecycle: this.lifecycle,
      healthy: this.healthy,
      dependencies: this.dependencies,
      capabilities: this.capabilities,
      lastError: this.lastError,
    };
  }

  getMetrics(): Record<string, unknown> {
    return {};
  }

  getDiagnostics(): Record<string, unknown> {
    return {
      lifecycle: this.lifecycle,
      healthy: this.healthy,
      lastError: this.lastError,
    };
  }

  getConfig(): SubsystemConfig {
    return this.config;
  }

  async setConfig(config: SubsystemConfig): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  onEvent(_event: RuntimeEvent): Promise<void> | void {
    // Subclasses override to handle events.
  }

  protected setError(error: unknown): void {
    this.lastError = error instanceof Error ? error.message : String(error);
    this.healthy = false;
    this.lifecycle = "error";
  }

  protected clearError(): void {
    this.lastError = null;
    this.healthy = true;
  }
}
