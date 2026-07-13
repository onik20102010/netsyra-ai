import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { GitInfo, IFileSystem } from "./types";

const execAsync = promisify(exec);

export async function findGitRoot(fileSystem: IFileSystem, startPath: string): Promise<string | undefined> {
  let current = startPath;
  while (true) {
    const gitPath = path.join(current, ".git");
    if (await fileSystem.exists(gitPath)) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return undefined;
}

export async function readGitBranch(gitRoot: string): Promise<string | undefined> {
  try {
    const headPath = path.join(gitRoot, ".git", "HEAD");
    const head = await fs.readFile(headPath, "utf-8");
    const ref = head.trim();
    if (ref.startsWith("ref: refs/heads/")) {
      return ref.replace("ref: refs/heads/", "");
    }
    return ref;
  } catch {
    return undefined;
  }
}

export async function readGitStatus(gitRoot: string): Promise<GitInfo> {
  const info: GitInfo = {
    root: gitRoot,
    modified: [],
    staged: [],
    untracked: [],
    ignored: [],
    conflicts: [],
  };

  try {
    const branch = await readGitBranch(gitRoot);
    info.branch = branch;

    const { stdout } = await execAsync("git status --short --porcelain", { cwd: gitRoot, timeout: 5000 });
    const lines = stdout.split(/\r?\n/).filter(Boolean);

    for (const line of lines) {
      const status = line.substring(0, 2);
      const filePath = line.substring(3).trim();

      if (status.includes("U") || status.includes("D") || status.includes("A")) {
        info.conflicts.push(filePath);
      } else if (status.startsWith(" ")) {
        info.modified.push(filePath);
      } else if (status.startsWith("M") || status.startsWith("A") || status.startsWith("D")) {
        info.staged.push(filePath);
      } else if (status.startsWith("?")) {
        info.untracked.push(filePath);
      }
    }
  } catch {
    // Git may not be available; ignore.
  }

  return info;
}
