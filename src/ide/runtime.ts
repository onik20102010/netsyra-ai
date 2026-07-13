import { getRuntime } from "./kernel";
import { createDefaultSubsystems } from "./subsystems";
import type { RuntimeKernel } from "./kernel";

let booted = false;

export async function setupRuntime(): Promise<RuntimeKernel> {
  const runtime = getRuntime();

  if (booted && runtime.state === "ready") {
    return runtime;
  }

  await createDefaultSubsystems(runtime);
  await runtime.boot();
  booted = true;
  return runtime;
}
