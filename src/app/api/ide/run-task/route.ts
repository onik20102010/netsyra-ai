// d:\netsyra\src\app\api\ide\run-task\route.ts
import { NextRequest, NextResponse } from "next/server";
import { spawn, type ChildProcess } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Track running processes so we can cancel them
const runningProcesses = new Map<string, ChildProcess>();

interface TaskRequestBody {
  task: "build" | "typecheck" | "lint" | "dev" | "custom";
  command?: string;
  args?: string[];
  cwd?: string;
}

const TASK_COMMANDS: Record<string, { command: string; args: string[]; label: string }> = {
  build: { command: "npm", args: ["run", "build"], label: "npm run build" },
  typecheck: { command: "npx", args: ["tsc", "--noEmit"], label: "tsc --noEmit" },
  lint: { command: "npm", args: ["run", "lint"], label: "npm run lint" },
  dev: { command: "npm", args: ["run", "dev"], label: "npm run dev" },
};

export async function POST(request: NextRequest) {
  let body: TaskRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { task, command, args, cwd } = body;

  // Resolve command
  let cmd: string;
  let cmdArgs: string[];
  let label: string;

  if (task === "custom" && command) {
    cmd = command;
    cmdArgs = args || [];
    label = `${command} ${cmdArgs.join(" ")}`;
  } else {
    const preset = TASK_COMMANDS[task];
    if (!preset) {
      return NextResponse.json({ error: `Unknown task: ${task}` }, { status: 400 });
    }
    cmd = preset.command;
    cmdArgs = preset.args;
    label = preset.label;
  }

  // Resolve working directory — default to project root
  const workDir = cwd || path.resolve(process.cwd());

  // Use a unique task ID for cancellation
  const taskId = `${task}-${Date.now()}`;

  // Stream output via SSE-like readable stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify({ type, ...data }) + "\n"));
      };

      send("start", { taskId, command: label, cwd: workDir });

      let child: ChildProcess;
      try {
        // On Windows, npm/npx need to run via cmd shell
        const isWindows = process.platform === "win32";
        if (isWindows && (cmd === "npm" || cmd === "npx")) {
          child = spawn("cmd", ["/c", cmd, ...cmdArgs], {
            cwd: workDir,
            env: { ...process.env, FORCE_COLOR: "0" },
            shell: false,
          });
        } else {
          child = spawn(cmd, cmdArgs, {
            cwd: workDir,
            env: { ...process.env, FORCE_COLOR: "0" },
            shell: true,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        send("error", { message: `Failed to spawn process: ${message}` });
        send("done", { exitCode: -1 });
        controller.close();
        return;
      }

      runningProcesses.set(taskId, child);

      child.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        send("stdout", { text });
      });

      child.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        send("stderr", { text });
      });

      child.on("error", (err: Error) => {
        send("error", { message: err.message });
      });

      child.on("close", (code: number | null) => {
        runningProcesses.delete(taskId);
        send("done", { exitCode: code ?? 0 });
        controller.close();
      });
    },
    cancel() {
      // Stream cancelled by client — kill the process
      const child = runningProcesses.get(taskId);
      if (child) {
        child.kill("SIGTERM");
        runningProcesses.delete(taskId);
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

// Cancel a running task
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }
  const child = runningProcesses.get(taskId);
  if (child) {
    child.kill("SIGTERM");
    runningProcesses.delete(taskId);
    return NextResponse.json({ ok: true, message: `Killed ${taskId}` });
  }
  return NextResponse.json({ ok: false, message: "Task not found" }, { status: 404 });
}
