import type {
  RuntimeEvent,
  RuntimeConfig,
  SubsystemConfig,
  SubsystemStatus,
  HealthReport,
  SessionSnapshot,
  RuntimeLog,
  RuntimeState,
  RuntimeStatus,
  SubsystemLifecycle,
} from "@/ide/types";

export type { RuntimeEvent, RuntimeConfig, SubsystemConfig, RuntimeState, RuntimeStatus, SubsystemLifecycle };

export interface SubsystemCapability {
  name: string;
  description?: string;
}

export interface ISubsystem {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  dependencies: string[];
  lifecycle: SubsystemLifecycle;
  healthy: boolean;
  lastError: string | null;

  initialize(config?: SubsystemConfig): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  restart(): Promise<void>;
  stop(): Promise<void>;
  shutdown(): Promise<void>;
  dispose(): Promise<void>;
  healthCheck(): Promise<HealthReport>;
  getStatus(): SubsystemStatus;
  getMetrics(): Record<string, unknown>;
  getDiagnostics(): Record<string, unknown>;
  getConfig(): SubsystemConfig;
  setConfig(config: SubsystemConfig): Promise<void>;
  onEvent(event: RuntimeEvent): Promise<void> | void;
}

export interface IPlugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  capabilities: string[];

  activate(kernel: IRuntimeKernel): Promise<void> | void;
  deactivate(kernel: IRuntimeKernel): Promise<void> | void;
  update(config?: SubsystemConfig): Promise<void> | void;
}

export interface IRuntimeKernel {
  id: string;
  state: RuntimeState;
  lifecycle: SubsystemLifecycle;

  register(subsystem: ISubsystem): Promise<void>;
  unregister(subsystemId: string): Promise<void>;
  getSubsystem(id: string): ISubsystem | undefined;
  getSubsystems(): ISubsystem[];
  getSubsystemsByCapability(capability: string): ISubsystem[];

  registerPlugin(plugin: IPlugin): Promise<void>;
  unregisterPlugin(pluginId: string): Promise<void>;
  enablePlugin(pluginId: string): Promise<void>;
  disablePlugin(pluginId: string): Promise<void>;
  reloadPlugin(pluginId: string): Promise<void>;

  emit(type: string, payload: unknown, source?: string): Promise<RuntimeEvent>;
  on(type: string, handler: EventHandler): () => void;

  boot(): Promise<void>;
  shutdown(): Promise<void>;
  restart(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;

  getStatus(): RuntimeStatus;
  getSession(): SessionSnapshot | null;
  getConfig(): RuntimeConfig;
  getLogs(): RuntimeLog[];
  getDiagnostics(): Record<string, unknown>;
}

export type EventHandler = (event: RuntimeEvent) => void | Promise<void>;

export interface IEventBus {
  emit(event: RuntimeEvent): Promise<void>;
  subscribe(type: string, handler: EventHandler): () => void;
  subscribeAll(handler: EventHandler): () => void;
  getHistory(limit?: number): RuntimeEvent[];
  createEvent(init: unknown): RuntimeEvent;
}

export interface IRuntimeRegistry {
  register(subsystem: ISubsystem): void;
  unregister(id: string): void;
  get(id: string): ISubsystem | undefined;
  getAll(): ISubsystem[];
  getByCapability(capability: string): ISubsystem[];
  has(id: string): boolean;
  clear(): void;
}
