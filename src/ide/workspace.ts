// d:\netsyra\src\ide\workspace.ts

import { FileItem } from './types';
import { useIdeStore } from './store';
import { getLanguageFromPath } from './file-utils';

// Caching file handles so we can write back to the user's hard drive when they hit "Save"
const fileHandleCache = new Map<string, FileSystemFileHandle>();
let rootDirectoryHandle: FileSystemDirectoryHandle | null = null;

// Utility to generate IDs (matching the logic inside store.ts)
const generateId = () => Math.random().toString(36).substring(2, 15);

/**
 * Recursively reads a FileSystemDirectoryHandle and converts it to our FileItem structure.
 */
async function readDirectory(
  dirHandle: FileSystemDirectoryHandle,
  currentPath: string
): Promise<FileItem[]> {
  const items: FileItem[] = [];

  // Iterate over entries in the directory
  for await (const entry of dirHandle.values()) {
    const fullPath = `${currentPath}/${entry.name}`;

    if (entry.kind === 'directory') {
      // It's a folder, recursively read it
      const children = await readDirectory(entry as FileSystemDirectoryHandle, fullPath);
      items.push({
        id: generateId(),
        name: entry.name,
        path: fullPath,
        isDirectory: true,
        children: children,
      });
    } else {
      // It's a file
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const content = await file.text();

      // Cache the file handle so we can save later
      fileHandleCache.set(fullPath, fileHandle);

      items.push({
        id: generateId(),
        name: entry.name,
        path: fullPath,
        isDirectory: false,
        content: content,
        language: getLanguageFromPath(entry.name),
        lastModified: file.lastModified,
      });
    }
  }

  return items;
}

/**
 * Prompts the user to select a folder and loads it into the IDE.
 */
export async function openWorkspaceFromDisk(): Promise<void> {
  // Check if the browser supports the File System Access API
  if (!('showDirectoryPicker' in window)) {
    alert(
      'Your browser does not support the File System Access API. ' +
      'Please use a Chromium-based browser (like Chrome or Edge) over HTTPS or localhost.'
    );
    return;
  }

  try {
    // 1. Request folder access
    const dirHandle = await (window as any).showDirectoryPicker();
    rootDirectoryHandle = dirHandle;
    
    // 2. Clear previous cache
    fileHandleCache.clear();

    // 3. Set loading state in your store
    useIdeStore.getState().setLoading(true);

    // 4. Read the entire directory recursively
    const files = await readDirectory(dirHandle, '');

    // 5. Update the global store with the new workspace
    useIdeStore.getState().openWorkspace(dirHandle.name, files);
    
    // 6. Turn off loading state
    useIdeStore.getState().setLoading(false);
  } catch (error) {
    useIdeStore.getState().setLoading(false);
    // User probably clicked "Cancel" on the folder picker, or it failed for another reason.
    // We silently ignore to avoid annoying console errors for a canceled action.
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Failed to open workspace:', error);
    }
  }
}

/**
 * Writes the given content to the actual file on the user's disk.
 */
export async function saveFileToDisk(filePath: string, content: string): Promise<void> {
  const fileHandle = fileHandleCache.get(filePath);
  if (!fileHandle) {
    console.warn(`No cached file handle found for ${filePath}. Cannot save.`);
    return;
  }

  try {
    // Acquire a writable stream
    const writable = await fileHandle.createWritable();
    // Write the content
    await writable.write(content);
    // Close the stream
    await writable.close();
    
    // Optional: Update the last modified timestamp in the virtual tree if needed
    console.log(`Saved file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to save file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Retrieves the raw content of a file handle (useful for re-reading if we want to refresh).
 */
export async function getFileContentFromDisk(filePath: string): Promise<string | null> {
  const fileHandle = fileHandleCache.get(filePath);
  if (!fileHandle) return null;
  try {
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

/**
 * Creates a new file on disk using the File System Access API.
 */
export async function createFileOnDisk(parentPath: string, fileName: string, content: string = ''): Promise<void> {
  if (!rootDirectoryHandle) {
    console.warn('No workspace opened. Cannot create file on disk.');
    return;
  }

  try {
    // Navigate to the parent directory
    const dirHandle = await getDirectoryHandleFromPath(parentPath);
    
    // Create the file
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    
    // Write content if provided
    if (content) {
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    }

    // Cache the file handle for future saves
    const fullPath = `${parentPath}/${fileName}`.replace('//', '/');
    fileHandleCache.set(fullPath, fileHandle);
    
    console.log(`Created file on disk: ${fullPath}`);
  } catch (error) {
    console.error(`Failed to create file ${fileName}:`, error);
    throw error;
  }
}

/**
 * Creates a new directory on disk using the File System Access API.
 */
export async function createDirectoryOnDisk(parentPath: string, dirName: string): Promise<void> {
  if (!rootDirectoryHandle) {
    console.warn('No workspace opened. Cannot create directory on disk.');
    return;
  }

  try {
    // Navigate to the parent directory
    const dirHandle = await getDirectoryHandleFromPath(parentPath);
    
    // Create the directory
    await dirHandle.getDirectoryHandle(dirName, { create: true });
    
    console.log(`Created directory on disk: ${parentPath}/${dirName}`);
  } catch (error) {
    console.error(`Failed to create directory ${dirName}:`, error);
    throw error;
  }
}

/**
 * Helper to get a directory handle from a path string.
 */
async function getDirectoryHandleFromPath(path: string): Promise<FileSystemDirectoryHandle> {
  if (!rootDirectoryHandle) {
    throw new Error('No workspace opened');
  }

  // If path is empty or '/', return root
  if (!path || path === '/' || path === '') {
    return rootDirectoryHandle;
  }

  // Split path and navigate
  const parts = path.split('/').filter(p => p);
  let currentHandle = rootDirectoryHandle;

  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part);
  }

  return currentHandle;
}

/**
 * Renames a file or directory on disk using the File System Access API.
 * For files: reads content, creates new file with new name, writes content, deletes old.
 * For directories: creates new directory, moves all children, deletes old (best-effort).
 */
export async function renameItemOnDisk(oldPath: string, newName: string): Promise<void> {
  if (!rootDirectoryHandle) {
    console.warn('No workspace opened. Cannot rename on disk.');
    return;
  }

  const parentPath = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
  const oldName = oldPath.split('/').pop() || '';
  const newPath = `${parentPath}/${newName}`.replace('//', '/');

  try {
    const parentHandle = await getDirectoryHandleFromPath(parentPath);

    // Check if it's a file (in cache) or directory
    const fileHandle = fileHandleCache.get(oldPath);
    if (fileHandle) {
      // It's a file — read content, create new, write, delete old
      const file = await fileHandle.getFile();
      const content = await file.text();
      const newFileHandle = await parentHandle.getFileHandle(newName, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      // Delete old file
      await parentHandle.removeEntry(oldName);
      // Update cache
      fileHandleCache.delete(oldPath);
      fileHandleCache.set(newPath, newFileHandle);
      console.log(`Renamed file: ${oldPath} -> ${newPath}`);
    } else {
      // It's a directory — recursively copy then delete
      const oldDirHandle = await parentHandle.getDirectoryHandle(oldName);
      const newDirHandle = await parentHandle.getDirectoryHandle(newName, { create: true });
      await copyDirectoryContents(oldDirHandle, newDirHandle, newPath);
      await parentHandle.removeEntry(oldName, { recursive: true });
      console.log(`Renamed directory: ${oldPath} -> ${newPath}`);
    }
  } catch (error) {
    console.error(`Failed to rename ${oldPath} to ${newName}:`, error);
    throw error;
  }
}

/** Recursively copies all entries from one directory handle to another. */
async function copyDirectoryContents(
  src: FileSystemDirectoryHandle,
  dst: FileSystemDirectoryHandle,
  dstPath: string,
): Promise<void> {
  for await (const entry of src.values()) {
    if (entry.kind === 'file') {
      const srcFile = entry as FileSystemFileHandle;
      const file = await srcFile.getFile();
      const content = await file.text();
      const newFileHandle = await dst.getFileHandle(entry.name, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      fileHandleCache.set(`${dstPath}/${entry.name}`, newFileHandle);
    } else {
      const srcDir = entry as FileSystemDirectoryHandle;
      const newDir = await dst.getDirectoryHandle(entry.name, { create: true });
      await copyDirectoryContents(srcDir, newDir, `${dstPath}/${entry.name}`);
    }
  }
}

/**
 * Deletes a file or directory from disk using the File System Access API.
 */
export async function deleteItemOnDisk(itemPath: string): Promise<void> {
  if (!rootDirectoryHandle) {
    console.warn('No workspace opened. Cannot delete on disk.');
    return;
  }

  const parentPath = itemPath.includes('/') ? itemPath.substring(0, itemPath.lastIndexOf('/')) : '';
  const name = itemPath.split('/').pop() || '';

  try {
    const parentHandle = await getDirectoryHandleFromPath(parentPath);
    await parentHandle.removeEntry(name, { recursive: true });

    // Clean up file handle cache for this path and any children
    for (const cachedPath of fileHandleCache.keys()) {
      if (cachedPath === itemPath || cachedPath.startsWith(itemPath + '/')) {
        fileHandleCache.delete(cachedPath);
      }
    }

    console.log(`Deleted: ${itemPath}`);
  } catch (error) {
    console.error(`Failed to delete ${itemPath}:`, error);
    throw error;
  }
}

/**
 * Closes the current workspace and revokes all file system permissions (clears cache).
 */
export function closeWorkspaceFromDisk(): void {
  fileHandleCache.clear();
  rootDirectoryHandle = null;
  useIdeStore.getState().closeWorkspace();
}