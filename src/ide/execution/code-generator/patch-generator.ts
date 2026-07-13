/**
 * Patch Generator
 * 
 * Parses generated AI output into structured file changes.
 * Supports multi-file editing and patch extraction.
 */

import type { GeneratedFileChange, FileOperation, PatchFormat } from "./types";

export class PatchGenerator {
  /**
   * Parse generated content into file changes
   */
  parseGeneratedContent(generationType: string, content: string, targetFiles: string[] = []): GeneratedFileChange[] {
    const changes: GeneratedFileChange[] = [];

    // Try to extract multiple file blocks
    const fileBlocks = this.extractFileBlocks(content);

    if (fileBlocks.length === 0) {
      // If no file blocks, treat entire content as a single file change
      const path = targetFiles[0] || "generated-file";
      changes.push(this.createFileChange(path, this.inferOperation(generationType), content, "Generated from AI output"));
      return changes;
    }

    for (const block of fileBlocks) {
      const path = block.path || targetFiles[0] || "generated-file";
      const operation = this.inferOperation(generationType, block.operation);
      changes.push(this.createFileChange(path, operation, block.content, block.reasoning || "Generated from AI output"));
    }

    return changes;
  }

  /**
   * Extract file blocks from content
   */
  private extractFileBlocks(content: string): Array<{ path?: string; operation?: string; content: string; reasoning?: string }> {
    const blocks: Array<{ path?: string; operation?: string; content: string; reasoning?: string }> = [];

    // Match file markers like "File: path/to/file.ts" or "// File: path/to/file.ts"
    const filePattern = /(?:^|\n)(?:\/\/\s*File:|File:|##\s*File:|###\s*File:)\s*(.+?)(?:\r?\n)([\s\S]*?)(?=(?:\n(?:\/\/\s*File:|File:|##\s*File:|###\s*File:)\s*.+?\n)|$)/gi;

    let match;
    while ((match = filePattern.exec(content)) !== null) {
      const path = match[1].trim();
      const blockContent = match[2].trim();
      const reasoning = this.extractReasoning(blockContent);
      const operation = this.extractOperation(blockContent);

      blocks.push({
        path,
        operation,
        content: this.cleanContent(blockContent),
        reasoning,
      });
    }

    return blocks;
  }

  /**
   * Extract reasoning from content
   */
  private extractReasoning(content: string): string | undefined {
    const reasoningPatterns = [
      /Reasoning:\s*(.+?)(?:\n\n|\n|$)/i,
      /Explanation:\s*(.+?)(?:\n\n|\n|$)/i,
      /Why:\s*(.+?)(?:\n\n|\n|$)/i,
    ];

    for (const pattern of reasoningPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract operation from content
   */
  private extractOperation(content: string): string | undefined {
    const operationPatterns = [
      /Operation:\s*(create|edit|replace|delete|rename|patch)/i,
      /Action:\s*(create|edit|replace|delete|rename|patch)/i,
    ];

    for (const pattern of operationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return undefined;
  }

  /**
   * Clean content by removing metadata markers
   */
  private cleanContent(content: string): string {
    return content
      .replace(/<plan>[\s\S]*?<\/plan>/gi, "")
      .replace(/(?:^|\n)(?:Plan|Reasoning|Explanation|Why|Operation|Action):\s*.+(?:\n|$)/gi, "")
      .trim();
  }

  /**
   * Infer operation from generation type
   */
  private inferOperation(generationType: string, operation?: string): FileOperation {
    if (operation) {
      const valid: FileOperation[] = ["create", "edit", "replace", "delete", "rename", "patch"];
      if (valid.includes(operation as FileOperation)) {
        return operation as FileOperation;
      }
    }

    const map: Record<string, FileOperation> = {
      create_file: "create",
      edit_file: "edit",
      refactor: "edit",
      fix_bug: "edit",
      optimize: "edit",
      generate_tests: "create",
      generate_docs: "create",
      generate_sql: "create",
      generate_api: "create",
      generate_ui: "create",
      generate_backend: "create",
      migrate_framework: "edit",
      rename_symbols: "edit",
      extract_component: "edit",
      extract_hook: "edit",
      convert_language: "replace",
      update_dependencies: "edit",
      explain: "create",
      review: "create",
    };

    return map[generationType] || "edit";
  }

  /**
   * Create a file change object
   */
  private createFileChange(path: string, operation: FileOperation, content: string, reasoning: string): GeneratedFileChange {
    return {
      id: this.generateId(),
      path,
      operation,
      newContent: content,
      reasoning,
      dependencies: [],
      isVerified: false,
      verificationErrors: [],
    };
  }

  /**
   * Generate a diff for a file change
   */
  generateDiff(originalContent: string | undefined, newContent: string): PatchFormat {
    const path = "file.ts";
    return {
      type: "structured",
      path,
      content: newContent,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
