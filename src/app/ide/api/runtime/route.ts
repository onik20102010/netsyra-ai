import { NextRequest, NextResponse } from "next/server";
import { setupRuntime } from "@/ide/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const runtime = await setupRuntime();
  return NextResponse.json(runtime.getStatus());
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const runtime = await setupRuntime();

  try {
    const body = (await request.json()) as { action: string; payload?: unknown };
    const { action, payload } = body;

    switch (action) {
      case "boot":
        await runtime.boot();
        break;
      case "shutdown":
        await runtime.shutdown();
        break;
      case "restart":
        await runtime.restart();
        break;
      case "pause":
        await runtime.pause();
        break;
      case "resume":
        await runtime.resume();
        break;
      case "emit": {
        const emitPayload = payload as { type?: string; payload?: unknown } | undefined;
        await runtime.emit(emitPayload?.type ?? "kernel:action", emitPayload?.payload ?? {}, "ui");
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(runtime.getStatus());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
