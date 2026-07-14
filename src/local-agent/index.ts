/**
 * Netsyra Local Agent
 *
 * A standalone Node.js/WebSocket server that runs on the user's computer and
 * exposes the Netsyra runtime, workspace, and terminal to the browser IDE.
 *
 * Start with:
 *   npm run agent
 *
 * Protocol:
 *   { action: string, payload?: unknown, id?: string }
 *   { type: "status", status: RuntimeStatus }
 *   { type: "event", event: RuntimeEvent }
 *   { type: "terminal", id: string, output: string, done?: boolean }
 *   { type: "result", id: string, result: unknown }
 *   { type: "error", id: string, error: string }
 */

import { spawn, type ChildProcess } from "child_process";
import { readFileSync, existsSync } from "fs";
import https from "https";
import type { IncomingMessage } from "http";
import path from "path";
import { randomUUID, randomBytes } from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { setupRuntime } from "@/ide/runtime";
import { WorkspaceEngine } from "@/ide/workspace";
import type { RuntimeKernel } from "@/ide/kernel";
import type { RuntimeEvent } from "@/ide/types";
import type { SearchQuery } from "@/ide/workspace/types";

const PORT = Number(process.env.AGENT_PORT || process.env.PORT || 3001);
const HOST = process.env.AGENT_HOST || "127.0.0.1";
const ALLOWED_ORIGINS = new Set(
  (process.env.AGENT_ALLOWED_ORIGINS || "https://www.netsyraai.com,http://localhost:3000,http://localhost:3001").split(",")
);
const TLS_CERT = process.env.AGENT_TLS_CERT;
const TLS_KEY = process.env.AGENT_TLS_KEY;
const AGENT_TOKEN = process.env.AGENT_TOKEN || randomBytes(32).toString("hex");
const LOCAL_ORIGINS = new Set(["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]);

interface AgentMessage {
  id?: string;
  action: string;
  payload?: unknown;
}

interface AgentResponse {
  id?: string;
  type: string;
  [key: string]: unknown;
}

function getWorkspace(runtime: RuntimeKernel): WorkspaceEngine | null {
  const subsystem = runtime.getSubsystem("workspace-engine");
  return subsystem ? (subsystem as WorkspaceEngine) : null;
}

function send(ws: WebSocket, message: AgentResponse) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

async function main() {
  const runtime = await setupRuntime();
  const workspace = getWorkspace(runtime);

  const wsOptions = {
    verifyClient: (info: { origin: string; secure: boolean; req: IncomingMessage }) => {
      const origin = info.origin;
      if (origin && !ALLOWED_ORIGINS.has(origin) && !ALLOWED_ORIGINS.has("*")) {
        return false;
      }
      // Only allow insecure ws:// from local dev origins or explicitly allowed origins.
      if (!info.secure && origin && !LOCAL_ORIGINS.has(origin) && !ALLOWED_ORIGINS.has(origin)) {
        return false;
      }
      const reqUrl = new URL(info.req.url ?? "", "http://localhost");
      const token = reqUrl.searchParams.get("token");
      return token === AGENT_TOKEN;
    },
  };

  let projectRoot: string = process.cwd();

  let server: https.Server | undefined;
  let wss: WebSocketServer;
  if (TLS_CERT && TLS_KEY) {
    if (!existsSync(TLS_CERT) || !existsSync(TLS_KEY)) {
      console.error("[netsyra-agent] fatal: TLS certificate files not found.");
      console.error("AGENT_TLS_CERT:", TLS_CERT);
      console.error("AGENT_TLS_KEY:", TLS_KEY);
      console.error("Generate them with: mkcert -install && mkcert 127.0.0.1");
      process.exit(1);
    }
    server = https.createServer({
      cert: readFileSync(TLS_CERT),
      key: readFileSync(TLS_KEY),
    });
    wss = new WebSocketServer({ server, ...wsOptions });
    server.on("error", (err) => {
      console.error(`[netsyra-agent] server error: ${err.message}`);
      if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Run with a different AGENT_PORT or kill the process using port ${PORT}.`);
      }
    });
    server.listen(PORT, HOST);
  } else {
    wss = new WebSocketServer({ port: PORT, host: HOST, ...wsOptions });
    wss.on("error", (err) => {
      console.error(`[netsyra-agent] server error: ${err.message}`);
      if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Run with a different AGENT_PORT or kill the process using port ${PORT}.`);
      }
    });
  }

  const clients = new Set<WebSocket>();
  const runningCommands = new Map<string, ChildProcess>();

  const broadcast = (message: AgentResponse) => {
    for (const ws of clients) {
      send(ws, message);
    }
  };

  // Forward runtime events to all connected clients.
  const eventBus = runtime.getSubsystem("runtime-event-bus");
  if (eventBus && "subscribeAll" in eventBus) {
    (eventBus as { subscribeAll: (handler: (event: RuntimeEvent) => void) => () => void }).subscribeAll(
      (event: RuntimeEvent) => {
        broadcast({ type: "event", event: { type: event.type, payload: event.payload, timestamp: event.timestamp } });
      }
    );
  }

  wss.on("connection", (ws) => {
    clients.add(ws);
    send(ws, { type: "status", status: runtime.getStatus() });

    ws.on("message", async (raw) => {
      const text = raw.toString();
      let msg: AgentMessage;
      try {
        msg = JSON.parse(text) as AgentMessage;
      } catch {
        send(ws, { type: "error", id: undefined, error: "Invalid JSON" });
        return;
      }

      const { id = randomUUID(), action, payload = {} } = msg;
      const p = payload as Record<string, unknown>;

      try {
        switch (action) {
          case "get-status": {
            send(ws, { id, type: "result", result: runtime.getStatus() });
            break;
          }

          case "boot": {
            await runtime.boot();
            send(ws, { id, type: "result", result: runtime.getStatus() });
            break;
          }

          case "shutdown": {
            await runtime.shutdown();
            send(ws, { id, type: "result", result: runtime.getStatus() });
            break;
          }

          case "restart": {
            await runtime.restart();
            send(ws, { id, type: "result", result: runtime.getStatus() });
            break;
          }

          case "open-project": {
            if (!workspace) throw new Error("Workspace engine not available");
            const openPath = typeof p.path === "string" ? p.path : "";
            const project = await workspace.openProject(openPath);
            projectRoot = project.root;
            send(ws, { id, type: "result", result: project });
            break;
          }

          case "close-project": {
            if (!workspace) throw new Error("Workspace engine not available");
            await workspace.closeProject();
            projectRoot = process.cwd();
            send(ws, { id, type: "result", result: { closed: true } });
            break;
          }

          case "read-file": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const content = await workspace.readFile(path);
            send(ws, { id, type: "result", result: { content } });
            break;
          }

          case "write-file": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const content = typeof p.content === "string" ? p.content : "";
            await workspace.writeFile(path, content, typeof p.source === "string" ? p.source : "agent");
            send(ws, { id, type: "result", result: { written: true } });
            break;
          }

          case "create-file": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const content = typeof p.content === "string" ? p.content : "";
            const node = await workspace.createFile(path, content);
            send(ws, { id, type: "result", result: { node } });
            break;
          }

          case "create-folder": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const node = await workspace.createFolder(path);
            send(ws, { id, type: "result", result: { node } });
            break;
          }

          case "rename-file": {
            if (!workspace) throw new Error("Workspace engine not available");
            const oldPath = typeof p.oldPath === "string" ? p.oldPath : "";
            const newPath = typeof p.newPath === "string" ? p.newPath : "";
            await workspace.renameFile(oldPath, newPath);
            send(ws, { id, type: "result", result: { renamed: true } });
            break;
          }

          case "move-file": {
            if (!workspace) throw new Error("Workspace engine not available");
            const oldPath = typeof p.oldPath === "string" ? p.oldPath : "";
            const newPath = typeof p.newPath === "string" ? p.newPath : "";
            await workspace.moveFile(oldPath, newPath);
            send(ws, { id, type: "result", result: { moved: true } });
            break;
          }

          case "delete-file": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const hard = p.hard === true;
            await workspace.deleteFile(path, hard);
            send(ws, { id, type: "result", result: { deleted: true } });
            break;
          }

          case "delete-folder": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const hard = p.hard === true;
            await workspace.deleteFolder(path, hard);
            send(ws, { id, type: "result", result: { deleted: true } });
            break;
          }

          case "copy-file": {
            if (!workspace) throw new Error("Workspace engine not available");
            const sourcePath = typeof p.sourcePath === "string" ? p.sourcePath : "";
            const destPath = typeof p.destPath === "string" ? p.destPath : "";
            await workspace.copyFile(sourcePath, destPath);
            send(ws, { id, type: "result", result: { copied: true } });
            break;
          }

          case "search": {
            if (!workspace) throw new Error("Workspace engine not available");
            const query: SearchQuery = {
              text: typeof p.text === "string" ? p.text : "",
              mode: (p.mode as SearchQuery["mode"] | undefined) ?? "all",
              regex: p.regex === true,
              caseSensitive: p.caseSensitive === true,
            };
            const results = await workspace.search(query);
            send(ws, { id, type: "result", result: { results } });
            break;
          }

          case "get-symbols": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const symbols = workspace.getSymbols(path);
            send(ws, { id, type: "result", result: { symbols } });
            break;
          }

          case "get-summary": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const summary = workspace.getSummary(path);
            send(ws, { id, type: "result", result: { summary } });
            break;
          }

          case "get-diagnostics": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const diagnostics = workspace.getFileDiagnostics(path);
            send(ws, { id, type: "result", result: { diagnostics } });
            break;
          }

          case "set-diagnostics": {
            if (!workspace) throw new Error("Workspace engine not available");
            const path = typeof p.path === "string" ? p.path : "";
            const diagnostics = Array.isArray(p.diagnostics) ? p.diagnostics : [];
            workspace.setFileDiagnostics(path, diagnostics as import("@/ide/workspace/types").Diagnostic[]);
            send(ws, { id, type: "result", result: { diagnostics } });
            break;
          }

          case "get-git": {
            if (!workspace) throw new Error("Workspace engine not available");
            const git = workspace.getGitInfo();
            send(ws, { id, type: "result", result: { git } });
            break;
          }

          case "get-status": {
            if (!workspace) throw new Error("Workspace engine not available");
            const snapshot = workspace.getSnapshot();
            send(ws, { id, type: "result", result: { snapshot } });
            break;
          }

          case "get-tree": {
            if (!workspace) throw new Error("Workspace engine not available");
            const tree = workspace.getTreeSnapshot();
            send(ws, { id, type: "result", result: { tree } });
            break;
          }

          case "run-command": {
            const command = typeof p.command === "string" ? p.command : "";
            const args = Array.isArray(p.args) ? p.args.map(String) : [];
            if (!command) {
              send(ws, { id, type: "error", error: "Missing command" });
              break;
            }
            if (!projectRoot) {
              send(ws, { id, type: "error", error: "No project open; open a workspace before running commands" });
              break;
            }

            const rawCwd = typeof p.cwd === "string" && p.cwd ? p.cwd : projectRoot;
            const resolvedCwd = path.resolve(projectRoot, rawCwd);
            const withinRoot = resolvedCwd === projectRoot || resolvedCwd.startsWith(`${projectRoot}${path.sep}`);
            if (!withinRoot) {
              send(ws, { id, type: "error", error: "Working directory is outside the selected project" });
              break;
            }

            const cmdId = id;
            const shells = ["cmd", "powershell", "pwsh"];
            const shell = typeof p.shell === "string" && shells.includes(p.shell) ? p.shell : "cmd";
            if (command.length > 4096) {
              send(ws, { id, type: "error", error: "Command too long" });
              break;
            }
            let proc: ReturnType<typeof spawn>;

            if (shell === "powershell" || shell === "pwsh") {
              proc = spawn(shell, ["-NoProfile", "-Command", command], { cwd: resolvedCwd, env: process.env });
            } else {
              proc = spawn(command, { cwd: resolvedCwd, shell: true, env: process.env });
            }

            runningCommands.set(cmdId, proc);

            proc.stdout?.on("data", (data: Buffer) => {
              send(ws, { id: cmdId, type: "terminal", output: data.toString("utf-8"), done: false });
            });

            proc.stderr?.on("data", (data: Buffer) => {
              send(ws, { id: cmdId, type: "terminal", output: data.toString("utf-8"), done: false });
            });

            proc.on("error", (err) => {
              send(ws, { id: cmdId, type: "terminal", output: `Error: ${err.message}`, done: false });
              runningCommands.delete(cmdId);
            });

            proc.on("close", (code) => {
              send(ws, { id: cmdId, type: "terminal", output: `\n(exit code: ${code ?? 0})`, done: true });
              runningCommands.delete(cmdId);
            });

            send(ws, { id: cmdId, type: "result", result: { started: true, pid: proc.pid } });
            break;
          }

          case "stop-command": {
            const cmdId = typeof p.id === "string" ? p.id : id;
            const proc = runningCommands.get(cmdId);
            if (proc) {
              proc.kill("SIGTERM");
              runningCommands.delete(cmdId);
              send(ws, { id: cmdId, type: "result", result: { stopped: true } });
            } else {
              send(ws, { id: cmdId, type: "result", result: { stopped: false, reason: "not found" } });
            }
            break;
          }

          default:
            send(ws, { id, type: "error", error: `Unknown action: ${action}` });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send(ws, { id, type: "error", error: message });
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      for (const [cmdId, proc] of runningCommands) {
        if (proc.killed) continue;
        proc.kill("SIGTERM");
        runningCommands.delete(cmdId);
      }
    });
  });

  const scheme = server ? "wss" : "ws";
  console.log(`Netsyra Agent listening on ${scheme}://${HOST}:${PORT}`);
  console.log(`Agent token: ${AGENT_TOKEN}`);
  console.log(`Run with: npm run agent`);
}

main().catch((err) => {
  console.error("[netsyra-agent] fatal:", err);
  process.exit(1);
});
