// d:\netsyra\src\ide\theme.ts

import type { Monaco } from "@monaco-editor/react";

export const NETSYRA_THEME = "netsyra-dark";

/**
 * Defines and registers the Netsyra dark theme for the Monaco editor.
 * Colors are inspired by popular dark editor themes.
 */
export function defineNetsyraTheme(monaco: Monaco) {
  monaco.editor.defineTheme(NETSYRA_THEME, {
    base: "vs-dark", // Base theme to inherit from
    inherit: true,   // We are overriding specific tokens
    rules: [
      // Comments
      { token: "comment", foreground: "6a9955", fontStyle: "italic" },
      { token: "comment.doc", foreground: "6a9955", fontStyle: "italic" },
      
      // Keywords, Control, Operators
      { token: "keyword", foreground: "569cd6" },
      { token: "keyword.control", foreground: "569cd6" },
      { token: "keyword.operator", foreground: "d4d4d4" },
      { token: "keyword.operator.new", foreground: "569cd6" },
      { token: "keyword.other", foreground: "569cd6" },

      // Types, Classes, Interfaces
      { token: "type", foreground: "4ec9b0" },
      { token: "type.builtin", foreground: "4ec9b0" },
      { token: "type.alias", foreground: "4ec9b0" },
      { token: "class", foreground: "4ec9b0" },
      { token: "interface", foreground: "4ec9b0" },
      { token: "enum", foreground: "4ec9b0" },
      
      // Functions and Methods
      { token: "function", foreground: "dcdcaa" },
      { token: "function.builtin", foreground: "dcdcaa" },
      { token: "method", foreground: "dcdcaa" },
      { token: "constructor", foreground: "4ec9b0" },

      // Variables, Properties, Parameters
      { token: "variable", foreground: "9cdcfe" },
      { token: "variable.readonly", foreground: "9cdcfe" },
      { token: "variable.other", foreground: "9cdcfe" },
      { token: "property", foreground: "9cdcfe" },
      { token: "parameter", foreground: "9cdcfe" },

      // Strings, Template Strings, Regex
      { token: "string", foreground: "ce9178" },
      { token: "string.escape", foreground: "d7ba7d" },
      { token: "string.template", foreground: "ce9178" },
      { token: "regexp", foreground: "d16969" },
      
      // Numbers, Booleans
      { token: "number", foreground: "b5cea8" },
      { token: "number.float", foreground: "b5cea8" },
      { token: "number.hex", foreground: "b5cea8" },
      { token: "boolean", foreground: "569cd6" },

      // Constants, Macros
      { token: "constant", foreground: "9cdcfe" },
      { token: "constant.language", foreground: "569cd6" },
      { token: "constant.character", foreground: "ce9178" },
      { token: "macro", foreground: "569cd6" },

      // Classes/Modules/Namespaces
      { token: "namespace", foreground: "4ec9b0" },
      { token: "module", foreground: "4ec9b0" },

      // Operators and Punctuation
      { token: "delimiter", foreground: "d4d4d4" },
      { token: "delimiter.bracket", foreground: "d4d4d4" },
      { token: "delimiter.parenthesis", foreground: "d4d4d4" },
      { token: "delimiter.square", foreground: "d4d4d4" },
      { token: "operator", foreground: "d4d4d4" },

      // Meta tags (HTML, JSX)
      { token: "tag", foreground: "569cd6" },
      { token: "tag.attribute", foreground: "9cdcfe" },
      { token: "tag.delimiter", foreground: "808080" },
      { token: "tag.html", foreground: "569cd6" },

      // JSX specific
      { token: "jsx.tag", foreground: "569cd6" },
      { token: "jsx.tag.attribute", foreground: "9cdcfe" },
      { token: "jsx.string", foreground: "ce9178" },
    ],
    colors: {
      // --- Editor Backgrounds & Borders (Netsyra palette) ---
      "editor.background": "#0d1117",
      "editor.foreground": "#e6edf3",
      "editorLineNumber.foreground": "#484f58",
      "editorLineNumber.activeForeground": "#8b949e",
      "editorIndentGuide.background": "#21262d",
      "editorIndentGuide.activeBackground": "#30363d",
      "editorRuler.foreground": "#21262d",
      "editorCursor.foreground": "#34e8bb",
      "editor.selectionBackground": "#1f6feb40",
      "editor.selectionHighlightBackground": "#161b22",
      "editor.wordHighlightBackground": "#161b22",
      "editor.wordHighlightStrongBackground": "#161b22",
      "editor.findMatchBackground": "#34e8bb40",
      "editor.findMatchHighlightBackground": "#161b22",
      "editor.findRangeHighlightBackground": "#161b22",
      "editor.hoverHighlightBackground": "#161b22",
      "editor.lineHighlightBackground": "#161b22",
      "editor.lineHighlightBorder": "#161b22",
      "editorWhitespace.foreground": "#21262d",

      // --- Editor Widgets (Find, Suggestions) ---
      "editorWidget.background": "#161b22",
      "editorWidget.border": "#30363d",
      "editorSuggestWidget.background": "#161b22",
      "editorSuggestWidget.border": "#30363d",
      "editorSuggestWidget.foreground": "#e6edf3",
      "editorSuggestWidget.highlightForeground": "#34e8bb",
      "editorSuggestWidget.selectedBackground": "#1f2428",

      // --- Tabs and Menus ---
      "tab.activeBackground": "#0d1117",
      "tab.activeForeground": "#e6edf3",
      "tab.inactiveBackground": "#161b22",
      "tab.inactiveForeground": "#6e7681",
      "tab.border": "#1f2428",
      "tab.activeBorder": "#34e8bb",
      "tab.hoverBackground": "#1f2428",
      "tab.unfocusedActiveBackground": "#0d1117",
      "tab.unfocusedInactiveBackground": "#161b22",
      "tab.unfocusedActiveForeground": "#6e7681",
      "tab.unfocusedInactiveForeground": "#6e7681",

      // --- Sidebars & Activity Bar (unified) ---
      "activityBar.background": "#0d1117",
      "activityBar.foreground": "#e6edf3",
      "activityBar.inactiveForeground": "#6e7681",
      "activityBar.border": "#1f2428",
      "activityBarBadge.background": "#34e8bb",
      "activityBarBadge.foreground": "#0d1117",
      "sideBar.background": "#0d1117",
      "sideBar.foreground": "#8b949e",
      "sideBar.border": "#1f2428",
      "sideBarSectionHeader.background": "#161b22",
      "sideBarSectionHeader.foreground": "#e6edf3",
      "sideBarTitle.foreground": "#e6edf3",

      // --- Status Bar (unified — dark with teal accent, not blue) ---
      "statusBar.background": "#0d1117",
      "statusBar.foreground": "#8b949e",
      "statusBar.border": "#1f2428",
      "statusBar.noFolderBackground": "#0d1117",
      "statusBar.noFolderForeground": "#8b949e",
      "statusBarItem.activeBackground": "#34e8bb20",
      "statusBarItem.hoverBackground": "#161b22",
      "statusBarItem.remoteBackground": "#34e8bb",
      "statusBarItem.remoteForeground": "#0d1117",

      // --- Inputs & Buttons ---
      "input.background": "#161b22",
      "input.foreground": "#e6edf3",
      "input.border": "#30363d",
      "input.placeholderForeground": "#484f58",
      "inputOption.activeBorder": "#34e8bb",
      "button.background": "#34e8bb",
      "button.foreground": "#0d1117",
      "button.hoverBackground": "#2dd4a8",

      // --- Lists & Trees (Explorer) ---
      "list.background": "#0d1117",
      "list.foreground": "#8b949e",
      "list.hoverBackground": "#161b22",
      "list.activeSelectionBackground": "#1f2428",
      "list.activeSelectionForeground": "#e6edf3",
      "list.inactiveSelectionBackground": "#161b22",
      "list.inactiveSelectionForeground": "#8b949e",
      "list.focusBackground": "#1f2428",
      "list.focusForeground": "#e6edf3",
      "list.dropBackground": "#21262d",
      "tree.indentGuidesStroke": "#30363d",

      // --- Terminal Colors (unified) ---
      "terminal.background": "#0d1117",
      "terminal.foreground": "#e6edf3",
      "terminal.ansiBlack": "#484f58",
      "terminal.ansiBlue": "#58a6ff",
      "terminal.ansiBrightBlack": "#6e7681",
      "terminal.ansiBrightBlue": "#79c0ff",
      "terminal.ansiBrightCyan": "#56d4dd",
      "terminal.ansiBrightGreen": "#56d364",
      "terminal.ansiBrightMagenta": "#d2a8ff",
      "terminal.ansiBrightRed": "#ff7b72",
      "terminal.ansiBrightWhite": "#e6edf3",
      "terminal.ansiBrightYellow": "#e3b341",
      "terminal.ansiCyan": "#56d4dd",
      "terminal.ansiGreen": "#56d364",
      "terminal.ansiMagenta": "#bc8cff",
      "terminal.ansiRed": "#ff7b72",
      "terminal.ansiWhite": "#8b949e",
      "terminal.ansiYellow": "#e3b341",
      "terminal.border": "#1f2428",
      "terminal.selectionBackground": "#1f6feb40",

      // --- Scrollbar ---
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#30363d80",
      "scrollbarSlider.hoverBackground": "#484f58",
      "scrollbarSlider.activeBackground": "#484f58",

      // --- Menu ---
      "menu.background": "#161b22",
      "menu.foreground": "#e6edf3",
      "menu.border": "#30363d",
      "menu.selectionBackground": "#1f2428",
      "menu.selectionForeground": "#34e8bb",
      "menu.separatorBackground": "#21262d",

      // --- Peek & Diff ---
      "peekViewResult.background": "#161b22",
      "peekViewResult.border": "#30363d",
      "peekViewEditor.background": "#0d1117",
      "diffEditor.insertedTextBackground": "#23863630",
      "diffEditor.removedTextBackground": "#f8514930",
      "diffEditor.border": "#30363d",
    },
  });
}