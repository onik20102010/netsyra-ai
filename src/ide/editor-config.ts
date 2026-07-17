// d:\netsyra\src\ide\editor-config.ts

import type { editor } from "monaco-editor";
import type { EditorConfig } from "./types";
import { NETSYRA_THEME } from "./theme";

export function buildEditorOptions(config: EditorConfig): editor.IStandaloneEditorConstructionOptions {
  return {
    // Typography & Layout
    fontSize: config.fontSize,
    fontFamily: config.fontFamily,
    lineHeight: config.lineHeight,
    letterSpacing: 0,
    fontLigatures: true,
    automaticLayout: true, // CRITICAL FIX: Prevents overlapping/cut-off text in flex layouts

    // Gutter
    lineNumbers: "on",
    lineNumbersMinChars: 3,
    glyphMargin: config.glyphMargin,
    lineDecorationsWidth: 0,

    // Folding
    folding: config.folding,
    foldingStrategy: "auto",
    showFoldingControls: "mouseover",

    // Minimap
    minimap: {
      enabled: config.minimap,
      scale: 1,
      showSlider: "mouseover",
      renderCharacters: false,
    },

    // Scroll
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    scrollbar: {
      useShadows: false,
      vertical: "auto",
      horizontal: "auto",
      verticalScrollbarSize: 14,
      horizontalScrollbarSize: 14,
    },
    mouseWheelZoom: true,
    mouseWheelScrollSensitivity: 1,
    fastScrollSensitivity: 5,

    // Cursor
    cursorBlinking: "blink",
    cursorSmoothCaretAnimation: "off",
    cursorStyle: "line",
    cursorWidth: 2,

    // Selection
    selectOnLineNumbers: true,
    selectionHighlight: true,
    renderLineHighlight: "all",
    multiCursorModifier: "ctrlCmd",

    // Editing
    tabSize: config.tabSize,
    wordWrap: config.wordWrap,
    autoIndent: "full",
    autoClosingBrackets: "always",
    autoClosingQuotes: "always",
    formatOnPaste: true,
    formatOnType: true,
    matchBrackets: "always",

    // Guides
    guides: {
      bracketPairs: true,
      indentation: true,
      highlightActiveIndentation: true,
      bracketPairsHorizontal: true,
    },

    // Features
    bracketPairColorization: { enabled: true },
    stickyScroll: { enabled: true },
    contextmenu: true,
    fixedOverflowWidgets: true,
    linkedEditing: true,

    // Whitespace
    renderWhitespace: "selection",
    renderControlCharacters: false,

    // Suggestions
    suggestOnTriggerCharacters: true,
    quickSuggestions: { other: true, comments: false, strings: false },
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    wordBasedSuggestions: "currentDocument",
    parameterHints: { enabled: true },
    hover: { enabled: true, delay: 300 },

    // Padding
    padding: { top: 8, bottom: 8 },

    // Overview ruler
    overviewRulerBorder: false,
    overviewRulerLanes: 2,

    // Misc
    inlayHints: { enabled: "off" },
    codeLens: false,
    occurrencesHighlight: "off",

    // Theme (Passed to editor instance)
    theme: NETSYRA_THEME,
  };
}

// Keybindings (VS Code defaults)
export const EDITOR_KEYBINDINGS = {
  save: "ctrlcmd+s",
  find: "ctrlcmd+f",
  replace: "ctrlcmd+h",
  selectNext: "ctrlcmd+d",
  toggleComment: "ctrlcmd+/",
  deleteLines: "ctrlcmd+shift+k",
  moveLineUp: "alt+up",
  moveLineDown: "alt+down",
  rename: "f2",
  goToDefinition: "f12",
  peekDefinition: "alt+f12",
  triggerSuggest: "ctrlcmd+space",
  quickOutline: "ctrlcmd+shift+o",
  goToLine: "ctrlcmd+g",
} as const;