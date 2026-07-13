import { RuntimeKernel } from "./kernel";

let runtimeInstance: RuntimeKernel | null = null;

export function getRuntime(): RuntimeKernel {
  if (!runtimeInstance) {
    runtimeInstance = new RuntimeKernel();
  }
  return runtimeInstance;
}

export function resetRuntime(): RuntimeKernel {
  runtimeInstance = null;
  return getRuntime();
}

export * from "./types";
export { RuntimeKernel } from "./kernel";
export { BaseSubsystem } from "./subsystem";
export { BasePlugin } from "./plugin";
export { RuntimeEventBus } from "./runtime-event-bus";
