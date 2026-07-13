/**
 * Patch Parser
 * 
 * Parses various patch formats into structured FilePatch objects.
 */

import type { FilePatch, PatchOperation, PatchBlock, PatchHunk } from "./types";

export class PatchParser {
  /**
   * Parse a single patch from generated content
   */
  parseFromGenerated(
    content: string,
    path: string,
    operation: PatchOperation,
    executionId: string,
    taskId: string,
    reasoning: string
  ): FilePatch {
    // Detect if content contains unified diff markers
    if (content.includes("@@") && content.includes("---")) {
      return this.parseUnifiedDiff(content, path, executionId, taskId, reasoning);
    }

    // Detect file markers
    if (content.includes("// File:") || content.includes("File:")) {
      return this.parseFileBlock(content, path, operation, executionId, taskId, reasoning);
    }

    // Detect structural blocks
    if (content.includes("<<<<<<< ") || content.includes("<!-- BLOCK:")) {
      return this.parseStructuralPatch(content, path, operation, executionId, taskId, reasoning);
    }

    // Default: whole file content
    return {
      id: this.generateId(),
      executionId,
      taskId,
      path,
      operation,
      newContent: content,
      dependencies: [],
      confidence: 1.0,
      reasoning,
      timestamp: Date.now(),
    };
  }

  /**
   * Parse unified diff format
   */
  private parseUnifiedDiff(
    content: string,
    path: string,
    executionId: string,
    taskId: string,
    reasoning: string
  ): FilePatch {
    const hunks: PatchHunk[] = [];
    const lines = content.split("\n");
    let currentHunk: PatchHunk | null = null;
    let hunkLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("@@")) {
        if (currentHunk) {
          currentHunk.lines = hunkLines.join("\n");
          hunks.push(currentHunk);
        }
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (match) {
          currentHunk = {
            oldStart: parseInt(match[1], 10),
            oldLines: match[2] ? parseInt(match[2], 10) : 1,
            newStart: parseInt(match[3], 10),
            newLines: match[4] ? parseInt(match[4], 10) : 1,
            lines: "",
            header: line,
          };
          hunkLines = [];
        }
      } else if (currentHunk) {
        hunkLines.push(line);
      }
    }

    if (currentHunk) {
      currentHunk.lines = hunkLines.join("\n");
      hunks.push(currentHunk);
    }

    return {
      id: this.generateId(),
      executionId,
      taskId,
      path,
      operation: "update",
      patchContent: content,
      hunks,
      dependencies: [],
      confidence: 0.95,
      reasoning,
      timestamp: Date.now(),
    };
  }

  /**
   * Parse file block with marker
   */
  private parseFileBlock(
    content: string,
    path: string,
    operation: PatchOperation,
    executionId: string,
    taskId: string,
    reasoning: string
  ): FilePatch {
    const marker = /(?:\/\/\s*File:|File:|##\s*File:|###\s*File:)\s*(.+?)(?:\r?\n)/i;
    const match = content.match(marker);
    const extractedPath = match ? match[1].trim() : path;
    const cleanContent = content.replace(marker, "").trim();

    return {
      id: this.generateId(),
      executionId,
      taskId,
      path: extractedPath,
      operation,
      newContent: cleanContent,
      dependencies: [],
      confidence: 1.0,
      reasoning,
      timestamp: Date.now(),
    };
  }

  /**
   * Parse structural patch with blocks
   */
  private parseStructuralPatch(
    content: string,
    path: string,
    operation: PatchOperation,
    executionId: string,
    taskId: string,
    reasoning: string
  ): FilePatch {
    const blocks: PatchBlock[] = [];
    const blockPattern = /<!--\s*BLOCK:\s*(\w+)\s*TARGET:\s*(.+?)\s*-->([\s\S]*?)<!--\s*\/BLOCK\s*-->/g;
    let match;

    while ((match = blockPattern.exec(content)) !== null) {
      const type = match[1] as "replace" | "insert" | "remove";
      const target = match[2].trim();
      const blockContent = match[3].trim();

      blocks.push({
        id: this.generateId(),
        type,
        target,
        content: blockContent,
        path,
      });
    }

    return {
      id: this.generateId(),
      executionId,
      taskId,
      path,
      operation,
      newContent: content,
      blocks,
      dependencies: [],
      confidence: 0.9,
      reasoning,
      timestamp: Date.now(),
    };
  }

  /**
   * Convert content patch to structured blocks
   */
  contentToBlocks(originalContent: string, newContent: string): PatchBlock[] {
    // Simple structural block extraction based on changed sections
    const originalLines = originalContent.split("\n");
    const newLines = newContent.split("\n");
    const blocks: PatchBlock[] = [];

    let i = 0;
    let j = 0;

    while (i < originalLines.length || j < newLines.length) {
      if (i >= originalLines.length) {
        blocks.push({
          id: this.generateId(),
          type: "insert",
          content: newLines.slice(j).join("\n"),
          newContent: newLines.slice(j).join("\n"),
        });
        break;
      }

      if (j >= newLines.length) {
        blocks.push({
          id: this.generateId(),
          type: "remove",
          oldContent: originalLines.slice(i).join("\n"),
        });
        break;
      }

      if (originalLines[i] !== newLines[j]) {
        // Find block of changed lines
        const oldStart = i;
        const newStart = j;

        while (i < originalLines.length && (j >= newLines.length || originalLines[i] !== newLines[j])) {
          i++;
        }

        while (j < newLines.length && (i >= originalLines.length || originalLines[i] !== newLines[j])) {
          j++;
        }

        blocks.push({
          id: this.generateId(),
          type: "replace",
          oldContent: originalLines.slice(oldStart, i).join("\n"),
          newContent: newLines.slice(newStart, j).join("\n"),
          startLine: oldStart + 1,
          endLine: i,
        });
      } else {
        i++;
        j++;
      }
    }

    return blocks;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
