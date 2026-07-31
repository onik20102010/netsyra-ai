// d:\netsyra\src\components\ide\CommandPalette.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useIdeStore, FileItem } from "@/ide";
import {
  Search, FileText, FileCode, FileJson, File as FileIcon,
  Files, Puzzle, Settings, Bot, TerminalSquare, Search as SearchIcon,
  PanelLeft, PanelRight, Save, SaveAll,
  Command, CornerDownLeft,
} from "lucide-react";

// --- Command definitions ---
interface CommandDef {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
}

// Flatten workspace files for Quick Open
function flattenFiles(items: FileItem[], acc: FileItem[] = []): FileItem[] {
  for (const item of items) {
    if (!item.isDirectory) acc.push(item);
    if (item.children) flattenFiles(item.children, acc);
  }
  return acc;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'command' | 'quickOpen'>('command');
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Store actions
  const workspace = useIdeStore((s) => s.workspace);
  const openFile = useIdeStore((s) => s.openFile);
  const toggleSidebar = useIdeStore((s) => s.toggleSidebar);
  const toggleRightPanel = useIdeStore((s) => s.toggleRightPanel);
  const toggleBottomPanel = useIdeStore((s) => s.toggleBottomPanel);
  const setSidebarView = useIdeStore((s) => s.setSidebarView);
  const setBottomPanelView = useIdeStore((s) => s.setBottomPanelView);
  const isSidebarOpen = useIdeStore((s) => s.isSidebarOpen);
  const isBottomPanelOpen = useIdeStore((s) => s.isBottomPanelOpen);
  const saveFile = useIdeStore((s) => s.saveFile);
  const saveAllFiles = useIdeStore((s) => s.saveAllFiles);
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const editorConfig = useIdeStore((s) => s.editorConfig);
  const updateEditorConfig = useIdeStore((s) => s.updateEditorConfig);
  const splitEditor = useIdeStore((s) => s.splitEditor);
  const closeSplitEditor = useIdeStore((s) => s.closeSplitEditor);
  const splitEditorFileId = useIdeStore((s) => s.splitEditorFileId);

  // --- Global keyboard shortcut listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P → Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setMode('command');
        setQuery("");
        setSelectedIndex(0);
        setOpen(true);
      }
      // Ctrl+P → Quick Open
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setMode('quickOpen');
        setQuery("");
        setSelectedIndex(0);
        setOpen(true);
      }
      // Escape closes
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // --- Build command list ---
  const commands: CommandDef[] = useMemo(() => {
    const cmds: CommandDef[] = [
      // View toggles
      {
        id: 'view.toggleSidebar',
        label: 'Toggle Sidebar',
        category: 'View',
        shortcut: 'Ctrl+B',
        icon: <PanelLeft size={16} className="text-[#6e7681]" />,
        action: () => toggleSidebar(),
      },
      {
        id: 'view.toggleTerminal',
        label: 'Toggle Terminal',
        category: 'View',
        shortcut: 'Ctrl+`',
        icon: <TerminalSquare size={16} className="text-[#6e7681]" />,
        action: () => { setBottomPanelView('terminal'); toggleBottomPanel(); },
      },
      {
        id: 'view.toggleAIChat',
        label: 'Toggle AI Chat',
        category: 'View',
        shortcut: 'Ctrl+Shift+A',
        icon: <Bot size={16} className="text-[#34e8bb]" />,
        action: () => toggleRightPanel(),
      },
      {
        id: 'view.explorer',
        label: 'Show Explorer',
        category: 'View',
        shortcut: 'Ctrl+Shift+E',
        icon: <Files size={16} className="text-[#6e7681]" />,
        action: () => { setSidebarView('explorer'); if (!isSidebarOpen) toggleSidebar(); },
      },
      {
        id: 'view.search',
        label: 'Show Search',
        category: 'View',
        shortcut: 'Ctrl+Shift+F',
        icon: <SearchIcon size={16} className="text-[#6e7681]" />,
        action: () => { setSidebarView('search'); if (!isSidebarOpen) toggleSidebar(); },
      },
      {
        id: 'view.extensions',
        label: 'Show Extensions',
        category: 'View',
        shortcut: 'Ctrl+Shift+X',
        icon: <Puzzle size={16} className="text-[#6e7681]" />,
        action: () => { setSidebarView('extensions'); if (!isSidebarOpen) toggleSidebar(); },
      },
      {
        id: 'view.settings',
        label: 'Open Settings',
        category: 'View',
        shortcut: 'Ctrl+,',
        icon: <Settings size={16} className="text-[#6e7681]" />,
        action: () => { setSidebarView('settings'); if (!isSidebarOpen) toggleSidebar(); },
      },
      {
        id: 'view.problems',
        label: 'Show Problems',
        category: 'View',
        icon: <FileText size={16} className="text-[#d29922]" />,
        action: () => { setBottomPanelView('problems'); if (!isBottomPanelOpen) toggleBottomPanel(); },
      },
      {
        id: 'view.output',
        label: 'Show Output',
        category: 'View',
        icon: <FileText size={16} className="text-[#58a6ff]" />,
        action: () => { setBottomPanelView('output'); if (!isBottomPanelOpen) toggleBottomPanel(); },
      },
      {
        id: 'view.debug',
        label: 'Show Debug Console',
        category: 'View',
        icon: <FileText size={16} className="text-[#a371f7]" />,
        action: () => { setBottomPanelView('debug'); if (!isBottomPanelOpen) toggleBottomPanel(); },
      },
      // File actions
      {
        id: 'file.save',
        label: 'Save Active File',
        category: 'File',
        shortcut: 'Ctrl+S',
        icon: <Save size={16} className="text-[#6e7681]" />,
        action: () => { if (activeFileId) saveFile(activeFileId); },
      },
      {
        id: 'file.saveAll',
        label: 'Save All Files',
        category: 'File',
        shortcut: 'Ctrl+K S',
        icon: <SaveAll size={16} className="text-[#6e7681]" />,
        action: () => saveAllFiles(),
      },
      // Editor toggles
      {
        id: 'editor.toggleWordWrap',
        label: `Toggle Word Wrap (${editorConfig.wordWrap === 'on' ? 'On' : 'Off'})`,
        category: 'Editor',
        icon: <FileText size={16} className="text-[#6e7681]" />,
        action: () => updateEditorConfig({ wordWrap: editorConfig.wordWrap === 'on' ? 'off' : 'on' }),
      },
      {
        id: 'editor.toggleMinimap',
        label: `Toggle Minimap (${editorConfig.minimap ? 'On' : 'Off'})`,
        category: 'Editor',
        icon: <FileText size={16} className="text-[#6e7681]" />,
        action: () => updateEditorConfig({ minimap: !editorConfig.minimap }),
      },
      // Quick Open redirect
      {
        id: 'go.quickOpen',
        label: 'Quick Open File...',
        category: 'Go',
        shortcut: 'Ctrl+P',
        icon: <Search size={16} className="text-[#34e8bb]" />,
        action: () => { setMode('quickOpen'); setQuery(""); setSelectedIndex(0); },
      },
      // Split editor
      {
        id: 'view.splitEditor',
        label: splitEditorFileId ? 'Close Split Editor' : 'Split Editor',
        category: 'View',
        shortcut: 'Ctrl+\\',
        icon: <PanelRight size={16} className="text-[#6e7681]" />,
        action: () => {
          if (splitEditorFileId) {
            closeSplitEditor();
          } else if (activeFileId) {
            const other = openFiles.find(f => f.id !== activeFileId);
            if (other) splitEditor(other.id);
          }
        },
      },
    ];
    return cmds;
  }, [toggleSidebar, toggleRightPanel, toggleBottomPanel, setSidebarView, setBottomPanelView,
      isSidebarOpen, isBottomPanelOpen, saveFile, saveAllFiles, activeFileId, openFiles, editorConfig, updateEditorConfig,
      splitEditor, closeSplitEditor, splitEditorFileId]);

  // --- Filtered results ---
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (mode === 'quickOpen') {
      if (!workspace) return [];
      const allFiles = flattenFiles(workspace.files);
      if (!q) return allFiles.slice(0, 50);
      // Fuzzy match: file path contains all characters in order
      return allFiles
        .filter(f => {
          const path = f.path.toLowerCase();
          // Simple substring match + fuzzy fallback
          if (path.includes(q)) return true;
          // Fuzzy: check if all chars of q appear in order
          let qi = 0;
          for (let i = 0; i < path.length && qi < q.length; i++) {
            if (path[i] === q[qi]) qi++;
          }
          return qi === q.length;
        })
        .slice(0, 50);
    }
    // Command mode
    if (!q) return commands;
    // Strip ">" prefix if user types it (VS Code convention)
    const cleanQ = q.startsWith('>') ? q.slice(1).trim() : q;
    return commands.filter(c =>
      c.label.toLowerCase().includes(cleanQ) || c.category.toLowerCase().includes(cleanQ)
    );
  }, [query, mode, commands, workspace]);

  // --- Handle selection ---
  const handleSelect = (idx: number) => {
    if (mode === 'command') {
      const cmd = results[idx] as CommandDef;
      if (cmd) {
        cmd.action();
        setOpen(false);
      }
    } else {
      const file = results[idx] as FileItem;
      if (file) {
        openFile(file.id);
        setOpen(false);
      }
    }
  };

  // --- Keyboard navigation ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!open) return null;

  // Get file icon
  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return <FileCode size={16} className="text-[#58a6ff]" />;
    if (['json'].includes(ext || '')) return <FileJson size={16} className="text-[#d29922]" />;
    if (['md', 'txt'].includes(ext || '')) return <FileText size={16} className="text-[#8b949e]" />;
    return <FileIcon size={16} className="text-[#6e7681]" />;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[15vh]"
        onClick={() => setOpen(false)}
      >
        {/* Palette container */}
        <div
          className="w-[90vw] max-w-[600px] bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#21262d]">
            {mode === 'command' ? (
              <Command size={16} className="text-[#34e8bb] shrink-0" />
            ) : (
              <Search size={16} className="text-[#34e8bb] shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'command' ? "Type a command..." : "Search files by name..."}
              className="flex-1 bg-transparent outline-none text-[#e6edf3] text-[14px] placeholder-[#484f58]"
              spellCheck={false}
              autoComplete="off"
            />
            {mode === 'command' && (
              <button
                onClick={() => { setMode('quickOpen'); setQuery(""); }}
                className="text-[11px] text-[#6e7681] hover:text-[#34e8bb] transition-colors px-1.5 py-0.5 rounded border border-[#30363d]"
                title="Switch to Quick Open (Ctrl+P)"
              >
                Ctrl+P
              </button>
            )}
          </div>

          {/* Results list */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-3 py-8 text-center text-[13px] text-[#6e7681]">
                {mode === 'command' ? 'No commands found' : 'No files found'}
              </div>
            ) : (
              results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                if (mode === 'command') {
                  const cmd = item as CommandDef;
                  return (
                    <div
                      key={cmd.id}
                      data-idx={idx}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1f2428]' : 'hover:bg-[#161b22]'
                      }`}
                    >
                      <span className="shrink-0">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] text-[#e6edf3]">{cmd.label}</span>
                      </div>
                      <span className="text-[10px] text-[#484f58] uppercase tracking-wider shrink-0">
                        {cmd.category}
                      </span>
                      {cmd.shortcut && (
                        <span className="text-[10px] text-[#6e7681] font-mono shrink-0 px-1.5 py-0.5 bg-[#0d1117] border border-[#21262d] rounded">
                          {cmd.shortcut}
                        </span>
                      )}
                    </div>
                  );
                } else {
                  const file = item as FileItem;
                  const filename = file.path.split('/').pop() || file.path;
                  const dir = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';
                  return (
                    <div
                      key={file.id}
                      data-idx={idx}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1f2428]' : 'hover:bg-[#161b22]'
                      }`}
                    >
                      <span className="shrink-0">{getFileIcon(file.path)}</span>
                      <span className="text-[13px] text-[#e6edf3] shrink-0">{filename}</span>
                      {dir && (
                        <span className="text-[11px] text-[#484f58] truncate">{dir}</span>
                      )}
                      {isSelected && (
                        <CornerDownLeft size={14} className="text-[#34e8bb] shrink-0 ml-auto" />
                      )}
                    </div>
                  );
                }
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#21262d] bg-[#0d1117]">
            <div className="flex items-center gap-3 text-[10px] text-[#484f58]">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded">Esc</kbd>
                Close
              </span>
            </div>
            <span className="text-[10px] text-[#34e8bb] font-medium">
              {mode === 'command' ? 'Commands' : 'Quick Open'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
