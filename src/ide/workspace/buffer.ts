import type { TextBuffer, CursorPosition, TextSelection, ScrollPosition, FileHandle } from "./types";

export class InMemoryTextBuffer implements TextBuffer {
  text = "";
  originalText = "";
  originalHash = "";

  constructor(text = "", originalHash = "") {
    this.text = text;
    this.originalText = text;
    this.originalHash = originalHash;
  }

  getText(): string {
    return this.text;
  }

  setText(text: string): void {
    this.text = text;
  }

  isDirty(): boolean {
    return this.text !== this.originalText;
  }

  reset(): void {
    this.text = this.originalText;
  }
}

export function createFileHandle(path: string, node: FileHandle["node"], content: string, originalHash: string): FileHandle {
  return {
    id: path,
    path,
    node,
    buffer: new InMemoryTextBuffer(content, originalHash),
    dirty: false,
    opened: true,
    readonly: node.readonly,
    cursor: { line: 0, column: 0 },
    selection: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } },
    scroll: { top: 0, left: 0 },
    undoStack: [],
    redoStack: [],
    decorations: [],
    aiMarkers: [],
  };
}

export class BufferManager {
  private buffers = new Map<string, FileHandle>();

  get(path: string): FileHandle | undefined {
    return this.buffers.get(path);
  }

  set(path: string, handle: FileHandle): void {
    this.buffers.set(path, handle);
  }

  has(path: string): boolean {
    return this.buffers.has(path);
  }

  delete(path: string): boolean {
    const handle = this.buffers.get(path);
    if (handle?.dirty) return false;
    this.buffers.delete(path);
    return true;
  }

  list(): FileHandle[] {
    return Array.from(this.buffers.values());
  }

  updateCursor(path: string, cursor: CursorPosition): void {
    const handle = this.buffers.get(path);
    if (handle) handle.cursor = cursor;
  }

  updateSelection(path: string, selection: TextSelection): void {
    const handle = this.buffers.get(path);
    if (handle) handle.selection = selection;
  }

  updateScroll(path: string, scroll: ScrollPosition): void {
    const handle = this.buffers.get(path);
    if (handle) handle.scroll = scroll;
  }

  pushUndo(path: string, snapshot: string): void {
    const handle = this.buffers.get(path);
    if (handle) {
      handle.undoStack.push(snapshot);
      if (handle.undoStack.length > 50) handle.undoStack.shift();
      handle.redoStack = [];
    }
  }

  undo(path: string): string | undefined {
    const handle = this.buffers.get(path);
    if (!handle || handle.undoStack.length === 0) return undefined;
    const current = handle.buffer.getText();
    const previous = handle.undoStack.pop()!;
    handle.redoStack.push(current);
    handle.buffer.setText(previous);
    return previous;
  }

  redo(path: string): string | undefined {
    const handle = this.buffers.get(path);
    if (!handle || handle.redoStack.length === 0) return undefined;
    const current = handle.buffer.getText();
    const next = handle.redoStack.pop()!;
    handle.undoStack.push(current);
    handle.buffer.setText(next);
    return next;
  }
}
