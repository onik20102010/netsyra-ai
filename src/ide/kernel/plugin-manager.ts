import type { RuntimeEvent, SubsystemConfig } from "@/ide/types";
import { BaseSubsystem } from "./subsystem";
import type { IPlugin, IRuntimeKernel } from "./types";

export class PluginManager extends BaseSubsystem {
  private plugins = new Map<string, IPlugin>();
  private kernel: IRuntimeKernel | null = null;

  constructor() {
    super({
      id: "plugin-manager",
      name: "Plugin Manager",
      version: "1.0.0",
      capabilities: ["plugins", "extensions"],
    });
  }

  async initialize(config?: Record<string, unknown>): Promise<void> {
    await super.initialize(config);
    this.kernel = (config?.kernel as IRuntimeKernel) ?? null;
  }

  async registerPlugin(plugin: IPlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered.`);
    }
    this.plugins.set(plugin.id, plugin);
    if (plugin.enabled && this.kernel) {
      await plugin.activate(this.kernel);
      await this.kernel.emit("plugin:activated", { pluginId: plugin.id }, "plugin-manager");
    }
  }

  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin && this.kernel) {
      await plugin.deactivate(this.kernel);
      await this.kernel.emit("plugin:deactivated", { pluginId }, "plugin-manager");
    }
    this.plugins.delete(pluginId);
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found.`);
    if (plugin.enabled) return;
    plugin.enabled = true;
    if (this.kernel) {
      await plugin.activate(this.kernel);
      await this.kernel.emit("plugin:enabled", { pluginId }, "plugin-manager");
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found.`);
    if (!plugin.enabled) return;
    plugin.enabled = false;
    if (this.kernel) {
      await plugin.deactivate(this.kernel);
      await this.kernel.emit("plugin:disabled", { pluginId }, "plugin-manager");
    }
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found.`);
    if (this.kernel && plugin.enabled) {
      await plugin.deactivate(this.kernel);
      await plugin.activate(this.kernel);
      await this.kernel.emit("plugin:reloaded", { pluginId }, "plugin-manager");
    }
  }

  getPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): IPlugin | undefined {
    return this.plugins.get(id);
  }

  async updatePlugin(pluginId: string, config?: SubsystemConfig): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      await plugin.update(config);
    }
  }

  onEvent(_event: RuntimeEvent): void {
    // Plugins can be reloaded or disabled based on runtime events if needed.
  }
}
