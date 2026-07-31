// d:\netsyra\src\ide\types.ts

/**
 * Represents a single file or directory in the workspace.
 */
export type FileItem = {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[]; // Present if isDirectory is true
  content?: string; // Present if isDirectory is false
  language?: string; // Present if isDirectory is false
  lastModified?: number;
};

/**
 * Represents an actively opened file in the editor tabs.
 */
export type OpenFile = {
  id: string; // Correlates to the FileItem id
  path: string;
  content: string;
  language: string;
  isDirty: boolean; // Tracks if the file has unsaved changes
  cursorPosition?: {
    lineNumber: number;
    column: number;
  };
};

/**
 * Configuration options passed to the Monaco Editor.
 * Defaults mirror typical VS Code settings.
 */
export type EditorConfig = {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: boolean;
  folding: boolean;
  glyphMargin: boolean;
  autoSave: boolean;
  formatOnSave: boolean;
  bracketPairColorization: boolean;
};

/**
 * Represents the active project workspace.
 */
export type Workspace = {
  name: string;
  rootPath: string; // Virtual path namespace for the web
  files: FileItem[]; // The root file tree
};

/**
 * Available views for the left sidebar.
 */
export type SidebarView = 'explorer' | 'search' | 'extensions' | 'settings' | 'ai-chat';

/**
 * Available views for the bottom panel.
 */
export type BottomPanelView = 'terminal' | 'output' | 'problems' | 'debug';

/**
 * Available views for the right panel (AI chat).
 */
export type RightPanelView = 'ai-chat' | null;

export interface Problem {
  fileId: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source: string;
  endLine?: number;
  endColumn?: number;
  fix?: {
    range: [number, number];
    text: string;
  };
}