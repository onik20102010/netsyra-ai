import { promises as fs, watch as fsWatch } from "fs";
import path from "path";
import type { IFileSystem, FileSystemEntry } from "./types";

export class NodeFileSystem implements IFileSystem {
  async readFile(filePath: string, encoding: BufferEncoding = "utf-8"): Promise<string> {
    return fs.readFile(filePath, { encoding });
  }

  async writeFile(filePath: string, content: string, encoding: BufferEncoding = "utf-8"): Promise<void> {
    await fs.writeFile(filePath, content, { encoding });
  }

  async readDir(dirPath: string): Promise<FileSystemEntry[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const result: FileSystemEntry[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const stat = await fs.stat(fullPath);
      result.push({
        name: entry.name,
        path: fullPath,
        relativePath: "",
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        size: stat.size,
        modifiedAt: stat.mtime.getTime(),
      });
    }
    return result;
  }

  async stat(filePath: string): Promise<FileSystemEntry> {
    const stat = await fs.stat(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      relativePath: "",
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      size: stat.size,
      modifiedAt: stat.mtime.getTime(),
    };
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
    await fs.mkdir(dirPath, { recursive: options?.recursive ?? false });
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await fs.rename(oldPath, newPath);
  }

  async remove(filePath: string, recursive = false): Promise<void> {
    await fs.rm(filePath, { recursive, force: true });
  }

  async copy(sourcePath: string, destPath: string): Promise<void> {
    const content = await fs.readFile(sourcePath, "utf-8");
    await fs.writeFile(destPath, content, "utf-8");
  }

  async watch(
    pathToWatch: string,
    onChange: (event: "created" | "deleted" | "modified" | "renamed", filePath: string) => void
  ): Promise<() => void> {
    const watcher = fsWatch(pathToWatch, { recursive: true }, async (_eventType, filename) => {
      if (!filename) return;
      const fullPath = path.join(pathToWatch, filename);
      const exists = await this.exists(fullPath);
      if (exists) {
        onChange("modified", fullPath);
      } else {
        onChange("deleted", fullPath);
      }
    });

    return () => {
      watcher.close();
    };
  }
}
