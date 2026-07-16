// ═══════════════════════════════════════════════════════════════
// Netsyra IDE — Barrel Exports
// ═══════════════════════════════════════════════════════════════

// Types
export type {
  FileItem,
  OpenFile,
  EditorTheme,
  EditorConfig,
  ActivityView,
  BottomTab,
  LayoutState,
  WorkspaceState,
  DiagnosticSeverity,
  Diagnostic,
  Command,
} from "./types";

export { defaultEditorConfig, defaultLayoutState, IDE_COLORS } from "./types";

// Theme
export { NETSYRA_THEME, defineNetsyraTheme } from "./theme";

// File utilities
export {
  getLanguage,
  getFileIcon,
  getFileName,
  getDirName,
  getExtension,
  normalizePath,
  joinPath,
} from "./file-utils";

export type { FileIconName } from "./file-utils";

// Editor config
export { buildEditorOptions, EDITOR_KEYBINDINGS } from "./editor-config";

// Store
export { useIdeStore } from "./store";
export type { CursorPosition } from "./store";
