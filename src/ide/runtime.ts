import { getRuntime } from "./kernel";
import { createDefaultSubsystems } from "./subsystems";
import type { RuntimeKernel } from "./kernel";

let booted = false;
let setupPromise: Promise<RuntimeKernel> | null = null;

async function doSetupRuntime(): Promise<RuntimeKernel> {
  const runtime = getRuntime();

  if (booted && runtime.state === "ready") {
    return runtime;
  }

  await createDefaultSubsystems(runtime);
  await runtime.boot();
  booted = true;
  return runtime;
}

export async function setupRuntime(): Promise<RuntimeKernel> {
  if (!setupPromise) {
    setupPromise = doSetupRuntime().finally(() => {
      setupPromise = null;
    });
  }
  return setupPromise;
}
