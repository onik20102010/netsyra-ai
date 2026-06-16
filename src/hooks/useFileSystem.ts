import { useState, useCallback, useEffect } from "react";
import { get, set, del, keys as idbKeys, clear } from "idb-keyval";

// We'll store file contents under keys: "file:path"
const FILE_PREFIX = "file:";

export interface FileHandleEntry {
  path: string;
  handle: FileSystemFileHandle;
}

export default function useFileSystem() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileHandles, setFileHandles] = useState<Record<string, FileSystemFileHandle>>({});

  // Load all files from IndexedDB on mount
  useEffect(() => {
    (async () => {
      const ks = await idbKeys();
      const newFiles: Record<string, string> = {};
      for (const k of ks) {
        if (typeof k === "string" && k.startsWith(FILE_PREFIX)) {
          const path = k.slice(FILE_PREFIX.length);
          const content = await get(k);
          if (typeof content === "string") {
            newFiles[path] = content;
          }
        }
      }
      setFiles(newFiles);
      // Also load stored file handles if any
      const handlesRaw = await get("fileHandles");
      if (handlesRaw) {
        setFileHandles(handlesRaw);
      }
    })();
  }, []);

  // Save file content to IDB
  const saveFile = useCallback(async (path: string, content: string) => {
    setFiles(prev => ({ ...prev, [path]: content }));
    await set(FILE_PREFIX + path, content);
    // If we have a local file handle, write to disk
    if (fileHandles[path]) {
      try {
        const writable = await fileHandles[path].createWritable();
        await writable.write(content);
        await writable.close();
      } catch (err) {
        console.warn("Could not write to local file:", err);
      }
    }
  }, [fileHandles]);

  // Delete file
  const deleteFile = useCallback(async (path: string) => {
    setFiles(prev => {
      const updated = { ...prev };
      delete updated[path];
      return updated;
    });
    await del(FILE_PREFIX + path);
    // Remove handle
    if (fileHandles[path]) {
      const newHandles = { ...fileHandles };
      delete newHandles[path];
      setFileHandles(newHandles);
      await set("fileHandles", newHandles);
    }
  }, [fileHandles]);

  // Rename file
  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    setFiles(prev => {
      const updated = { ...prev };
      // Move all files under that path
      for (const p in updated) {
        if (p === oldPath) {
          updated[newPath] = updated[oldPath];
          delete updated[oldPath];
        } else if (p.startsWith(oldPath + "/")) {
          const relative = p.slice(oldPath.length);
          updated[newPath + relative] = updated[p];
          delete updated[p];
        }
      }
      return updated;
    });
    // IDB: we need to delete old and set new
    const oldKeys = (await idbKeys()).filter(k => typeof k === "string" && k.startsWith(FILE_PREFIX + oldPath));
    for (const k of oldKeys) {
      const oldP = (k as string).slice(FILE_PREFIX.length);
      const content = await get(k);
      await del(k);
      const newP = newPath + oldP.slice(oldPath.length);
      if (content !== undefined) {
        await set(FILE_PREFIX + newP, content);
      }
    }
    if (activeFile === oldPath) setActiveFile(newPath);
  }, [activeFile]);

  // New file
  const newFile = useCallback(async (path: string) => {
    setFiles(prev => ({ ...prev, [path]: "" }));
    await set(FILE_PREFIX + path, "");
    setActiveFile(path);
  }, []);

  // New folder (just create a placeholder inside)
  const newFolder = useCallback(async (path: string) => {
    const placeholderPath = path + "/.gitkeep";
    setFiles(prev => ({ ...prev, [placeholderPath]: "" }));
    await set(FILE_PREFIX + placeholderPath, "");
  }, []);

  // Import local folder
  const importFolder = useCallback(async () => {
    try {
      if (!(window as any).showDirectoryPicker) {
        alert("Your browser does not support folder import. Use Chrome or Edge.");
        return;
      }
      const dirHandle = await (window as any).showDirectoryPicker();
      const handlesMap: Record<string, FileSystemFileHandle> = {};
      const newFiles: Record<string, string> = {};

      const readDir = async (dir: any, prefix: string = "") => {
        for await (const [name, entry] of dir.entries()) {
          const path = prefix ? `${prefix}/${name}` : name;
          if (entry.kind === "file") {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            const content = await file.text();
            newFiles[path] = content;
            handlesMap[path] = fileHandle;
          } else if (entry.kind === "directory") {
            await readDir(entry, path);
          }
        }
      };

      await readDir(dirHandle);
      // Save to IDB
      for (const [path, content] of Object.entries(newFiles)) {
        await set(FILE_PREFIX + path, content);
      }
      setFiles(prev => ({ ...prev, ...newFiles }));
      const updatedHandles = { ...fileHandles, ...handlesMap };
      setFileHandles(updatedHandles);
      await set("fileHandles", updatedHandles);
    } catch (err) {
      console.error("Import folder failed:", err);
      alert("Could not import folder. You may need to grant permission.");
    }
  }, [fileHandles]);

  return {
    files,
    setFiles,
    activeFile,
    setActiveFile,
    saveFile,
    deleteFile,
    renameFile,
    newFile,
    newFolder,
    importFolder,
  };
}