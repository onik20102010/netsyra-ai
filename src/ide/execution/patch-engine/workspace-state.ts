/**
 * Workspace State
 * 
 * Loads and manages current workspace state for patch integration.
 */

import type { WorkspaceSnapshot, WorkspaceFile, ProtectedFileRules } from "./types";

export class WorkspaceState {
  private workspacePath: string;
  private snapshots = new Map<string, WorkspaceSnapshot>();
  private protectedRules: ProtectedFileRules;

  constructor(workspacePath: string, protectedRules?: ProtectedFileRules) {
    this.workspacePath = workspacePath;
    this.protectedRules = protectedRules || {
      paths: [
        ".env",
        ".env.local",
        ".env.production",
        ".env.development",
        ".git",
        "node_modules",
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "credentials",
        "secrets",
      ],
      patterns: [
        "**/*.pem",
        "**/*.key",
        "**/id_rsa*",
        "**/.env*",
      ],
      allowWithConfirmation: [
        "package.json",
        "tsconfig.json",
        "next.config.ts",
        "tailwind.config.ts",
      ],
      allowWithReason: [
        ".env.local",
      ],
    };
  }

  /**
   * Load current workspace state
   */
  async load(version: string): Promise<WorkspaceSnapshot> {
    // In production, this would read from the filesystem
    const snapshot: WorkspaceSnapshot = {
      version,
      timestamp: Date.now(),
      files: [],
      directories: [],
      hash: this.generateHash(version + Date.now()),
    };

    return snapshot;
  }

  /**
   * Create a workspace snapshot from files
   */
  createSnapshot(version: string, files: WorkspaceFile[]): WorkspaceSnapshot {
    const snapshot: WorkspaceSnapshot = {
      version,
      timestamp: Date.now(),
      files,
      directories: [],
      hash: this.generateHash(JSON.stringify(files)),
    };

    this.snapshots.set(version, snapshot);
    return snapshot;
  }

  /**
   * Get snapshot by version
   */
  getSnapshot(version: string): WorkspaceSnapshot | undefined {
    return this.snapshots.get(version);
  }

  /**
   * Get file from workspace
   */
  getFile(snapshot: WorkspaceSnapshot, path: string): WorkspaceFile | undefined {
    return snapshot.files.find(f => f.path === path);
  }

  /**
   * Check if a file is protected
   */
  isProtected(path: string): { protected: boolean; level: "blocked" | "confirmation" | "reason" } {
    const normalized = this.normalizePath(path);

    // Check exact paths
    for (const protectedPath of this.protectedRules.paths) {
      if (normalized === protectedPath || normalized.endsWith(`/${protectedPath}`)) {
        return { protected: true, level: "blocked" };
      }
    }

    // Check patterns
    for (const pattern of this.protectedRules.patterns) {
      if (this.matchesPattern(normalized, pattern)) {
        return { protected: true, level: "blocked" };
      }
    }

    // Check confirmation required
    for (const confirmationPath of this.protectedRules.allowWithConfirmation) {
      if (normalized === confirmationPath || normalized.endsWith(`/${confirmationPath}`)) {
        return { protected: true, level: "confirmation" };
      }
    }

    // Check reason required
    for (const reasonPath of this.protectedRules.allowWithReason) {
      if (normalized === reasonPath || normalized.endsWith(`/${reasonPath}`)) {
        return { protected: true, level: "reason" };
      }
    }

    return { protected: false, level: "blocked" };
  }

  /**
   * Check if file has changed since snapshot
   */
  hasChanged(snapshot: WorkspaceSnapshot, path: string, content: string): boolean {
    const file = this.getFile(snapshot, path);
    if (!file) return true;
    return file.hash !== this.generateHash(content);
  }

  /**
   * Generate hash from content
   */
  generateHash(content: string): string {
    // Simple hash for demonstration
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }

  /**
   * Normalize path for comparison
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/^\//, "");
  }

  /**
   * Match glob-like pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    const regex = new RegExp(
      "^" + pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, ".") + "$"
    );
    return regex.test(path);
  }
}
