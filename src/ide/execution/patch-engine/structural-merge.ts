/**
 * Structural Merge
 * 
 * Performs semantic merging of code structures rather than just line-based diff.
 */

import type { PatchBlock, FilePatch, WorkspaceFile } from "./types";

export class StructuralMerge {
  /**
   * Merge a patch into current file content
   */
  merge(patch: FilePatch, currentFile?: WorkspaceFile): string | null {
    const currentContent = currentFile?.content || "";
    const newContent = patch.newContent || "";

    if (patch.operation === "create") {
      return newContent;
    }

    if (patch.operation === "delete") {
      return "";
    }

    if (patch.operation === "replace") {
      return newContent;
    }

    if (patch.blocks && patch.blocks.length > 0) {
      return this.mergeBlocks(currentContent, patch.blocks);
    }

    if (patch.hunks && patch.hunks.length > 0) {
      return this.mergeHunks(currentContent, patch.hunks);
    }

    // Fallback: apply new content as whole replacement
    return newContent;
  }

  /**
   * Merge structural blocks into content
   */
  private mergeBlocks(content: string, blocks: PatchBlock[]): string {
    let result = content;

    for (const block of blocks) {
      if (block.type === "replace" && block.oldContent && block.newContent) {
        result = this.replaceBlock(result, block.oldContent, block.newContent);
      } else if (block.type === "insert" && block.content) {
        result = this.insertBlock(result, block.target, block.content, block.position || "after");
      } else if (block.type === "remove" && block.content) {
        result = this.removeBlock(result, block.content);
      }
    }

    return result;
  }

  /**
   * Merge unified diff hunks into content
   */
  private mergeHunks(content: string, hunks: { oldStart: number; oldLines: number; newContent?: string; lines: string }[]): string {
    const lines = content.split("\n");

    for (const hunk of hunks) {
      const start = hunk.oldStart - 1;
      const end = start + hunk.oldLines;

      const newLines: string[] = [];
      if (hunk.lines) {
        for (const line of hunk.lines.split("\n")) {
          if (line.startsWith("+") && !line.startsWith("++")) {
            newLines.push(line.slice(1));
          } else if (line.startsWith(" ") || (!line.startsWith("-") && !line.startsWith("+"))) {
            newLines.push(line.startsWith(" ") ? line.slice(1) : line);
          }
        }
      }

      lines.splice(start, end - start, ...newLines);
    }

    return lines.join("\n");
  }

  /**
   * Replace a block of content
   */
  private replaceBlock(content: string, oldContent: string, newContent: string): string {
    return content.replace(oldContent, newContent);
  }

  /**
   * Insert a block of content
   */
  private insertBlock(content: string, target: string | undefined, newContent: string, position: "before" | "after" | "inside"): string {
    if (!target) {
      return content + "\n" + newContent;
    }

    if (position === "inside") {
      return content.replace(target, target + "\n" + newContent);
    }

    if (position === "before") {
      return content.replace(target, newContent + "\n" + target);
    }

    return content.replace(target, target + "\n" + newContent);
  }

  /**
   * Remove a block of content
   */
  private removeBlock(content: string, oldContent: string): string {
    return content.replace(oldContent, "");
  }

  /**
   * Merge imports between current content and patch
   */
  mergeImports(currentContent: string, newContent: string): string {
    const currentImports = this.extractImports(currentContent);
    const newImports = this.extractImports(newContent);

    const combined = new Map<string, string>();
    for (const [path, statement] of currentImports) {
      combined.set(path, statement);
    }
    for (const [path, statement] of newImports) {
      combined.set(path, statement);
    }

    const mergedImportBlock = Array.from(combined.values()).sort().join("\n");
    const contentWithoutImports = newContent.replace(/(?:^|\n)import\s+.*?\s+from\s+['"].*?['"];?/g, "").trim();

    return mergedImportBlock + "\n\n" + contentWithoutImports;
  }

  /**
   * Extract imports from content
   */
  private extractImports(content: string): Map<string, string> {
    const map = new Map<string, string>();
    const regex = /import\s+.*?\s+from\s+['"](.*?)['"];?/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      map.set(match[1], match[0]);
    }
    return map;
  }

  /**
   * Merge JSX props between current and new content
   */
  mergeJSXProps(currentProps: string, newProps: string): string {
    const props = new Map<string, string>();
    const regex = /(\w+)=\{([^}]*)\}/g;
    let match;

    while ((match = regex.exec(currentProps)) !== null) {
      props.set(match[1], match[0]);
    }
    while ((match = regex.exec(newProps)) !== null) {
      props.set(match[1], match[0]);
    }

    return Array.from(props.values()).join(" ");
  }

  /**
   * Merge object properties
   */
  mergeObjectProperties(currentProps: string, newProps: string): string {
    const props = new Map<string, string>();
    const regex = /([\w$]+):\s*([^,\n]+)/g;
    let match;

    while ((match = regex.exec(currentProps)) !== null) {
      props.set(match[1], match[0]);
    }
    while ((match = regex.exec(newProps)) !== null) {
      props.set(match[1], match[0]);
    }

    return Array.from(props.values()).join(",\n");
  }
}
