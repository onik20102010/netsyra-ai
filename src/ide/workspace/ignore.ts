import ignore from "ignore";
import type { IFileSystem } from "./types";

const DEFAULT_IGNORE_PATTERNS = [
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".cache",
  "tmp",
  "temp",
  "logs",
  "*.log",
  ".DS_Store",
  "Thumbs.db",
  ".env",
  ".env.*",
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
];

export class IgnoreEngine {
  private ig = ignore();
  private root: string;
  private fileSystem: IFileSystem;

  constructor(root: string, fileSystem: IFileSystem) {
    this.root = root;
    this.fileSystem = fileSystem;
    this.ig.add(DEFAULT_IGNORE_PATTERNS);
  }

  async loadGitignore(): Promise<void> {
    const gitignorePath = `${this.root}/.gitignore`;
    if (await this.fileSystem.exists(gitignorePath)) {
      try {
        const content = await this.fileSystem.readFile(gitignorePath);
        this.ig.add(content.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith("#")));
      } catch {
        // Ignore errors reading .gitignore.
      }
    }
  }

  addPatterns(patterns: string[]): void {
    this.ig.add(patterns);
  }

  isIgnored(relativePath: string, isDirectory = false): boolean {
    if (this.ig.ignores(relativePath)) return true;
    if (isDirectory && this.ig.ignores(`${relativePath}/`)) return true;
    return false;
  }

  isIgnoredName(name: string): boolean {
    return this.ig.ignores(name);
  }
}
