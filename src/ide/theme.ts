// d:\netsyra\src\ide\theme.ts

import type { Monaco } from "@monaco-editor/react";

export const NETSYRA_THEME = "netsyra-dark-plus";

/**
 * Defines and registers the VS Code Dark+ theme for the Monaco editor.
 * Colors are pulled directly from VS Code's default dark theme tokens.
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
      // --- Editor Backgrounds & Borders ---
      "editor.background": "#1e1e1e",
      "editor.foreground": "#d4d4d4",
      "editorLineNumber.foreground": "#858585",
      "editorLineNumber.activeForeground": "#c6c6c6",
      "editorIndentGuide.background": "#404040",
      "editorIndentGuide.activeBackground": "#707070",
      "editorRuler.foreground": "#444444",
      "editorCursor.foreground": "#a7a7a7", // Blinking cursor
      "editor.selectionBackground": "#264f78",
      "editor.selectionHighlightBackground": "#2a2d2e",
      "editor.wordHighlightBackground": "#2a2d2e",
      "editor.wordHighlightStrongBackground": "#2a2d2e",
      "editor.findMatchBackground": "#515a6b",
      "editor.findMatchHighlightBackground": "#2a2d2e",
      "editor.findRangeHighlightBackground": "#2a2d2e",
      "editor.hoverHighlightBackground": "#2a2d2e",
      "editor.lineHighlightBackground": "#2a2d2e",
      "editor.lineHighlightBorder": "#2a2d2e",
      "editorWhitespace.foreground": "#3b3b3b",
      
      // --- Editor Widgets (Find, Suggestions) ---
      "editorWidget.background": "#252526",
      "editorWidget.border": "#454545",
      "editorSuggestWidget.background": "#252526",
      "editorSuggestWidget.border": "#454545",
      "editorSuggestWidget.foreground": "#d4d4d4",
      "editorSuggestWidget.highlightForeground": "#0097fb",
      "editorSuggestWidget.selectedBackground": "#2a2d2e",

      // --- Tabs and Menus ---
      "tab.activeBackground": "#1e1e1e",
      "tab.activeForeground": "#ffffff",
      "tab.inactiveBackground": "#2d2d2d",
      "tab.inactiveForeground": "#969696",
      "tab.border": "#252526",
      "tab.activeBorder": "#007acc",
      "tab.hoverBackground": "#2d2d2d",
      "tab.unfocusedActiveBackground": "#1e1e1e",
      "tab.unfocusedInactiveBackground": "#2d2d2d",
      "tab.unfocusedActiveForeground": "#969696",
      "tab.unfocusedInactiveForeground": "#969696",
      
      // --- Sidebars & Activity Bar ---
      "activityBar.background": "#333333",
      "activityBar.foreground": "#ffffff",
      "activityBar.inactiveForeground": "#858585",
      "activityBar.border": "#252526",
      "activityBarBadge.background": "#007acc",
      "activityBarBadge.foreground": "#ffffff",
      "sideBar.background": "#252526",
      "sideBar.foreground": "#cccccc",
      "sideBar.border": "#252526",
      "sideBarSectionHeader.background": "#252526",
      "sideBarSectionHeader.foreground": "#cccccc",
      "sideBarTitle.foreground": "#cccccc",

      // --- Status Bar ---
      "statusBar.background": "#007acc",
      "statusBar.foreground": "#ffffff",
      "statusBar.border": "#252526",
      "statusBar.noFolderBackground": "#68217a",
      "statusBar.noFolderForeground": "#ffffff",
      "statusBarItem.activeBackground": "#ffffff29",
      "statusBarItem.hoverBackground": "#ffffff1a",
      "statusBarItem.remoteBackground": "#16825d",
      "statusBarItem.remoteForeground": "#ffffff",

      // --- Inputs & Buttons ---
      "input.background": "#3c3c3c",
      "input.foreground": "#cccccc",
      "input.border": "#3c3c3c",
      "input.placeholderForeground": "#aaaaaa",
      "inputOption.activeBorder": "#007acc",
      "button.background": "#007acc",
      "button.foreground": "#ffffff",
      "button.hoverBackground": "#0062a3",
      
      // --- Lists & Trees (Explorer) ---
      "list.background": "#252526",
      "list.foreground": "#cccccc",
      "list.hoverBackground": "#2a2d2e",
      "list.activeSelectionBackground": "#04395e",
      "list.activeSelectionForeground": "#ffffff",
      "list.inactiveSelectionBackground": "#37373d",
      "list.inactiveSelectionForeground": "#cccccc",
      "list.focusBackground": "#04395e",
      "list.focusForeground": "#ffffff",
      "list.dropBackground": "#383b3d",
      "tree.indentGuidesStroke": "#585858",
      
      // --- Terminal Colors ---
      "terminal.background": "#1e1e1e",
      "terminal.foreground": "#cccccc",
      "terminal.ansiBlack": "#000000",
      "terminal.ansiBlue": "#2472c8",
      "terminal.ansiBrightBlack": "#666666",
      "terminal.ansiBrightBlue": "#3b8eea",
      "terminal.ansiBrightCyan": "#29b8db",
      "terminal.ansiBrightGreen": "#23d18b",
      "terminal.ansiBrightMagenta": "#d670d6",
      "terminal.ansiBrightRed": "#f14c4c",
      "terminal.ansiBrightWhite": "#e5e5e5",
      "terminal.ansiBrightYellow": "#f5f543",
      "terminal.ansiCyan": "#11a8cd",
      "terminal.ansiGreen": "#0dbc79",
      "terminal.ansiMagenta": "#bc3fbc",
      "terminal.ansiRed": "#cd3131",
      "terminal.ansiWhite": "#e5e5e5",
      "terminal.ansiYellow": "#e5e510",
      "terminal.border": "#252526",
      "terminal.selectionBackground": "#264f78",
    },
  });
}