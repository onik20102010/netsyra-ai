// d:\netsyra\src\app\api\ide\debug\route.ts
import { NextRequest, NextResponse } from "next/server";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const runningDebugs = new Map<string, ChildProcess>();

interface DebugStartBody {
  type: "node" | "next" | "script";
  program?: string; // path to script (for "node" / "script")
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "start";

  if (action === "start") {
    let body: DebugStartBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { type, program, args, cwd, env } = body;
    const workDir = cwd || path.resolve(process.cwd());

    let cmd: string;
    let cmdArgs: string[];

    if (type === "node" && program) {
      // Run with node --inspect-brk to allow debugger to attach
      cmd = "node";
      cmdArgs = ["--inspect-brk=9229", program, ...(args || [])];
    } else if (type === "next") {
      cmd = "npm";
      cmdArgs = ["run", "dev"];
    } else if (type === "script" && program) {
      cmd = "npm";
      cmdArgs = ["run", program, ...(args || [])];
    } else {
      return NextResponse.json({ error: "Invalid debug configuration" }, { status: 400 });
    }

    const debugId = `debug-${Date.now()}`;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const send = (type: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(JSON.stringify({ type, ...data }) + "\n"));
        };

        send("status", { status: "running", debugId });

        let child: ChildProcess;
        try {
          const isWindows = process.platform === "win32";
          if (isWindows && (cmd === "npm" || cmd === "npx")) {
            child = spawn("cmd", ["/c", cmd, ...cmdArgs], {
              cwd: workDir,
              env: { ...process.env, ...env, FORCE_COLOR: "0" },
              shell: false,
            });
          } else {
            child = spawn(cmd, cmdArgs, {
              cwd: workDir,
              env: { ...process.env, ...env, FORCE_COLOR: "0" },
              shell: false,
            });
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          send("error", { message: `Failed to spawn: ${message}` });
          send("status", { status: "terminated" });
          controller.close();
          return;
        }

        runningDebugs.set(debugId, child);

        // Parse stderr for inspector messages and stack traces
        child.stderr?.on("data", (data: Buffer) => {
          const text = data.toString();
          // Node inspector prints "Debugger listening on ws://..." and "Debugger attached."
          if (text.includes("Debugger listening")) {
            send("debuggerAttached", { message: text.trim() });
          }
          if (text.includes("Debugger attached")) {
            send("debuggerReady", { message: text.trim() });
          }
          send("stderr", { text });
        });

        child.stdout?.on("data", (data: Buffer) => {
          const text = data.toString();
          // Parse console output for simple variable inspection
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              send("stdout", { line });
            }
          }
        });

        child.on("error", (err) => {
          send("error", { message: err.message });
        });

        child.on("close", (code) => {
          runningDebugs.delete(debugId);
          send("status", { status: "terminated", exitCode: code });
          controller.close();
        });
      },
      cancel() {
        const child = runningDebugs.get(debugId);
        if (child) {
          child.kill("SIGTERM");
          runningDebugs.delete(debugId);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  }

  if (action === "stop") {
    const { searchParams } = new URL(request.url);
    const debugId = searchParams.get("debugId");
    if (!debugId) {
      return NextResponse.json({ error: "Missing debugId" }, { status: 400 });
    }
    const child = runningDebugs.get(debugId);
    if (child) {
      child.kill("SIGTERM");
      runningDebugs.delete(debugId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, message: "Debug session not found" }, { status: 404 });
  }

  // List available launch configurations from package.json + .vscode/launch.json
  if (action === "configs") {
    const configs: Array<{ name: string; type: string; program?: string; request: string }> = [];
    try {
      const pkgPath = path.resolve(process.cwd(), "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.scripts) {
        for (const [name] of Object.entries(pkg.scripts)) {
          configs.push({ name: `npm: ${name}`, type: "script", program: name, request: "launch" });
        }
      }
    } catch {}
    // Add default Node debug config
    configs.unshift({ name: "Node: Current File", type: "node", request: "launch" });
    configs.unshift({ name: "Next.js: Dev Server", type: "next", request: "launch" });
    return NextResponse.json({ configs });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  // GET returns available configs
  const configs: Array<{ name: string; type: string; program?: string; request: string }> = [];
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (pkg.scripts) {
      for (const [name] of Object.entries(pkg.scripts)) {
        configs.push({ name: `npm: ${name}`, type: "script", program: name, request: "launch" });
      }
    }
  } catch {}
  configs.unshift({ name: "Node: Current File", type: "node", request: "launch" });
  configs.unshift({ name: "Next.js: Dev Server", type: "next", request: "launch" });
  return NextResponse.json({ configs });
}
