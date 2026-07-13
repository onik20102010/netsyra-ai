import { setupRuntime } from "@/ide/runtime";
import { StreamingEngine } from "@/ide/subsystems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const runtime = await setupRuntime();
  const streaming = runtime.getSubsystem("streaming-engine") as StreamingEngine | undefined;

  if (!streaming) {
    return new Response("Streaming engine not available", { status: 503 });
  }

  const stream = streaming.subscribe();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
