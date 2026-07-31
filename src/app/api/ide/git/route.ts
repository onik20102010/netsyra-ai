// d:\netsyra\src\app\api\ide\git\route.ts
//
// Returns real git information (current branch, status, ahead/behind)
// for the workspace directory. Uses child_process to run git commands.

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface GitInfo {
  branch: string | null;
  ahead: number;
  behind: number;
  modified: number;
  staged: number;
  untracked: number;
  hasGit: boolean;
}

async function runGit(command: string, cwd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command, {
      cwd,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    return stdout.trim();
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cwd = searchParams.get("cwd") || process.cwd();

  // Check if .git exists
  const isRepo = await runGit("git rev-parse --is-inside-work-tree", cwd);
  if (isRepo !== "true") {
    return NextResponse.json<GitInfo>({
      branch: null,
      ahead: 0,
      behind: 0,
      modified: 0,
      staged: 0,
      untracked: 0,
      hasGit: false,
    });
  }

  // Get current branch
  const branch = await runGit("git rev-parse --abbrev-ref HEAD", cwd);

  // Get ahead/behind counts relative to upstream
  const tracking = await runGit("git rev-list --left-right --count HEAD...@{upstream}", cwd);
  let ahead = 0;
  let behind = 0;
  if (tracking) {
    const parts = tracking.split(/\s+/);
    ahead = parseInt(parts[0], 10) || 0;
    behind = parseInt(parts[1], 10) || 0;
  }

  // Get porcelain status
  const status = await runGit("git status --porcelain", cwd);
  let modified = 0;
  let staged = 0;
  let untracked = 0;

  if (status) {
    for (const line of status.split("\n")) {
      if (!line) continue;
      const x = line[0];
      const y = line[1];
      if (x === "?" && y === "?") {
        untracked++;
      } else {
        if (x !== " " && x !== "?") staged++;
        if (y !== " " && y !== "?") modified++;
      }
    }
  }

  return NextResponse.json<GitInfo>({
    branch: branch || null,
    ahead,
    behind,
    modified,
    staged,
    untracked,
    hasGit: true,
  });
}
