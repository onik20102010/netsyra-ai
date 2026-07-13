import type { Diagnostic, FileNode } from "./types";

export class DiagnosticsManager {
  private diagnostics = new Map<string, Diagnostic[]>();

  get(path: string): Diagnostic[] {
    return [...(this.diagnostics.get(path) ?? [])];
  }

  set(path: string, items: Diagnostic[]): void {
    this.diagnostics.set(path, [...items]);
  }

  add(path: string, diagnostic: Diagnostic): void {
    const items = this.diagnostics.get(path) ?? [];
    items.push(diagnostic);
    this.diagnostics.set(path, items);
  }

  clear(path: string): void {
    this.diagnostics.delete(path);
  }

  clearAll(): void {
    this.diagnostics.clear();
  }

  getForNode(node: FileNode): Diagnostic[] {
    return this.get(node.path);
  }

  getAll(): Record<string, Diagnostic[]> {
    return Object.fromEntries(this.diagnostics);
  }
}
