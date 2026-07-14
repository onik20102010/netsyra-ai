import { NextRequest, NextResponse } from "next/server";
import { setupRuntime } from "@/ide/runtime";
import { WorkspaceEngine } from "@/ide/workspace";
import type { SearchQuery } from "@/ide/workspace/types";
import { requireAuth } from "@/lib/supabase/route-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getWorkspace(runtime: Awaited<ReturnType<typeof setupRuntime>>): WorkspaceEngine {
  const subsystem = runtime.getSubsystem("workspace-engine");
  if (!subsystem) {
    throw new Error("Workspace engine not available");
  }
  return subsystem as WorkspaceEngine;
}

export async function GET(): Promise<NextResponse> {
  if (process.env.DISABLE_SERVER_IDE === "true") {
    return NextResponse.json({ error: "Server IDE workspace is disabled" }, { status: 501 });
  }
  const auth = await requireAuth();
  if (auth.error) return auth.error as NextResponse;

  try {
    const runtime = await setupRuntime();
    const workspace = getWorkspace(runtime);
    return NextResponse.json({
      state: workspace.getState(),
      project: workspace.getProject(),
      snapshot: workspace.getSnapshot(),
      tree: workspace.getTreeSnapshot(),
      git: workspace.getGitInfo(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.DISABLE_SERVER_IDE === "true") {
    return NextResponse.json({ error: "Server IDE workspace is disabled" }, { status: 501 });
  }
  const auth = await requireAuth();
  if (auth.error) return auth.error as NextResponse;

  const runtime = await setupRuntime();
  const workspace = getWorkspace(runtime);

  try {
    const body = (await request.json()) as { action: string; payload?: unknown };
    const { action, payload } = body;
    const p = (payload ?? {}) as Record<string, unknown>;

    switch (action) {
      case "open-project": {
        const path = typeof p.path === "string" ? p.path : "";
        const project = await workspace.openProject(path);
        return NextResponse.json({ project });
      }
      case "close-project": {
        await workspace.closeProject();
        return NextResponse.json({ closed: true });
      }
      case "open-file": {
        const path = typeof p.path === "string" ? p.path : "";
        const handle = await workspace.openFile(path);
        return NextResponse.json({ handle: { id: handle.id, path: handle.path, dirty: handle.dirty } });
      }
      case "close-file": {
        const path = typeof p.path === "string" ? p.path : "";
        await workspace.closeFile(path);
        return NextResponse.json({ closed: true });
      }
      case "read-file": {
        const path = typeof p.path === "string" ? p.path : "";
        const content = await workspace.readFile(path);
        return NextResponse.json({ content });
      }
      case "write-file": {
        const path = typeof p.path === "string" ? p.path : "";
        const content = typeof p.content === "string" ? p.content : "";
        await workspace.writeFile(path, content, typeof p.source === "string" ? p.source : "api");
        return NextResponse.json({ written: true });
      }
      case "save-file": {
        const path = typeof p.path === "string" ? p.path : "";
        await workspace.saveFile(path);
        return NextResponse.json({ saved: true });
      }
      case "create-file": {
        const path = typeof p.path === "string" ? p.path : "";
        const content = typeof p.content === "string" ? p.content : "";
        const node = await workspace.createFile(path, content);
        return NextResponse.json({ node });
      }
      case "create-folder": {
        const path = typeof p.path === "string" ? p.path : "";
        const node = await workspace.createFolder(path);
        return NextResponse.json({ node });
      }
      case "rename-file": {
        const oldPath = typeof p.oldPath === "string" ? p.oldPath : "";
        const newPath = typeof p.newPath === "string" ? p.newPath : "";
        await workspace.renameFile(oldPath, newPath);
        return NextResponse.json({ renamed: true });
      }
      case "move-file": {
        const oldPath = typeof p.oldPath === "string" ? p.oldPath : "";
        const newPath = typeof p.newPath === "string" ? p.newPath : "";
        await workspace.moveFile(oldPath, newPath);
        return NextResponse.json({ moved: true });
      }
      case "delete-file": {
        const path = typeof p.path === "string" ? p.path : "";
        const hard = p.hard === true;
        await workspace.deleteFile(path, hard);
        return NextResponse.json({ deleted: true });
      }
      case "delete-folder": {
        const path = typeof p.path === "string" ? p.path : "";
        const hard = p.hard === true;
        await workspace.deleteFolder(path, hard);
        return NextResponse.json({ deleted: true });
      }
      case "copy-file": {
        const sourcePath = typeof p.sourcePath === "string" ? p.sourcePath : "";
        const destPath = typeof p.destPath === "string" ? p.destPath : "";
        await workspace.copyFile(sourcePath, destPath);
        return NextResponse.json({ copied: true });
      }
      case "search": {
        const query: SearchQuery = {
          text: typeof p.text === "string" ? p.text : "",
          mode: (p.mode as SearchQuery["mode"] | undefined) ?? "all",
          regex: p.regex === true,
          caseSensitive: p.caseSensitive === true,
        };
        const results = await workspace.search(query);
        return NextResponse.json({ results });
      }
      case "get-symbols": {
        const path = typeof p.path === "string" ? p.path : "";
        const symbols = workspace.getSymbols(path);
        return NextResponse.json({ symbols });
      }
      case "get-summary": {
        const path = typeof p.path === "string" ? p.path : "";
        const summary = workspace.getSummary(path);
        return NextResponse.json({ summary });
      }
      case "get-diagnostics": {
        const path = typeof p.path === "string" ? p.path : "";
        const diagnostics = workspace.getFileDiagnostics(path);
        return NextResponse.json({ diagnostics });
      }
      case "set-diagnostics": {
        const path = typeof p.path === "string" ? p.path : "";
        const diagnostics = Array.isArray(p.diagnostics) ? p.diagnostics : [];
        workspace.setFileDiagnostics(path, diagnostics as import("@/ide/workspace/types").Diagnostic[]);
        return NextResponse.json({ diagnostics });
      }
      case "get-git": {
        return NextResponse.json({ git: workspace.getGitInfo() });
      }
      case "get-status": {
        return NextResponse.json({ snapshot: workspace.getSnapshot() });
      }
      case "get-tree": {
        return NextResponse.json({ tree: workspace.getTreeSnapshot() });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
