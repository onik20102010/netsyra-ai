// ═══════════════════════════════════════════════════════════════
// Netsyra IDE — Core Type Definitions
// ═══════════════════════════════════════════════════════════════

// ── File System ─────────────────────────────────────────────────

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  handle?: FileSystemHandle;
  children?: FileItem[];
}

export interface OpenFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  originalContent: string;
  unsaved: boolean;
  pinned: boolean;
  preview: boolean;
  handle?: FileSystemFileHandle;
  viewState?: unknown;
}

// ── Editor ──────────────────────────────────────────────────────

export type EditorTheme = "netsyra-dark" | "netsyra-light";

export interface EditorConfig {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
  lineNumbers: boolean;
  glyphMargin: boolean;
  folding: boolean;
}

export const defaultEditorConfig: EditorConfig = {
  fontSize: 14,
  fontFamily: "Consolas, 'Courier New', monospace",
  lineHeight: 19,
  tabSize: 2,
  wordWrap: "off",
  minimap: true,
  lineNumbers: true,
  glyphMargin: true,
  folding: true,
};

// ── Layout ──────────────────────────────────────────────────────

export type ActivityView =
  | "explorer"
  | "search"
  | "source-control"
  | "run-debug"
  | "extensions";

export type BottomTab = "terminal" | "output" | "problems" | "debug";

export interface LayoutState {
  activeView: ActivityView;
  activeBottomTab: BottomTab;
  sidebarVisible: boolean;
  bottomPanelVisible: boolean;
  sidebarWidth: number;
  bottomPanelHeight: number;
}

export const defaultLayoutState: LayoutState = {
  activeView: "explorer",
  activeBottomTab: "terminal",
  sidebarVisible: true,
  bottomPanelVisible: true,
  sidebarWidth: 240,
  bottomPanelHeight: 200,
};

// ── Workspace ───────────────────────────────────────────────────

export interface WorkspaceState {
  root: FileItem | null;
  openFiles: OpenFile[];
  activeFileId: string | null;
}

// ── Diagnostics ─────────────────────────────────────────────────

export type DiagnosticSeverity = "error" | "warning" | "info" | "hint";

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity: DiagnosticSeverity;
  source?: string;
}

// ── Commands ────────────────────────────────────────────────────

export interface Command {
  id: string;
  title: string;
  category?: string;
  keybinding?: string;
  handler: () => void;
}

// ── Theme Colors (VS Code Dark+ exact values) ───────────────────

export const IDE_COLORS = {
  // Backgrounds
  editorBg: "#1e1e1e",
  sidebarBg: "#252526",
  activityBarBg: "#333333",
  statusBarBg: "#007acc",
  titleBarBg: "#323233",
  tabActiveBg: "#1e1e1e",
  tabInactiveBg: "#2d2d2d",
  bottomPanelBg: "#1e1e1e",
  // Foregrounds
  editorFg: "#d4d4d4",
  foreground: "#cccccc",
  foregroundMuted: "#969696",
  foregroundDim: "#858585",
  // Borders
  border: "#3c3c3c",
  borderSubtle: "#2b2b2b",
  // Accent
  accent: "#007acc",
  accentDim: "#005a9e",
  // Status
  error: "#f48771",
  warning: "#cca700",
  success: "#89d185",
  info: "#75beff",
} as const;
