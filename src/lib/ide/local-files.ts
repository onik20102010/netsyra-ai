// src/lib/ide/local-files.ts – export dirHandle

const DB_NAME = "netsyra-ide";
const STORE_NAME = "files";

function log(msg: string) {
  console.log(`[IDE Storage] ${msg}`);
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "path" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// IndexedDB operations
export async function loadFilesFromIndexedDB(): Promise<Record<string, string>> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const files: Record<string, string> = {};
      request.result.forEach((item: any) => { files[item.path] = item.content; });
      resolve(files);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveFileToIndexedDB(path: string, content: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ path, content, updatedAt: Date.now() });
    tx.oncomplete = () => {
      log(`Saved to IndexedDB: ${path}`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFileFromIndexedDB(path: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(path);
    const keysRequest = store.getAllKeys();
    keysRequest.onsuccess = () => {
      const keys = keysRequest.result as string[];
      keys.forEach(key => {
        if (key.startsWith(path + "/")) store.delete(key);
      });
    };
    tx.oncomplete = () => {
      log(`Deleted from IndexedDB: ${path}`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// File System Access API operations
export let dirHandle: FileSystemDirectoryHandle | null = null;

// Check support
export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

// Open folder and return all files as a flat Record<path, content>
export async function openLocalFolder(): Promise<Record<string, string>> {
  // @ts-ignore
  dirHandle = await window.showDirectoryPicker();
  log(`Opened folder: ${dirHandle?.name}`);
  const root = dirHandle!;
  const files: Record<string, string> = {};
  const readDir = async (handle: FileSystemDirectoryHandle, parentPath: string) => {
    // @ts-ignore – entries() is available in modern browsers
    for await (const [name, childHandle] of (handle as any).entries()) {
      const childPath = parentPath ? `${parentPath}/${name}` : name;
      if (childHandle.kind === "file") {
        const file = await (childHandle as FileSystemFileHandle).getFile();
        const text = await file.text();
        files[childPath] = text;
      } else if (childHandle.kind === "directory") {
        await readDir(childHandle as FileSystemDirectoryHandle, childPath);
      }
    }
  };
  await readDir(root, "");
  return files;
}

// Write a file (creates intermediate folders if needed)
async function ensureDir(handle: FileSystemDirectoryHandle, pathParts: string[]): Promise<FileSystemDirectoryHandle> {
  let current = handle;
  for (const part of pathParts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  return current;
}

export async function writeLocalFile(path: string, content: string): Promise<void> {
  const root = dirHandle;
  if (!root) return;
  const parts = path.split("/");
  const fileName = parts.pop()!;
  const dir = await ensureDir(root, parts);
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
  log(`Wrote to disk: ${path}`);
}

export async function deleteLocalFile(path: string): Promise<void> {
  const root = dirHandle;
  if (!root) return;
  const parts = path.split("/");
  const fileName = parts.pop()!;
  const dir = await ensureDir(root, parts);
  await dir.removeEntry(fileName, { recursive: false });
  log(`Deleted from disk: ${path}`);
}