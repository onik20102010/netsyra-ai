// ═══════════════════════════════════════════════════════════════
// Netsyra IDE — Zustand Store
// Central state management for the entire IDE
// ═══════════════════════════════════════════════════════════════

import { create } from "zustand";
import type {
  FileItem,
  OpenFile,
  ActivityView,
  BottomTab,
} from "@/ide";
import { getLanguage } from "@/ide";
import {
  pickDirectory,
  buildTree,
  readFileContent,
  writeFileContent,
  saveWorkspaceHandle,
  restoreWorkspaceHandle,
  clearWorkspaceHandle,
  verifyPermission,
} from "./workspace";

// ── Cursor state ────────────────────────────────────────────────

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

// ── Store ───────────────────────────────────────────────────────

interface IdeState {
  // Workspace
  tree: FileItem[];
  rootHandle: FileSystemDirectoryHandle | null;
  workspaceName: string | null;
  loading: boolean;
  openFiles: OpenFile[];
  activeFileId: string | null;

  // Layout
  activeView: ActivityView;
  bottomTab: BottomTab;
  sidebarVisible: boolean;
  bottomVisible: boolean;
  sidebarWidth: number;
  bottomHeight: number;

  // Editor
  cursor: CursorPosition;

  // ── Workspace Actions ──
  openFolder: () => Promise<void>;
  restoreWorkspace: () => Promise<void>;
  refreshTree: () => Promise<void>;
  closeWorkspace: () => void;

  // ── File Actions ──
  openFile: (item: FileItem) => Promise<void>;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  setFileContent: (id: string, content: string) => void;
  saveFile: (id: string) => Promise<void>;

  // ── Layout Actions ──
  setActiveView: (v: ActivityView) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  toggleBottom: () => void;
  setBottomHeight: (h: number) => void;
  setBottomTab: (t: BottomTab) => void;

  setCursor: (c: CursorPosition) => void;
}

export const useIdeStore = create<IdeState>((set, get) => ({
  // ── Initial state ──
  tree: [],
  rootHandle: null,
  workspaceName: null,
  loading: false,
  openFiles: [],
  activeFileId: null,

  activeView: "explorer",
  bottomTab: "terminal",
  sidebarVisible: true,
  bottomVisible: true,
  sidebarWidth: 240,
  bottomHeight: 200,

  cursor: { lineNumber: 1, column: 1 },

  // ── Workspace Actions ──
  openFolder: async () => {
    set({ loading: true });
    const handle = await pickDirectory();
    if (!handle) {
      set({ loading: false });
      return;
    }
    const granted = await verifyPermission(handle, true);
    if (!granted) {
      set({ loading: false });
      return;
    }
    const rootItem = await buildTree(handle);
    await saveWorkspaceHandle(handle);
    set({
      tree: [rootItem],
      rootHandle: handle,
      workspaceName: handle.name,
      loading: false,
      openFiles: [],
      activeFileId: null,
    });
  },

  restoreWorkspace: async () => {
    const handle = await restoreWorkspaceHandle();
    if (!handle) return;
    const granted = await verifyPermission(handle, true);
    if (!granted) return;
    const rootItem = await buildTree(handle);
    set({
      tree: [rootItem],
      rootHandle: handle,
      workspaceName: handle.name,
    });
  },

  refreshTree: async () => {
    const { rootHandle } = get();
    if (!rootHandle) return;
    const rootItem = await buildTree(rootHandle);
    set({ tree: [rootItem] });
  },

  closeWorkspace: () => {
    clearWorkspaceHandle();
    set({
      tree: [],
      rootHandle: null,
      workspaceName: null,
      openFiles: [],
      activeFileId: null,
    });
  },

  // ── File Actions ──
  openFile: async (item) => {
    if (item.type !== "file") return;
    const existing = get().openFiles.find((f) => f.path === item.path);
    if (existing) {
      set({ activeFileId: existing.id });
      return;
    }

    let content = "";
    if (item.handle && item.handle.kind === "file") {
      content = await readFileContent(item.handle as FileSystemFileHandle);
    }

    const newFile: OpenFile = {
      id: item.id,
      name: item.name,
      path: item.path,
      language: getLanguage(item.path),
      content,
      originalContent: content,
      unsaved: false,
      pinned: false,
      preview: false,
      handle: item.handle as FileSystemFileHandle | undefined,
    };
    set((s) => ({
      openFiles: [...s.openFiles, newFile],
      activeFileId: newFile.id,
    }));
  },

  closeFile: (id) => {
    set((s) => {
      const next = s.openFiles.filter((f) => f.id !== id);
      const activeFileId =
        s.activeFileId === id
          ? next.length > 0
            ? next[next.length - 1].id
            : null
          : s.activeFileId;
      return { openFiles: next, activeFileId };
    });
  },

  setActiveFile: (id) => set({ activeFileId: id }),

  setFileContent: (id, content) =>
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.id === id
          ? { ...f, content, unsaved: content !== f.originalContent }
          : f
      ),
    })),

  saveFile: async (id) => {
    const file = get().openFiles.find((f) => f.id === id);
    if (!file || !file.handle) return;
    await writeFileContent(file.handle, file.content);
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.id === id ? { ...f, unsaved: false, originalContent: f.content } : f
      ),
    }));
  },

  // ── Layout Actions ──
  setActiveView: (v) =>
    set((s) => {
      if (v === s.activeView && s.sidebarVisible) {
        return { sidebarVisible: false };
      }
      return { activeView: v, sidebarVisible: true };
    }),

  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(170, Math.min(600, w)) }),

  toggleBottom: () => set((s) => ({ bottomVisible: !s.bottomVisible })),
  setBottomHeight: (h) => set({ bottomHeight: Math.max(80, Math.min(600, h)) }),

  setBottomTab: (t) => set({ bottomTab: t, bottomVisible: true }),

  setCursor: (c) => set({ cursor: c }),
}));
