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
import { WebSocketServer, WebSocket } from "ws";
import { setupRuntime } from "@/ide/runtime";
import { WorkspaceEngine } from "@/ide/workspace";
import type { RuntimeKernel } from "@/ide/kernel";
import type { RuntimeEvent } from "@/ide/types";
import type { SearchQuery } from "@/ide/workspace/types";

const PORT = Number(process.env.AGENT_PORT || process.env.PORT || 3001);
const ALLOWED_ORIGINS = new Set(
  (process.env.AGENT_ALLOWED_ORIGINS || "https://www.netsyraai.com,http://localhost:3000,http://localhost:3001").split(",")
);

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

  const wss = new WebSocketServer({
    port: PORT,
    verifyClient: (info: { origin: string }) => {
      const origin = info.origin;
      if (!origin) return true;
      return ALLOWED_ORIGINS.has(origin) || ALLOWED_ORIGINS.has("*");
    },
  });

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

      const { id = crypto.randomUUID(), action, payload = {} } = msg;
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
            const path = typeof p.path === "string" ? p.path : "";
            const project = await workspace.openProject(path);
            send(ws, { id, type: "result", result: project });
            break;
          }

          case "close-project": {
            if (!workspace) throw new Error("Workspace engine not available");
            await workspace.closeProject();
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
            const cwd = typeof p.cwd === "string" ? p.cwd : process.cwd();
            if (!command) {
              send(ws, { id, type: "error", error: "Missing command" });
              break;
            }

            const cmdId = id;
            const proc =
              args.length > 0
                ? spawn(command, args, { cwd, shell: false, env: process.env })
                : spawn(command, { cwd, shell: true, env: process.env });

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

  console.log(`Netsyra Agent listening on ws://localhost:${PORT}`);
  console.log(`Run with: npm run agent`);
}

main().catch((err) => {
  console.error("[netsyra-agent] fatal:", err);
  process.exit(1);
});
