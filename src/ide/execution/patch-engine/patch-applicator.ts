/**
 * Patch Applicator
 * 
 * Applies file patches to the workspace with transaction support and formatting.
 */

import type { FilePatch, FilePatchResult, WorkspaceFile, WorkspaceSnapshot } from "./types";
import { StructuralMerge } from "./structural-merge";
import { WorkspaceState } from "./workspace-state";

export class PatchApplicator {
  private structuralMerge: StructuralMerge;
  private workspaceState: WorkspaceState;

  constructor(workspaceState: WorkspaceState) {
    this.structuralMerge = new StructuralMerge();
    this.workspaceState = workspaceState;
  }

  /**
   * Apply a patch to the workspace
   */
  async apply(patch: FilePatch, snapshot: WorkspaceSnapshot): Promise<FilePatchResult> {
    const startTime = Date.now();
    const currentFile = this.workspaceState.getFile(snapshot, patch.path);

    try {
      // Check protected files
      const protection = this.workspaceState.isProtected(patch.path);
      if (protection.protected && protection.level === "blocked") {
        return this.createResult(patch, "failed", "Cannot modify protected file", currentFile);
      }

      let newContent = "";
      let status: "applied" | "merged" | "skipped" = "applied";

      switch (patch.operation) {
        case "create":
          newContent = this.createFile(patch);
          break;
        case "update":
        case "replace":
        case "replace_block":
        case "insert_block":
        case "remove_block":
        case "update_imports":
        case "update_exports":
        case "update_dependencies":
        case "update_config":
          newContent = this.updateFile(patch, currentFile);
          status = currentFile ? "merged" : "applied";
          break;
        case "delete":
          newContent = "";
          status = "applied";
          break;
        case "rename":
        case "move":
          newContent = this.updateFile(patch, currentFile);
          status = "merged";
          break;
        case "copy":
          newContent = patch.newContent || currentFile?.content || "";
          status = "applied";
          break;
        case "create_folder":
        case "delete_folder":
        case "rename_folder":
        case "move_folder":
          newContent = "";
          status = "applied";
          break;
        default:
          return this.createResult(patch, "failed", "Unknown operation", currentFile);
      }

      const duration = Date.now() - startTime;
      const originalHash = currentFile?.hash || "";
      const updatedHash = this.workspaceState.generateHash(newContent);

      return {
        patchId: patch.id,
        path: patch.path,
        operation: patch.operation,
        status,
        originalContent: currentFile?.content,
        newContent: newContent || "",
        originalHash,
        updatedHash,
        duration,
      };
    } catch (error) {
      return this.createResult(
        patch,
        "failed",
        error instanceof Error ? error.message : String(error),
        currentFile
      );
    }
  }

  /**
   * Create a new file
   */
  private createFile(patch: FilePatch): string {
    return patch.newContent || "";
  }

  /**
   * Update an existing file
   */
  private updateFile(patch: FilePatch, currentFile?: WorkspaceFile): string {
    const currentContent = currentFile?.content || "";

    if (patch.operation === "update_imports") {
      return this.structuralMerge.mergeImports(currentContent, patch.newContent || "");
    }

    if (patch.operation === "update_exports") {
      return this.structuralMerge.mergeImports(currentContent, patch.newContent || "");
    }

    return this.structuralMerge.merge(patch, currentFile) || (patch.newContent || "");
  }

  /**
   * Apply formatting to file content
   */
  formatContent(content: string, language?: string): string {
    // Basic formatting
    let formatted = content.replace(/[ \t]+$/gm, "");
    formatted = formatted.trimEnd() + "\n";
    formatted = formatted.replace(/\n{3,}/g, "\n\n");

    if (language === "typescript" || language === "javascript") {
      formatted = this.formatJSContent(formatted);
    }

    return formatted;
  }

  /**
   * Format JavaScript/TypeScript content
   */
  private formatJSContent(content: string): string {
    // Simple formatting: add spacing around braces and operators
    return content
      .replace(/\{\s*\}/g, "{ }")
      .replace(/,\s*/g, ", ")
      .replace(/;\s*/g, "; ")
      .replace(/\s*\n\s*\n/g, "\n\n");
  }

  /**
   * Create a patch result
   */
  private createResult(
    patch: FilePatch,
    status: "applied" | "failed" | "merged" | "skipped",
    error?: string,
    currentFile?: WorkspaceFile
  ): FilePatchResult {
    return {
      patchId: patch.id,
      path: patch.path,
      operation: patch.operation,
      status,
      originalContent: currentFile?.content,
      originalHash: currentFile?.hash,
      error,
      duration: 0,
    };
  }
}
