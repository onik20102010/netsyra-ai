import type { SubsystemConfig } from "@/ide/types";
import type { IPlugin, IRuntimeKernel } from "./types";

export abstract class BasePlugin implements IPlugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  capabilities: string[] = [];

  constructor(options: {
    id: string;
    name?: string;
    version?: string;
    enabled?: boolean;
    capabilities?: string[];
  }) {
    this.id = options.id;
    this.name = options.name ?? options.id;
    this.version = options.version ?? "0.0.1";
    this.enabled = options.enabled ?? true;
    this.capabilities = options.capabilities ?? [];
  }

  abstract activate(kernel: IRuntimeKernel): Promise<void> | void;

  async deactivate(_kernel: IRuntimeKernel): Promise<void> {
    // Override to clean up resources.
  }

  async update(_config?: SubsystemConfig): Promise<void> {
    // Override to react to configuration changes.
  }
}
