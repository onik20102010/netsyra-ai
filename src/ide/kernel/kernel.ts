import type { IRuntimeKernel, ISubsystem, IPlugin, EventHandler } from "./types";
import type { RuntimeEvent, RuntimeState, RuntimeStatus, RuntimeConfig, RuntimeLog, SessionSnapshot, SubsystemConfig, SubsystemLifecycle } from "@/ide/types";
import { RuntimeRegistry } from "./registry";
import { DependencyGraph } from "./dependency-graph";
import { RuntimeEventBus } from "./runtime-event-bus";
import { ConfigurationManager } from "./config";
import { SessionManager } from "./session";
import { Diagnostics } from "./diagnostics";
import { Telemetry } from "./telemetry";
import { Logger } from "./logger";
import { HealthMonitor } from "./health-monitor";
import { PluginManager } from "./plugin-manager";

export class RuntimeKernel implements IRuntimeKernel {
  id: string;
  state: RuntimeState = "booting";
  lifecycle: SubsystemLifecycle = "uninitialized";

  private registry = new RuntimeRegistry();
  private dependencyGraph = new DependencyGraph();
  private eventBus: RuntimeEventBus;
  private configManager: ConfigurationManager;
  private sessionManager: SessionManager;
  private diagnostics: Diagnostics;
  private telemetry: Telemetry;
  private logger: Logger;
  private healthMonitor: HealthMonitor;
  private pluginManager: PluginManager;

  private bootedAt = 0;
  private booting = false;
  private shuttingDown = false;
  private subsystemSubscriptions = new Map<string, () => void>();

  constructor() {
    this.eventBus = new RuntimeEventBus();
    this.configManager = new ConfigurationManager();
    this.sessionManager = new SessionManager();
    this.diagnostics = new Diagnostics();
    this.telemetry = new Telemetry();
    this.logger = new Logger();
    this.healthMonitor = new HealthMonitor();
    this.pluginManager = new PluginManager();

    this.id = this.configManager.get("runtimeId") as string;

    // Register core subsystems with the kernel.
    this.registerCoreSubsystem(this.eventBus);
    this.registerCoreSubsystem(this.configManager);
    this.registerCoreSubsystem(this.sessionManager);
    this.registerCoreSubsystem(this.diagnostics);
    this.registerCoreSubsystem(this.telemetry);
    this.registerCoreSubsystem(this.logger);
    this.registerCoreSubsystem(this.healthMonitor);
    this.registerCoreSubsystem(this.pluginManager);
  }

  private registerCoreSubsystem(subsystem: ISubsystem): void {
    try {
      this.registry.register(subsystem);
      this.registerSubsystemSubscription(subsystem);
    } catch (error) {
      this.logger.error(`Failed to register ${subsystem.id}: ${String(error)}`, "kernel");
    }
  }

  private registerSubsystemSubscription(subsystem: ISubsystem): void {
    const unsubscribe = this.eventBus.subscribe({
      id: subsystem.id,
      handler: async (event) => {
        try {
          await subsystem.onEvent(event);
        } catch (error) {
          this.logger.error(`Subsystem ${subsystem.id} failed to handle event ${event.type}: ${String(error)}`, "kernel");
          this.telemetry.recordError();
        }
      },
    });
    this.subsystemSubscriptions.set(subsystem.id, unsubscribe);
  }

  async register(subsystem: ISubsystem): Promise<void> {
    if (this.state === "ready" || this.state === "busy") {
      this.registry.register(subsystem);
      this.registerSubsystemSubscription(subsystem);
      await subsystem.initialize({ kernel: this });
      await subsystem.start();
      await this.emit("kernel:subsystem-registered", { subsystemId: subsystem.id }, "kernel");
    } else {
      this.registry.register(subsystem);
      this.registerSubsystemSubscription(subsystem);
    }
  }

  async unregister(subsystemId: string): Promise<void> {
    const subsystem = this.registry.get(subsystemId);
    if (!subsystem) return;
    try {
      await subsystem.shutdown();
    } catch (error) {
      this.logger.error(`Error shutting down ${subsystemId}: ${String(error)}`, "kernel");
    } finally {
      this.registry.unregister(subsystemId);
      const unsubscribe = this.subsystemSubscriptions.get(subsystemId);
      if (unsubscribe) {
        unsubscribe();
        this.subsystemSubscriptions.delete(subsystemId);
      }
      await this.emit("kernel:subsystem-unregistered", { subsystemId }, "kernel");
    }
  }

  getSubsystem(id: string): ISubsystem | undefined {
    return this.registry.get(id);
  }

  getSubsystems(): ISubsystem[] {
    return this.registry.getAll();
  }

  getSubsystemsByCapability(capability: string): ISubsystem[] {
    return this.registry.getByCapability(capability);
  }

  async registerPlugin(plugin: IPlugin): Promise<void> {
    await this.pluginManager.registerPlugin(plugin);
  }

  async unregisterPlugin(pluginId: string): Promise<void> {
    await this.pluginManager.unregisterPlugin(pluginId);
  }

  async enablePlugin(pluginId: string): Promise<void> {
    await this.pluginManager.enablePlugin(pluginId);
  }

  async disablePlugin(pluginId: string): Promise<void> {
    await this.pluginManager.disablePlugin(pluginId);
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    await this.pluginManager.reloadPlugin(pluginId);
  }

  async emit(type: string, payload: unknown, source = "kernel"): Promise<RuntimeEvent> {
    const event = this.eventBus.createEvent(type, source, payload);
    this.telemetry.recordEvent(event);
    await this.eventBus.emit(event);
    return event;
  }

  on(type: string, handler: EventHandler): () => void {
    return this.eventBus.subscribe(type, handler);
  }

  async boot(): Promise<void> {
    if (this.booting || this.state === "ready") return;
    this.booting = true;
    const bootStart = Date.now();
    this.state = "booting";
    this.lifecycle = "starting";

    this.logger.info("Runtime kernel booting", "kernel", { runtimeId: this.id });

    try {
      await this.configManager.initialize({ kernel: this });
      await this.sessionManager.initialize({
        runtimeId: this.id,
        sessionId: `${Date.now()}`,
      });

      await this.diagnostics.initialize({ kernel: this });
      await this.telemetry.initialize({ kernel: this });
      await this.logger.initialize({ kernel: this });
      await this.healthMonitor.initialize({ kernel: this });
      await this.pluginManager.initialize({ kernel: this });

      // Register any default subsystems before booting.
      // Built-in subsystems are added by getRuntime in kernel/index.ts.

      const report = this.dependencyGraph.build(this.registry.getAll());
      const reportText = this.dependencyGraph.formatReport(report);

      if (!report.valid) {
        this.logger.error(`Runtime kernel boot failed: dependency graph is invalid`, "kernel");
        this.logger.error(reportText, "kernel");
        throw new Error(`Runtime kernel boot failed:\n${reportText}`);
      }

      this.logger.info("Runtime Boot Report\n" + reportText, "kernel");

      const order = report.order;

      this.state = "initializing";
      for (const id of order) {
        const subsystem = this.registry.get(id);
        if (!subsystem) continue;
        try {
          await subsystem.initialize({ kernel: this });
          await subsystem.start();
          this.logger.info(`Subsystem ${id} started`, "kernel");
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          subsystem.lastError = message;
          subsystem.healthy = false;
          this.logger.error(`Subsystem ${id} failed to start: ${message}`, "kernel");
          this.telemetry.recordError();
        }
      }

      await this.healthMonitor.start();
      await this.runHealthCheck();

      this.bootedAt = Date.now();
      this.telemetry.recordBoot(this.bootedAt - bootStart);
      this.state = "ready";
      this.lifecycle = "running";
      this.logger.info("Runtime kernel ready", "kernel", { bootTimeMs: this.bootedAt - bootStart });
      await this.emit("kernel:ready", { runtimeId: this.id, bootTimeMs: this.bootedAt - bootStart }, "kernel");
    } catch (error) {
      this.state = "error";
      this.lifecycle = "error";
      this.logger.error(`Kernel boot failed: ${String(error)}`, "kernel");
      throw error;
    } finally {
      this.booting = false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.state = "stopping";
    this.lifecycle = "stopping";
    this.logger.info("Runtime kernel shutting down", "kernel");

    await this.healthMonitor.stop();

    this.dependencyGraph.build(this.registry.getAll());
    const order = this.dependencyGraph.resolveOrder().reverse();

    for (const id of order) {
      const subsystem = this.registry.get(id);
      if (!subsystem) continue;
      try {
        await subsystem.shutdown();
      } catch (error) {
        this.logger.error(`Error during shutdown of ${id}: ${String(error)}`, "kernel");
      }
    }

    this.telemetry.recordShutdown();
    this.state = "stopped";
    this.lifecycle = "stopped";
    this.shuttingDown = false;
    this.logger.info("Runtime kernel stopped", "kernel");
    await this.emit("kernel:stopped", { runtimeId: this.id }, "kernel");
  }

  async restart(): Promise<void> {
    this.state = "restarting";
    this.lifecycle = "starting";
    this.telemetry.recordRestart();
    this.logger.info("Runtime kernel restarting", "kernel");
    await this.shutdown();
    await this.boot();
    await this.emit("kernel:restarted", { runtimeId: this.id }, "kernel");
  }

  async pause(): Promise<void> {
    this.state = "paused";
    this.lifecycle = "paused";
    for (const subsystem of this.registry.getAll()) {
      await subsystem.pause();
    }
    await this.emit("kernel:paused", { runtimeId: this.id }, "kernel");
  }

  async resume(): Promise<void> {
    this.state = "ready";
    this.lifecycle = "running";
    for (const subsystem of this.registry.getAll()) {
      await subsystem.resume();
    }
    await this.emit("kernel:resumed", { runtimeId: this.id }, "kernel");
  }

  async restartSubsystem(subsystemId: string): Promise<void> {
    const subsystem = this.registry.get(subsystemId);
    if (!subsystem) return;
    this.state = "recovering";
    this.logger.info(`Restarting subsystem ${subsystemId}`, "kernel");
    try {
      await subsystem.restart();
      subsystem.healthy = true;
      subsystem.lastError = null;
      await this.emit("kernel:subsystem-restarted", { subsystemId }, "kernel");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      subsystem.lastError = message;
      subsystem.healthy = false;
      this.logger.error(`Failed to restart subsystem ${subsystemId}: ${message}`, "kernel");
      this.telemetry.recordError();
    } finally {
      this.state = "ready";
    }
  }

  private async runHealthCheck(): Promise<void> {
    for (const subsystem of this.registry.getAll()) {
      try {
        const report = await subsystem.healthCheck();
        subsystem.healthy = report.healthy;
        await this.diagnostics.updateHealth(subsystem.id, report);
      } catch (error) {
        subsystem.healthy = false;
        this.logger.error(`Health check failed for ${subsystem.id}: ${String(error)}`, "kernel");
      }
    }
  }

  getStatus(): RuntimeStatus {
    const uptimeMs = this.bootedAt ? Date.now() - this.bootedAt : 0;
    return {
      state: this.state,
      lifecycle: this.lifecycle,
      startedAt: this.bootedAt,
      uptimeMs,
      subsystems: this.registry.getAll().map((s) => s.getStatus()),
      metrics: this.telemetry.getMetrics(),
      session: this.getSession(),
    };
  }

  getSession(): SessionSnapshot | null {
    return this.sessionManager.getActiveSessionSnapshot();
  }

  getConfig(): RuntimeConfig {
    return this.configManager.getAll();
  }

  getLogs(): RuntimeLog[] {
    return this.logger.getLogs();
  }

  getDiagnostics(): Record<string, unknown> {
    return {
      state: this.state,
      lifecycle: this.lifecycle,
      subsystems: this.registry.getAll().map((s) => s.getDiagnostics()),
      telemetry: this.telemetry.getDiagnostics(),
      diagnostics: this.diagnostics.getDiagnostics(),
      session: this.sessionManager.getDiagnostics(),
      config: this.configManager.getDiagnostics(),
      eventBus: this.eventBus.getDiagnostics(),
    };
  }

  getRegistry(): RuntimeRegistry {
    return this.registry;
  }

  getDependencyGraph(): DependencyGraph {
    return this.dependencyGraph;
  }
}
