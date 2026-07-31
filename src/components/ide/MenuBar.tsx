// d:\netsyra\src\components\ide\MenuBar.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useIdeStore } from "@/ide";

// --- Menu item definition ---
interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: false;
  action?: () => void;
}

interface MenuSeparator {
  separator: true;
  id: string;
}

type MenuEntry = MenuItem | MenuSeparator;

interface MenuDef {
  id: string;
  label: string;
  items: MenuEntry[];
}

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Store actions
  const {
    toggleSidebar, toggleRightPanel, toggleBottomPanel,
    setSidebarView, setBottomPanelView,
    isSidebarOpen, isBottomPanelOpen, isRightPanelOpen,
    saveFile, saveAllFiles, activeFileId,
    openFiles, closeFile, setActiveTab,
    editorConfig, updateEditorConfig,
  } = useIdeStore();

  // --- Helper to dispatch a custom event for the Command Palette ---
  // (We can't directly invoke it, but we can use a global keyboard event.)
  const dispatchShortcut = (key: string, shift = false, ctrl = true) => {
    const event = new KeyboardEvent('keydown', {
      key,
      shiftKey: shift,
      ctrlKey: ctrl,
      metaKey: ctrl,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  // --- Build menus ---
  const menus: MenuDef[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'new-file', label: 'New File...', shortcut: 'Ctrl+N', action: () => dispatchShortcut('n') },
        { id: 'new-folder', label: 'New Folder...', action: () => {} },
        { id: 'sep1', separator: true },
        { id: 'open-file', label: 'Open File...', shortcut: 'Ctrl+O', action: () => {} },
        { id: 'open-folder', label: 'Open Folder...', action: () => {} },
        { id: 'sep2', separator: true },
        { id: 'save', label: 'Save', shortcut: 'Ctrl+S', disabled: !activeFileId, action: () => activeFileId && saveFile(activeFileId) },
        { id: 'save-all', label: 'Save All', shortcut: 'Ctrl+K S', disabled: openFiles.length === 0, action: () => saveAllFiles() },
        { id: 'sep3', separator: true },
        { id: 'close-tab', label: 'Close Editor', shortcut: 'Ctrl+W', disabled: !activeFileId, action: () => activeFileId && closeFile(activeFileId) },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
        { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', action: () => document.execCommand('redo') },
        { id: 'sep1', separator: true },
        { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
        { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
        { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
        { id: 'sep2', separator: true },
        { id: 'find', label: 'Find', shortcut: 'Ctrl+F', action: () => dispatchShortcut('f') },
        { id: 'replace', label: 'Replace', shortcut: 'Ctrl+H', action: () => dispatchShortcut('h') },
      ],
    },
    {
      id: 'selection',
      label: 'Selection',
      items: [
        { id: 'select-all', label: 'Select All', shortcut: 'Ctrl+A', action: () => dispatchShortcut('a') },
        { id: 'expand', label: 'Expand Selection', shortcut: 'Shift+Alt+→', action: () => {} },
        { id: 'shrink', label: 'Shrink Selection', shortcut: 'Shift+Alt+←', action: () => {} },
        { id: 'sep1', separator: true },
        { id: 'copy-line-up', label: 'Copy Line Up', shortcut: 'Shift+Alt+↑', action: () => {} },
        { id: 'copy-line-down', label: 'Copy Line Down', shortcut: 'Shift+Alt+↓', action: () => {} },
        { id: 'move-line-up', label: 'Move Line Up', shortcut: 'Alt+↑', action: () => {} },
        { id: 'move-line-down', label: 'Move Line Down', shortcut: 'Alt+↓', action: () => {} },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { id: 'command-palette', label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: () => dispatchShortcut('P', true) },
        { id: 'quick-open', label: 'Quick Open...', shortcut: 'Ctrl+P', action: () => dispatchShortcut('P', false) },
        { id: 'sep1', separator: true },
        { id: 'toggle-sidebar', label: `${isSidebarOpen ? 'Hide' : 'Show'} Sidebar`, shortcut: 'Ctrl+B', action: () => toggleSidebar() },
        { id: 'toggle-terminal', label: `${isBottomPanelOpen ? 'Hide' : 'Show'} Terminal`, shortcut: 'Ctrl+`', action: () => { setBottomPanelView('terminal'); toggleBottomPanel(); } },
        { id: 'toggle-ai', label: `${isRightPanelOpen ? 'Hide' : 'Show'} AI Chat`, shortcut: 'Ctrl+Shift+A', action: () => toggleRightPanel() },
        { id: 'sep2', separator: true },
        { id: 'explorer', label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => { setSidebarView('explorer'); if (!isSidebarOpen) toggleSidebar(); } },
        { id: 'search', label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => { setSidebarView('search'); if (!isSidebarOpen) toggleSidebar(); } },
        { id: 'extensions', label: 'Extensions', shortcut: 'Ctrl+Shift+X', action: () => { setSidebarView('extensions'); if (!isSidebarOpen) toggleSidebar(); } },
        { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,', action: () => { setSidebarView('settings'); if (!isSidebarOpen) toggleSidebar(); } },
        { id: 'sep3', separator: true },
        { id: 'word-wrap', label: `Word Wrap: ${editorConfig.wordWrap === 'on' ? 'On' : 'Off'}`, action: () => updateEditorConfig({ wordWrap: editorConfig.wordWrap === 'on' ? 'off' : 'on' }) },
        { id: 'minimap', label: `Minimap: ${editorConfig.minimap ? 'On' : 'Off'}`, action: () => updateEditorConfig({ minimap: !editorConfig.minimap }) },
      ],
    },
    {
      id: 'go',
      label: 'Go',
      items: [
        { id: 'quick-open', label: 'Quick Open File...', shortcut: 'Ctrl+P', action: () => dispatchShortcut('P', false) },
        { id: 'sep1', separator: true },
        { id: 'goto-line', label: 'Go to Line...', shortcut: 'Ctrl+G', action: () => dispatchShortcut('g') },
        { id: 'goto-symbol', label: 'Go to Symbol...', shortcut: 'Ctrl+Shift+O', action: () => dispatchShortcut('O', true) },
        { id: 'sep2', separator: true },
        { id: 'next-tab', label: 'Next Editor', shortcut: 'Ctrl+Tab', action: () => {
          if (openFiles.length === 0 || !activeFileId) return;
          const idx = openFiles.findIndex(f => f.id === activeFileId);
          const next = openFiles[(idx + 1) % openFiles.length];
          setActiveTab(next.id);
        } },
        { id: 'prev-tab', label: 'Previous Editor', shortcut: 'Ctrl+Shift+Tab', action: () => {
          if (openFiles.length === 0 || !activeFileId) return;
          const idx = openFiles.findIndex(f => f.id === activeFileId);
          const prev = openFiles[(idx - 1 + openFiles.length) % openFiles.length];
          setActiveTab(prev.id);
        } },
      ],
    },
    {
      id: 'run',
      label: 'Run',
      items: [
        { id: 'start-debug', label: 'Start Debugging', shortcut: 'F5', action: () => { setBottomPanelView('debug'); if (!isBottomPanelOpen) toggleBottomPanel(); } },
        { id: 'stop-debug', label: 'Stop Debugging', shortcut: 'Shift+F5', disabled: true, action: () => {} },
        { id: 'sep1', separator: true },
        { id: 'run-without-debug', label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: () => { setBottomPanelView('terminal'); if (!isBottomPanelOpen) toggleBottomPanel(); } },
        { id: 'sep2', separator: true },
        { id: 'toggle-breakpoint', label: 'Toggle Breakpoint', shortcut: 'F9', action: () => {} },
      ],
    },
    {
      id: 'terminal',
      label: 'Terminal',
      items: [
        { id: 'new-terminal', label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: () => { setBottomPanelView('terminal'); if (!isBottomPanelOpen) toggleBottomPanel(); } },
        { id: 'split-terminal', label: 'Split Terminal', shortcut: 'Ctrl+Shift+5', action: () => {} },
        { id: 'sep1', separator: true },
        { id: 'run-active-file', label: 'Run Active File', action: () => { setBottomPanelView('terminal'); if (!isBottomPanelOpen) toggleBottomPanel(); } },
        { id: 'run-build', label: 'Run Build Task...', shortcut: 'Ctrl+Shift+B', action: () => { setBottomPanelView('output'); if (!isBottomPanelOpen) toggleBottomPanel(); } },
        { id: 'sep2', separator: true },
        { id: 'clear-terminal', label: 'Clear Terminal', action: () => {} },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { id: 'welcome', label: 'Welcome', action: () => {} },
        { id: 'docs', label: 'Documentation', action: () => window.open('https://github.com', '_blank') },
        { id: 'sep1', separator: true },
        { id: 'shortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S', action: () => {} },
        { id: 'sep2', separator: true },
        { id: 'about', label: 'About Netsyra IDE', action: () => {} },
      ],
    },
  ];

  // --- Close menu on outside click ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenu]);

  // --- Handle item click ---
  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.action?.();
    setOpenMenu(null);
  };

  return (
    <div ref={menuBarRef} className="hidden sm:flex items-center gap-0.5 px-2 h-full relative">
      {menus.map((menu) => (
        <div key={menu.id} className="relative h-full flex items-center">
          <button
            className={`px-2.5 py-0.5 rounded cursor-pointer transition-colors text-[13px] h-full flex items-center ${
              openMenu === menu.id ? 'bg-[#161b22] text-[#e6edf3]' : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]'
            }`}
            onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
            onMouseEnter={() => { if (openMenu && openMenu !== menu.id) setOpenMenu(menu.id); }}
          >
            {menu.label}
          </button>

          {/* Dropdown */}
          {openMenu === menu.id && (
            <div className="absolute top-full left-0 mt-0 min-w-[240px] bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-[200]">
              {menu.items.map((entry) => {
                if (entry.separator) {
                  return <div key={entry.id} className="h-px bg-[#21262d] my-1 mx-2" />;
                }
                const item = entry as MenuItem;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] transition-colors text-left ${
                      item.disabled
                        ? 'text-[#484f58] cursor-not-allowed'
                        : 'text-[#e6edf3] hover:bg-[#1f2428]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[10px] text-[#6e7681] font-mono ml-4 shrink-0">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
