/**
 * Conflict Detector
 * 
 * Detects merge conflicts between generated patches and current workspace state.
 */

import type { FilePatch, ConflictReport, WorkspaceSnapshot } from "./types";
import { WorkspaceState } from "./workspace-state";

export class ConflictDetector {
  private workspaceState: WorkspaceState;

  constructor(workspaceState: WorkspaceState) {
    this.workspaceState = workspaceState;
  }

  /**
   * Detect conflicts for a patch
   */
  detect(patch: FilePatch, snapshot: WorkspaceSnapshot): ConflictReport[] {
    const conflicts: ConflictReport[] = [];
    const currentFile = this.workspaceState.getFile(snapshot, patch.path);

    // Check if file was modified since generated
    if (currentFile && patch.originalHash && patch.originalHash !== currentFile.hash) {
      conflicts.push({
        id: this.generateId(),
        patchId: patch.id,
        path: patch.path,
        type: "line",
        description: "File has been modified since patch was generated",
        severity: "warning",
        originalContent: patch.originalContent,
        generatedContent: patch.newContent,
        currentContent: currentFile.content,
        autoResolvable: true,
      });
    }

    // Check if file was deleted
    if (patch.originalHash && !currentFile) {
      conflicts.push({
        id: this.generateId(),
        patchId: patch.id,
        path: patch.path,
        type: "deleted",
        description: "File was deleted after patch generation",
        severity: "error",
        autoResolvable: false,
      });
    }

    // Check if file exists but patch wants to create
    if (patch.operation === "create" && currentFile) {
      conflicts.push({
        id: this.generateId(),
        patchId: patch.id,
        path: patch.path,
        type: "overlap",
        description: "File already exists; create operation conflicts",
        severity: "error",
        autoResolvable: false,
      });
    }

    // Check overlapping symbol edits
    if (patch.newContent && currentFile) {
      const overlaps = this.detectOverlappingEdits(patch, currentFile.content);
      conflicts.push(...overlaps);
    }

    // Check import changes
    if (patch.newContent && currentFile && currentFile.content.includes("import ") && patch.newContent.includes("import ")) {
      const importConflicts = this.detectImportConflicts(patch, currentFile.content);
      conflicts.push(...importConflicts);
    }

    return conflicts;
  }

  /**
   * Detect overlapping edits
   */
  private detectOverlappingEdits(patch: FilePatch, currentContent: string): ConflictReport[] {
    const conflicts: ConflictReport[] = [];
    const generatedLines = new Set((patch.newContent || "").split("\n"));
    const currentLines = currentContent.split("\n");

    // Simple overlap detection: if the patch target lines have changed in current version
    const patchLines = patch.patchContent || patch.newContent || "";
    const patchLineSet = new Set(patchLines.split("\n"));

    const currentChanged = currentLines.filter(line => !patchLineSet.has(line));

    if (currentChanged.length > 0) {
      conflicts.push({
        id: this.generateId(),
        patchId: patch.id,
        path: patch.path,
        type: "overlap",
        description: `Detected ${currentChanged.length} lines changed since patch generation`,
        severity: "warning",
        autoResolvable: currentChanged.length < 10,
      });
    }

    return conflicts;
  }

  /**
   * Detect import conflicts
   */
  private detectImportConflicts(patch: FilePatch, currentContent: string): ConflictReport[] {
    const conflicts: ConflictReport[] = [];

    const extractImports = (content: string): string[] => {
      const regex = /import\s+.*?\s+from\s+['"](.*?)['"];?/g;
      const imports: string[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      return imports;
    };

    const currentImports = extractImports(currentContent);
    const patchImports = extractImports(patch.newContent || "");

    const conflicting = currentImports.filter(imp => patchImports.includes(imp));
    if (conflicting.length > 0) {
      conflicts.push({
        id: this.generateId(),
        patchId: patch.id,
        path: patch.path,
        type: "import",
        description: `Conflicting imports: ${conflicting.join(", ")}`,
        severity: "info",
        autoResolvable: true,
      });
    }

    return conflicts;
  }

  /**
   * Check if conflicts can be auto-resolved
   */
  canAutoResolve(conflicts: ConflictReport[]): boolean {
    return conflicts.length === 0 || conflicts.every(c => c.autoResolvable && c.severity !== "error");
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
