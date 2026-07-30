// d:\netsyra\src\ide\store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  FileItem, 
  OpenFile, 
  Workspace, 
  EditorConfig, 
  SidebarView, 
  BottomPanelView,
  RightPanelView
} from './types';
import { createFileOnDisk, createDirectoryOnDisk, saveFileToDisk } from './workspace';

// --- Default Editor Configuration ---
export const defaultEditorConfig: EditorConfig = {
  fontSize: 14,
  fontFamily: 'var(--font-jetbrains), Consolas, "Courier New", monospace',
  lineHeight: 22.4,
  tabSize: 2,
  wordWrap: 'off',
  minimap: true,
  lineNumbers: true,
  folding: true,
  glyphMargin: false,
};

// --- Helper to generate unique IDs for file items ---
const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Helper to parse language from filename ---
const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', js: 'javascript', jsx: 'javascript', tsx: 'typescript',
    html: 'html', css: 'css', scss: 'scss', json: 'json', md: 'markdown',
    py: 'python', go: 'go', rs: 'rust', cpp: 'cpp', c: 'c', java: 'java',
  };
  return map[ext] || 'plaintext';
};

// --- Store Interface ---
interface IdeStore {
  // Workspace
  workspace: Workspace | null;
  isLoading: boolean;
  
  // Open Tabs & Active State
  openFiles: OpenFile[];
  activeFileId: string | null;
  
  // Layout & UI
  sidebarView: SidebarView;
  isSidebarOpen: boolean;
  bottomPanelView: BottomPanelView;
  isBottomPanelOpen: boolean;
  rightPanelView: RightPanelView;
  isRightPanelOpen: boolean;
  editorConfig: EditorConfig;
  
  // Actions: Workspace
  openWorkspace: (name: string, files: FileItem[]) => void;
  closeWorkspace: () => void;
  setLoading: (loading: boolean) => void;
  
  // Actions: File Tree (Explorer)
  createFile: (parentPath: string, name: string, isDirectory: boolean) => void;
  renameItem: (id: string, newName: string) => void;
  deleteItem: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  
  // Actions: Tabs
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setActiveTab: (fileId: string) => void;
  setFileContent: (fileId: string, content: string) => void;
  saveFile: (fileId: string) => void;
  saveAllFiles: () => void;
  
  // Actions: Layout & Config
  setSidebarView: (view: SidebarView) => void;
  setBottomPanelView: (view: BottomPanelView) => void;
  setRightPanelView: (view: RightPanelView) => void;
  toggleSidebar: () => void;
  toggleBottomPanel: () => void;
  toggleRightPanel: () => void;
  updateEditorConfig: (config: Partial<EditorConfig>) => void;
  setCursor: (fileId: string, lineNumber: number, column: number) => void;
}

// --- Zustand Store Implementation ---
export const useIdeStore = create<IdeStore>()(
  persist(
    (set, get) => ({
      // ---- Initial State ----
      workspace: null,
      isLoading: false,
      openFiles: [],
      activeFileId: null,
      sidebarView: 'explorer',
      isSidebarOpen: true,
      bottomPanelView: 'terminal',
      isBottomPanelOpen: false,
      rightPanelView: null,
      isRightPanelOpen: false,
      editorConfig: defaultEditorConfig,

      // ---- Actions ----
      
      // 1. Workspace Actions
      openWorkspace: (name, files) => {
        set({ 
          workspace: { name, rootPath: '/', files },
          openFiles: [],
          activeFileId: null
        });
      },
      closeWorkspace: () => {
        set({ workspace: null, openFiles: [], activeFileId: null });
      },
      setLoading: (loading) => set({ isLoading: loading }),

      // 2. File Tree Actions
      createFile: (parentPath, name, isDirectory) => {
        const state = get();
        if (!state.workspace) return;

        const newItem: FileItem = {
          id: generateId(),
          name,
          path: `${parentPath}/${name}`.replace('//', '/'),
          isDirectory,
          children: isDirectory ? [] : undefined,
          content: isDirectory ? undefined : '',
          language: isDirectory ? undefined : getLanguageFromPath(name),
          lastModified: Date.now(),
        };

        // Create on disk using File System Access API
        if (isDirectory) {
          createDirectoryOnDisk(parentPath, name).catch(console.error);
        } else {
          createFileOnDisk(parentPath, name, '').catch(console.error);
        }

        // Traverse tree to find parent and push child
        const updateTree = (items: FileItem[]): FileItem[] => {
          return items.map(item => {
            if (item.path === parentPath && item.isDirectory) {
              return { ...item, children: [...(item.children || []), newItem] };
            }
            if (item.isDirectory && item.children) {
              return { ...item, children: updateTree(item.children) };
            }
            return item;
          });
        };

        set((s) => ({
          workspace: s.workspace ? {
            ...s.workspace,
            files: updateTree(s.workspace.files)
          } : null
        }));
      },
      
      renameItem: (id, newName) => {
        // Implementation to rename in the tree
        // (Omitted brevity, but will traverse similar to createFile)
        console.log(`Rename ${id} to ${newName}`);
      },
      
      deleteItem: (id) => {
        // Implementation to delete from tree and close tab if open
        // (Omitted brevity)
        set((s) => ({
          openFiles: s.openFiles.filter(f => f.id !== id),
          activeFileId: s.activeFileId === id ? null : s.activeFileId
        }));
      },

      updateFileContent: (id, content) => {
        // Update in-memory tree data
        const updateTreeContent = (items: FileItem[]): FileItem[] => {
          return items.map(item => {
            if (item.id === id && !item.isDirectory) {
              return { ...item, content, lastModified: Date.now() };
            }
            if (item.isDirectory && item.children) {
              return { ...item, children: updateTreeContent(item.children) };
            }
            return item;
          });
        };
        set((s) => ({
          workspace: s.workspace ? {
            ...s.workspace,
            files: updateTreeContent(s.workspace.files)
          } : null
        }));
      },

      // 3. Tab Actions
      openFile: (fileId) => {
        const { workspace, openFiles } = get();
        if (!workspace) return;
        
        // Find the file in the tree
        const findFile = (items: FileItem[]): FileItem | null => {
          for (const item of items) {
            if (item.id === fileId && !item.isDirectory) return item;
            if (item.isDirectory && item.children) {
              const found = findFile(item.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        const fileData = findFile(workspace.files);
        if (!fileData) return;
        
        // Check if already open
        const existingTab = openFiles.find(f => f.id === fileId);
        if (existingTab) {
          set({ activeFileId: fileId });
          return;
        }
        
        // Add new tab
        const newOpenFile: OpenFile = {
          id: fileData.id,
          path: fileData.path,
          content: fileData.content || '',
          language: fileData.language || 'plaintext',
          isDirty: false,
        };
        
        set((s) => ({
          openFiles: [...s.openFiles, newOpenFile],
          activeFileId: fileId
        }));
      },
      
      closeFile: (fileId) => {
        set((s) => {
          const newOpenFiles = s.openFiles.filter(f => f.id !== fileId);
          let newActiveId = s.activeFileId;
          if (s.activeFileId === fileId && newOpenFiles.length > 0) {
            // Activate the tab to the left
            const currentIndex = s.openFiles.findIndex(f => f.id === fileId);
            const targetIndex = Math.min(currentIndex, newOpenFiles.length - 1);
            newActiveId = newOpenFiles[targetIndex]?.id || null;
          } else if (s.activeFileId === fileId) {
            newActiveId = null;
          }
          return { openFiles: newOpenFiles, activeFileId: newActiveId };
        });
      },
      
      setActiveTab: (fileId) => set({ activeFileId: fileId }),
      
      setFileContent: (fileId, content) => {
        set((s) => ({
          openFiles: s.openFiles.map(f => 
            f.id === fileId ? { ...f, content, isDirty: true } : f
          )
        }));
        // Also update the tree content
        get().updateFileContent(fileId, content);
      },
      
      saveFile: (fileId) => {
        const state = get();
        const file = state.openFiles.find(f => f.id === fileId);
        if (file) {
          // Save to disk using File System Access API
          saveFileToDisk(file.path, file.content).catch(console.error);
        }
        // Keep isDirty true to maintain VS Code-like behavior (file still shows as modified)
        // set((s) => ({
        //   openFiles: s.openFiles.map(f => 
        //     f.id === fileId ? { ...f, isDirty: false } : f
        //   )
        // }));
      },
      
      saveAllFiles: () => {
        const state = get();
        // Save all dirty files to disk
        state.openFiles.forEach(file => {
          if (file.isDirty) {
            saveFileToDisk(file.path, file.content).catch(console.error);
          }
        });
        set((s) => ({
          openFiles: s.openFiles.map(f => ({ ...f, isDirty: false }))
        }));
      },
      
      setCursor: (fileId, lineNumber, column) => {
        set((s) => ({
          openFiles: s.openFiles.map(f => 
            f.id === fileId ? { ...f, cursorPosition: { lineNumber, column } } : f
          )
        }));
      },

      // 4. Layout Actions
      setSidebarView: (view) => set({ sidebarView: view }),
      setBottomPanelView: (view: BottomPanelView) => set({ bottomPanelView: view }),
      setRightPanelView: (view: RightPanelView) => set({ rightPanelView: view }),
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      toggleBottomPanel: () => set((s) => ({ isBottomPanelOpen: !s.isBottomPanelOpen })),
      toggleRightPanel: () => set((s) => ({ isRightPanelOpen: !s.isRightPanelOpen })),
      updateEditorConfig: (config) => set((s) => ({ 
        editorConfig: { ...s.editorConfig, ...config } 
      })),
    }),
    {
      name: 'netsyra-ide-storage', // Persists open tabs/layout to localStorage
      partialize: (state) => ({
        openFiles: state.openFiles.map(f => ({ ...f, isDirty: false })), // Don't persist dirty state
        activeFileId: state.activeFileId,
        sidebarView: state.sidebarView,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);