import type { IRuntimeKernel } from "@/ide/kernel/types";

export type WorkspaceState = "closed" | "discovering" | "indexing" | "ready" | "error";

export interface FileSystemEntry {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modifiedAt: number;
}

export interface IFileSystem {
  readFile(path: string, encoding?: BufferEncoding): Promise<string>;
  writeFile(path: string, content: string, encoding?: BufferEncoding): Promise<void>;
  readDir(path: string): Promise<FileSystemEntry[]>;
  stat(path: string): Promise<FileSystemEntry>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  remove(path: string, recursive?: boolean): Promise<void>;
  copy(sourcePath: string, destPath: string): Promise<void>;
  watch(
    path: string,
    onChange: (event: "created" | "deleted" | "modified" | "renamed", path: string) => void
  ): Promise<() => void>;
}

export interface WorkspaceProject {
  root: string;
  name: string;
  framework?: string;
  packageManager?: string;
  gitRoot?: string;
  gitBranch?: string;
  entryPoints: string[];
  configFiles: string[];
  metadata: ProjectMetadata;
}

export interface ProjectMetadata {
  detectedFrameworks: string[];
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  hasNextConfig: boolean;
  hasDockerfile: boolean;
  hasGit: boolean;
  environmentFiles: string[];
  importantFolders: string[];
  importantFiles: string[];
  routingType?: "app" | "pages" | "mixed" | "unknown";
  buildSystem?: "next" | "vite" | "webpack" | "turbopack" | "unknown";
}

export interface WorkspaceNode {
  id: string;
  path: string;
  relativePath: string;
  name: string;
  type: "file" | "folder";
  parent?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FileNode extends WorkspaceNode {
  type: "file";
  language: string;
  size: number;
  hash: string;
  modifiedAt: number;
  encoding: string;
  readonly: boolean;
  opened: boolean;
  dirty: boolean;
  deleted: boolean;
  generated: boolean;
  temporary: boolean;
  summary: string;
  dependencies: string[];
  references: string[];
  imports: string[];
  exports: string[];
  symbols: SymbolInfo[];
  diagnostics: Diagnostic[];
}

export interface FolderNode extends WorkspaceNode {
  type: "folder";
  children: Map<string, WorkspaceNode>;
  isExpanded?: boolean;
}

export interface FileHandle {
  id: string;
  path: string;
  node: FileNode;
  buffer: TextBuffer;
  dirty: boolean;
  opened: boolean;
  readonly: boolean;
  cursor: CursorPosition;
  selection: TextSelection;
  scroll: ScrollPosition;
  undoStack: string[];
  redoStack: string[];
  decorations: unknown[];
  aiMarkers: unknown[];
}

export interface TextBuffer {
  text: string;
  originalText: string;
  originalHash: string;
  getText(): string;
  setText(text: string): void;
  isDirty(): boolean;
  reset(): void;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
}

export interface ScrollPosition {
  top: number;
  left: number;
}

export interface SymbolInfo {
  name: string;
  kind: "function" | "class" | "interface" | "type" | "variable" | "constant" | "component" | "hook" | "export" | "import";
  range: Range;
  container?: string;
}

export interface Range {
  start: CursorPosition;
  end: CursorPosition;
}

export interface Diagnostic {
  id: string;
  severity: "error" | "warning" | "info" | "suggestion";
  message: string;
  source: string;
  range: Range;
  code?: string;
}

export interface FileSummary {
  path: string;
  summary: string;
  keyPoints: string[];
  dependencies: string[];
  exports: string[];
  purpose: string;
}

export interface SearchResult {
  path: string;
  relativePath: string;
  type: "filename" | "content" | "symbol";
  line?: number;
  column?: number;
  match: string;
  context?: string;
}

export interface SearchQuery {
  text: string;
  mode?: "filename" | "content" | "symbol" | "all";
  regex?: boolean;
  caseSensitive?: boolean;
  include?: string[];
  exclude?: string[];
}

export interface GitInfo {
  root?: string;
  branch?: string;
  modified: string[];
  staged: string[];
  untracked: string[];
  ignored: string[];
  conflicts: string[];
  head?: string;
}

export interface WorkspaceOperation {
  id: string;
  type: "create" | "read" | "update" | "delete" | "rename" | "move" | "copy" | "search" | "index";
  path: string;
  status: "pending" | "success" | "failure";
  error?: string;
  timestamp: number;
}

export interface WorkspaceConfig {
  kernel?: IRuntimeKernel;
  maxFileSizeBytes?: number;
  maxFilesToIndex?: number;
  batchSize?: number;
  defaultEncoding?: BufferEncoding;
  gitAwareness?: boolean;
  fileWatching?: boolean;
}

export interface WorkspaceSnapshot {
  state: WorkspaceState;
  project: WorkspaceProject | null;
  totalFiles: number;
  totalFolders: number;
  openFiles: string[];
  dirtyFiles: string[];
  indexingProgress: number;
}
