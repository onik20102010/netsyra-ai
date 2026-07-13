"use client";

import { get, set } from "idb-keyval";
import { type FileItem, type OpenFile } from "@/components/ide/file-utils";

const WORKSPACE_KEY = "netsyra-workspace-dir";

export async function openWorkspace(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await window.showDirectoryPicker();
    await handle.requestPermission({ mode: "readwrite" });
    await set(WORKSPACE_KEY, handle);
    return handle;
  } catch {
    return null;
  }
}

export async function restoreWorkspace(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await get<FileSystemDirectoryHandle | undefined>(WORKSPACE_KEY);
    if (!handle) return null;
    const state = await handle.queryPermission({ mode: "readwrite" });
    if (state !== "granted") {
      const permission = await handle.requestPermission({ mode: "readwrite" });
      if (permission !== "granted") return null;
    }
    return handle;
  } catch {
    return null;
  }
}

export async function saveWorkspaceHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await set(WORKSPACE_KEY, handle);
}

async function readDirectoryEntries(
  dir: FileSystemDirectoryHandle,
  basePath: string
): Promise<FileItem[]> {
  const entries: FileItem[] = [];
  for await (const [name, handle] of dir.entries()) {
    const path = basePath ? `${basePath}/${name}` : `/${name}`;
    if (handle.kind === "directory") {
      const children = await readDirectoryEntries(handle as FileSystemDirectoryHandle, path);
      entries.push({
        id: path,
        name,
        path,
        type: "folder",
        handle,
        children,
      });
    } else {
      entries.push({
        id: path,
        name,
        path,
        type: "file",
        handle,
      });
    }
  }
  // directories first, then files alphabetically
  entries.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "folder" ? -1 : 1;
  });
  return entries;
}

export async function buildWorkspace(handle: FileSystemDirectoryHandle): Promise<FileItem> {
  const children = await readDirectoryEntries(handle, "");
  return {
    id: "/",
    name: handle.name,
    path: "/",
    type: "folder",
    handle,
    children,
  };
}

export async function readFileText(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

export async function writeFileText(handle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function applyFileChange(
  root: FileSystemDirectoryHandle,
  path: string,
  content: string
): Promise<void> {
  const normalized = path.replace(/^\/+/, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 0) throw new Error("Invalid file path");

  let dir: FileSystemDirectoryHandle = root;
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i], { create: true });
  }

  const fileName = parts[parts.length - 1];
  const handle = await dir.getFileHandle(fileName, { create: true });
  await writeFileText(handle, content);
}

export async function createFile(
  parent: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemFileHandle> {
  return parent.getFileHandle(name, { create: true });
}

export async function createDirectory(
  parent: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true });
}

export async function removeEntry(
  parent: FileSystemDirectoryHandle,
  name: string
): Promise<void> {
  await parent.removeEntry(name, { recursive: true });
}

export function findFileByPath(workspace: FileItem, path: string): FileItem | null {
  const walk = (items: FileItem[]): FileItem | null => {
    for (const item of items) {
      if (item.path === path && item.type === "file") return item;
      if (item.children) {
        const found = walk(item.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(workspace.children ?? []);
}

export async function renameEntry(
  parent: FileSystemDirectoryHandle,
  oldName: string,
  newName: string
): Promise<void> {
  const oldHandle = await parent.getFileHandle(oldName);
  const file = await oldHandle.getFile();
  const content = await file.text();
  const newHandle = await parent.getFileHandle(newName, { create: true });
  const writable = await newHandle.createWritable();
  await writable.write(content);
  await writable.close();
  await parent.removeEntry(oldName);
}

const ALWAYS_INCLUDE = new Set([
  "/package.json",
  "/tsconfig.json",
  "/next.config.js",
  "/next.config.ts",
  "/tailwind.config.js",
  "/tailwind.config.ts",
  "/vite.config.js",
  "/vite.config.ts",
  "/astro.config.mjs",
  "/README.md",
  "/.env.example",
]);

export interface ContextFile {
  path: string;
  content: string;
}

function allFiles(workspace: FileItem): FileItem[] {
  const files: FileItem[] = [];
  const walk = (items: FileItem[]) => {
    for (const item of items) {
      if (item.type === "file") files.push(item);
      if (item.children) walk(item.children);
    }
  };
  walk(workspace.children ?? []);
  return files;
}

function scoreFile(file: FileItem, query: string): number {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return 0;
  const path = file.path.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (path.includes(term)) score += 2;
    if (file.name.toLowerCase().includes(term)) score += 3;
  }
  return score;
}

export async function gatherWorkspaceContext(
  workspace: FileItem,
  query: string,
  openFiles: OpenFile[] = [],
  options: { maxFiles?: number; maxBytes?: number } = {}
): Promise<ContextFile[]> {
  const { maxFiles = 8, maxBytes = 50 * 1024 } = options;
  const files = allFiles(workspace);
  const byPath = new Map<string, ContextFile>();

  // Always include open files first
  for (const f of openFiles) {
    byPath.set(f.path, { path: f.path, content: f.content });
  }

  // Always include key config files
  for (const file of files) {
    if (ALWAYS_INCLUDE.has(file.path.toLowerCase())) {
      if (byPath.has(file.path)) continue;
      try {
        const handle = file.handle as FileSystemFileHandle;
        const blob = await handle.getFile();
        if (blob.size > maxBytes) continue;
        const content = await blob.text();
        byPath.set(file.path, { path: file.path, content });
      } catch {
        // ignore unreadable
      }
    }
  }

  // Search workspace by file path/name
  const scored = files
    .map((f) => ({ file: f, score: scoreFile(f, query) }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles);

  for (const { file } of scored) {
    if (byPath.has(file.path)) continue;
    try {
      const handle = file.handle as FileSystemFileHandle;
      const blob = await handle.getFile();
      if (blob.size > maxBytes) continue;
      const content = await blob.text();
      byPath.set(file.path, { path: file.path, content });
    } catch {
      // ignore unreadable
    }
  }

  return Array.from(byPath.values());
}
