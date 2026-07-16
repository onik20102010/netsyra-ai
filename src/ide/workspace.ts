// ═══════════════════════════════════════════════════════════════
// Netsyra IDE — Workspace Library
// File System Access API helpers for local folder operations
// ═══════════════════════════════════════════════════════════════

import type { FileItem } from "@/ide/types";

// ── Open folder picker ──────────────────────────────────────────

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
    return null;
  }
  try {
    const handle = await (window as unknown as {
      showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker({ mode: "readwrite" });
    return handle;
  } catch {
    return null;
  }
}

// ── Build file tree from directory handle ───────────────────────

const IGNORED_DIRS = new Set(["node_modules", ".next", ".git", "dist", "out", ".cache"]);
const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db"]);
const MAX_DEPTH = 10;

export async function buildTree(
  handle: FileSystemDirectoryHandle,
  path = "",
  depth = 0
): Promise<FileItem> {
  const id = path || handle.name;
  const item: FileItem = {
    id,
    name: handle.name,
    path: path || handle.name,
    type: "folder",
    handle,
    children: [],
  };

  if (depth >= MAX_DEPTH) return item;

  try {
    const entries = [];
    for await (const entry of handle.entries()) {
      const [name, childHandle] = entry;
      if (childHandle.kind === "directory" && IGNORED_DIRS.has(name)) continue;
      if (childHandle.kind === "file" && IGNORED_FILES.has(name)) continue;
      entries.push(entry);
    }

    entries.sort((a, b) => {
      const [aName, aHandle] = a;
      const [bName, bHandle] = b;
      if (aHandle.kind !== bHandle.kind) {
        return aHandle.kind === "directory" ? -1 : 1;
      }
      return aName.localeCompare(bName);
    });

    for (const [name, childHandle] of entries) {
      const childPath = path ? `${path}/${name}` : name;
      if (childHandle.kind === "directory") {
        const child = await buildTree(
          childHandle as FileSystemDirectoryHandle,
          childPath,
          depth + 1
        );
        item.children!.push(child);
      } else {
        item.children!.push({
          id: childPath,
          name,
          path: childPath,
          type: "file",
          handle: childHandle,
        });
      }
    }
  } catch {
    // Permission denied or read error — return empty children
  }

  return item;
}

// ── Read file content ───────────────────────────────────────────

export async function readFileContent(
  handle: FileSystemFileHandle
): Promise<string> {
  try {
    const file = await handle.getFile();
    return await file.text();
  } catch {
    return "";
  }
}

// ── Write file content ──────────────────────────────────────────

export async function writeFileContent(
  handle: FileSystemFileHandle,
  content: string
): Promise<void> {
  try {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch {
    // Permission denied or write error
  }
}

// ─<arg_value>Persist directory handle to IndexedDB ───────────────────────

import { get, set, del } from "idb-keyval";

const WORKSPACE_KEY = "netsyra-workspace-dir";

export async function saveWorkspaceHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await set(WORKSPACE_KEY, handle);
}

export async function restoreWorkspaceHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await get(WORKSPACE_KEY);
    if (!handle) return null;
    // Verify permission
    const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" };
    if ("queryPermission" in handle) {
      const perm = await (handle as unknown as {
        queryPermission: (opts: FileSystemHandlePermissionDescriptor) => Promise<string>;
      }).queryPermission(opts);
      if (perm !== "granted") return null;
    }
    return handle as FileSystemDirectoryHandle;
  } catch {
    return null;
  }
}

export async function clearWorkspaceHandle(): Promise<void> {
  await del(WORKSPACE_KEY);
}

// ── Verify handle permission ────────────────────────────────────

export async function verifyPermission(
  handle: FileSystemHandle,
  readWrite = true
): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = readWrite
    ? { mode: "readwrite" }
    : { mode: "read" };

  if ("queryPermission" in handle) {
    const queryFn = (handle as unknown as {
      queryPermission: (opts: FileSystemHandlePermissionDescriptor) => Promise<string>;
    }).queryPermission;
    if ((await queryFn(opts)) === "granted") return true;
  }

  if ("requestPermission" in handle) {
    const requestFn = (handle as unknown as {
      requestPermission: (opts: FileSystemHandlePermissionDescriptor) => Promise<string>;
    }).requestPermission;
    if ((await requestFn(opts)) === "granted") return true;
  }

  return false;
}

type FileSystemHandlePermissionDescriptor = {
  mode?: "read" | "readwrite";
};
