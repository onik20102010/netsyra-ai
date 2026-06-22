// src/lib/ide/file-system-manager.ts
// File System Access API integration for local project management

export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

export interface DirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  entries(): AsyncIterable<[string, FileSystemHandle]>;
  getDirectoryHandle(name: string, options?: { create: boolean }): Promise<DirectoryHandle>;
  getFileHandle(name: string, options?: { create: boolean }): Promise<FileHandle>;
  removeEntry(name: string, options?: { recursive: boolean }): Promise<void>;
}

export interface FileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string | WriteParams): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

export interface WriteParams {
  type: 'write' | 'seek' | 'truncate';
  data?: BufferSource | Blob | string;
  position?: number;
  size?: number;
}

class FileSystemManager {
  private projectHandle: DirectoryHandle | null = null;
  private fileHandles: Map<string, FileHandle> = new Map();

  // Check if File System Access API is supported
  isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  // Open a project folder
  async openProject(): Promise<DirectoryHandle | null> {
    if (!this.isSupported()) {
      throw new Error('File System Access API is not supported in this browser');
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      this.projectHandle = handle;
      this.fileHandles.clear();
      return handle;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // User cancelled
      }
      throw error;
    }
  }

  // Get project handle
  getProjectHandle(): DirectoryHandle | null {
    return this.projectHandle;
  }

  // Set project handle (for restoring from storage)
  setProjectHandle(handle: DirectoryHandle): void {
    this.projectHandle = handle;
    this.fileHandles.clear();
  }

  // Read a file from the project
  async readFile(path: string): Promise<string> {
    if (!this.projectHandle) {
      throw new Error('No project opened');
    }

    const handle = await this.getFileHandle(path);
    const file = await handle.getFile();
    return file.text();
  }

  // Write a file to the project
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.projectHandle) {
      throw new Error('No project opened');
    }

    const handle = await this.getFileHandle(path, true);
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  // Get or create a file handle
  async getFileHandle(path: string, create = false): Promise<FileHandle> {
    if (!this.projectHandle) {
      throw new Error('No project opened');
    }

    // Check cache first
    if (this.fileHandles.has(path)) {
      return this.fileHandles.get(path)!;
    }

    // Navigate through directory structure
    const parts = path.split('/');
    let currentDir = this.projectHandle;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      try {
        currentDir = await currentDir.getDirectoryHandle(part, { create });
      } catch (error) {
        throw new Error(`Failed to access directory: ${part}`);
      }
    }

    // Get the file handle
    const fileName = parts[parts.length - 1];
    const fileHandle = await currentDir.getFileHandle(fileName, { create });
    
    // Cache the handle
    this.fileHandles.set(path, fileHandle);
    return fileHandle;
  }

  // Get all files in the project recursively
  async getAllFiles(): Promise<string[]> {
    if (!this.projectHandle) {
      return [];
    }

    const files: string[] = [];
    await this.collectFiles(this.projectHandle, '', files);
    return files;
  }

  private async collectFiles(dir: DirectoryHandle, basePath: string, files: string[]): Promise<void> {
    for await (const [name, handle] of dir.entries()) {
      const path = basePath ? `${basePath}/${name}` : name;
      
      if (handle.kind === 'file') {
        files.push(path);
      } else if (handle.kind === 'directory') {
        await this.collectFiles(handle as DirectoryHandle, path, files);
      }
    }
  }

  // Check if a file exists
  async fileExists(path: string): Promise<boolean> {
    if (!this.projectHandle) {
      return false;
    }

    try {
      await this.getFileHandle(path);
      return true;
    } catch {
      return false;
    }
  }

  // Delete a file
  async deleteFile(path: string): Promise<void> {
    if (!this.projectHandle) {
      throw new Error('No project opened');
    }

    const parts = path.split('/');
    let currentDir = this.projectHandle;

    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i]);
    }

    await currentDir.removeEntry(parts[parts.length - 1]);
    this.fileHandles.delete(path);
  }

  // Clear all handles
  clear(): void {
    this.projectHandle = null;
    this.fileHandles.clear();
  }

  // Request permission for a handle
  async requestPermission(handle: FileSystemHandle): Promise<boolean> {
    if ((handle as any).requestPermission) {
      const permission = await (handle as any).requestPermission();
      return permission === 'granted';
    }
    return true;
  }

  // Verify permission for project handle
  async verifyPermission(): Promise<boolean> {
    if (!this.projectHandle) {
      return false;
    }

    const options = { mode: 'readwrite' as const };
    if ((this.projectHandle as any).queryPermission) {
      const permission = await (this.projectHandle as any).queryPermission(options);
      if (permission === 'granted') {
        return true;
      }
      return await this.requestPermission(this.projectHandle);
    }
    return true;
  }
}

// Singleton instance
let fileSystemManager: FileSystemManager | null = null;

export function getFileSystemManager(): FileSystemManager {
  if (!fileSystemManager) {
    fileSystemManager = new FileSystemManager();
  }
  return fileSystemManager;
}

export function resetFileSystemManager(): void {
  if (fileSystemManager) {
    fileSystemManager.clear();
    fileSystemManager = null;
  }
}
