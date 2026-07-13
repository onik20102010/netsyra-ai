import type { RuntimeConfig, SubsystemConfig } from "@/ide/types";
import { BaseSubsystem } from "./subsystem";

export class ConfigurationManager extends BaseSubsystem {
  private runtimeConfig: RuntimeConfig;

  constructor() {
    super({
      id: "configuration",
      name: "Configuration Manager",
      version: "1.0.0",
      capabilities: ["configuration", "runtime"],
    });

    this.runtimeConfig = {
      environment: (process.env.NODE_ENV as RuntimeConfig["environment"]) ?? "development",
      debug: process.env.NODE_ENV !== "production",
      maxRetries: 3,
      retryDelayMs: 1000,
      healthCheckIntervalMs: 10000,
      maxConcurrentTasks: 10,
      freeTierProvider: process.env.FREE_TIER_PROVIDER ?? "groq",
      paidTierProvider: process.env.PAID_TIER_PROVIDER ?? "mesh",
      sessionTtlMs: 24 * 60 * 60 * 1000,
      memoryLimitMb: 512,
      runtimeId: ConfigurationManager.generateRuntimeId(),
    } as RuntimeConfig;
  }

  static generateRuntimeId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  async initialize(config?: SubsystemConfig): Promise<void> {
    await super.initialize(config);
    if (config) {
      this.runtimeConfig = { ...this.runtimeConfig, ...config } as RuntimeConfig;
    }
  }

  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    return this.runtimeConfig[key];
  }

  set<K extends keyof RuntimeConfig>(key: K, value: RuntimeConfig[K]): void {
    this.runtimeConfig[key] = value;
  }

  getAll(): RuntimeConfig {
    return { ...this.runtimeConfig };
  }

  overrideConfig(override: Partial<RuntimeConfig>): void {
    this.runtimeConfig = { ...this.runtimeConfig, ...override };
  }

  override getConfig(): RuntimeConfig {
    return this.getAll();
  }

  override async setConfig(config: SubsystemConfig): Promise<void> {
    this.runtimeConfig = { ...this.runtimeConfig, ...config } as RuntimeConfig;
  }

  override getDiagnostics(): Record<string, unknown> {
    return {
      keys: Object.keys(this.runtimeConfig),
      environment: this.runtimeConfig.environment,
      debug: this.runtimeConfig.debug,
    };
  }
}
