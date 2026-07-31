// d:\netsyra\src\app\api\ide\terminal\route.ts
import { NextRequest, NextResponse } from "next/server";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// --- Persistent shell sessions ---
interface TerminalSession {
  id: string;
  shell: ChildProcessWithoutNullStreams;
  // Pending output buffer for polling
  buffer: string;
  // Listeners for streaming mode
  listeners: Array<(data: string) => void>;
  createdAt: number;
  cwd: string;
}

const sessions = new Map<string, TerminalSession>();

// Clean up idle sessions after 30 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000;
function cleanupIdleSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TIMEOUT && session.listeners.length === 0) {
      try {
        session.shell.kill();
      } catch {}
      sessions.delete(id);
    }
  }
}
setInterval(cleanupIdleSessions, 5 * 60 * 1000);

function createSession(cwd: string): string {
  const id = `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const isWindows = process.platform === "win32";
  const shellCmd = isWindows ? "cmd.exe" : "/bin/bash";
  const args = isWindows ? ["/k"] : ["-i"];

  let shell: ChildProcessWithoutNullStreams;
  try {
    shell = spawn(shellCmd, args, {
      cwd,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        FORCE_COLOR: "1",
        COLORTERM: "truecolor",
      },
      shell: false,
    });
  } catch {
    // Fallback to sh if bash is not available
    shell = spawn("sh", ["-i"], {
      cwd,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        FORCE_COLOR: "1",
        COLORTERM: "truecolor",
      },
      shell: false,
    });
  }

  const session: TerminalSession = {
    id,
    shell,
    buffer: "",
    listeners: [],
    createdAt: Date.now(),
    cwd,
  };

  shell.stdout.on("data", (data: Buffer) => {
    const text = data.toString();
    session.buffer += text;
    session.listeners.forEach((fn) => fn(text));
  });

  shell.stderr.on("data", (data: Buffer) => {
    const text = data.toString();
    session.buffer += text;
    session.listeners.forEach((fn) => fn(text));
  });

  shell.on("exit", (code) => {
    const exitMsg = `\r\n[Process exited with code ${code}]\r\n`;
    session.buffer += exitMsg;
    session.listeners.forEach((fn) => fn(exitMsg));
    sessions.delete(id);
  });

  sessions.set(id, session);
  return id;
}

// --- POST: create session or send input ---
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "create";

  if (action === "create") {
    let body: { cwd?: string } = {};
    try {
      body = await request.json();
    } catch {}
    const cwd = body.cwd || process.cwd();
    const id = createSession(cwd);
    return NextResponse.json({ id, cwd });
  }

  if (action === "input") {
    let body: { id: string; data: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const session = sessions.get(body.id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    try {
      session.shell.stdin.write(body.data);
      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "resize") {
    try {
      await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    // node-pty would handle resize; with child_process we can't resize the pty.
    // This is a no-op but we accept it for compatibility.
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// --- GET: stream output from a session ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }
  const session = sessions.get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let streamListener: ((data: string) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send any buffered output first
      if (session.buffer) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "data", data: session.buffer }) + "\n"));
        session.buffer = "";
      }

      const listener = (data: string) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify({ type: "data", data }) + "\n"));
        } catch {
          // controller already closed
        }
      };
      streamListener = listener;
      session.listeners.push(listener);
    },
    cancel() {
      if (streamListener && session) {
        session.listeners = session.listeners.filter((l) => l !== streamListener);
        streamListener = null;
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

// --- DELETE: kill a session ---
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }
  const session = sessions.get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  try {
    session.shell.kill();
  } catch {}
  sessions.delete(id);
  return NextResponse.json({ ok: true });
}
