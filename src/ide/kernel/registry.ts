import type { IRuntimeRegistry, ISubsystem } from "./types";

export class RuntimeRegistry implements IRuntimeRegistry {
  private subsystems = new Map<string, ISubsystem>();

  register(subsystem: ISubsystem): void {
    if (this.subsystems.has(subsystem.id)) {
      throw new Error(`Subsystem ${subsystem.id} is already registered.`);
    }
    this.subsystems.set(subsystem.id, subsystem);
  }

  unregister(id: string): void {
    this.subsystems.delete(id);
  }

  get(id: string): ISubsystem | undefined {
    return this.subsystems.get(id);
  }

  getAll(): ISubsystem[] {
    return Array.from(this.subsystems.values());
  }

  getByCapability(capability: string): ISubsystem[] {
    return this.getAll().filter((s) => s.capabilities.includes(capability));
  }

  has(id: string): boolean {
    return this.subsystems.has(id);
  }

  clear(): void {
    this.subsystems.clear();
  }
}
