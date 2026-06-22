// src/app/ide/page.tsx – with persistent project graph loading, lifted chat state, Problems Panel, Editor Tabs, fixed ProblemsPanel types, auto‑open chat sidebar on drag near right edge (now stays open after drop), and top‑bar chat toggle button
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import Editor from "@/components/ide/Editor";
import EditorTabs from "@/components/ide/EditorTabs";
import ChatPanel, { FileBlock } from "@/components/ide/ChatPanel";
import ActivityBar from "@/components/ide/ActivityBar";
import Explorer from "@/components/ide/Explorer";
import MobileDrawer from "@/components/ide/MobileDrawer";
import BottomTabs from "@/components/ide/BottomTabs";
import ProblemsPanel from "@/components/ide/ProblemsPanel";
import { ValidationError } from "@/lib/ide/brain/patch-validator";
import { Button } from "@/components/ui/button";
import { Loader2, Menu, X, PanelLeftClose, PanelRightClose } from "lucide-react";
import {
  loadFilesFromIndexedDB,
  saveFileToIndexedDB,
  deleteFileFromIndexedDB,
  supportsFileSystemAccess,
  openLocalFolder,
  writeLocalFile,
  deleteLocalFile,
} from "@/lib/ide/local-files";
import { getFileSystemManager } from "@/lib/ide/file-system-manager";
import {
  loadPersistedGraph,
  buildProjectGraph,
  setProjectGraph,
} from "@/lib/ide/brain/project-graph";

type View = "explorer" | "search" | "chat" | "editor";

export default function IdePage() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<View>("editor");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<View | null>(null);
  const [isLocalFolder, setIsLocalFolder] = useState(false);

  // Detect screen size
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Local folder name for display
  const [localFolderName, setLocalFolderName] = useState<string | null>(null);

  // ── Workspace Intelligence ──────────────────────
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [recentEdits, setRecentEdits] = useState<{ path: string; timestamp: number }[]>([]);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number } | null>(null);
  const [currentErrors, setCurrentErrors] = useState<string[]>([]);

  // ── Lifted chat state (persists across panel toggles) ──
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatPendingFiles, setChatPendingFiles] = useState<FileBlock[]>([]);
  const [chatShowApproval, setChatShowApproval] = useState(false);

  // ── Chat sidebar auto‑open state ─────────────────
  const [showChat, setShowChat] = useState(false);

  // ── Desktop sidebar visibility (independent of activeView) ─────────────────
  const [showExplorer, setShowExplorer] = useState(true);

  // ── Problems Panel state ──
  const [problems, setProblems] = useState<{ file: string; line: number; message: string }[]>([]);
  const [problemsOpen, setProblemsOpen] = useState(true);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const filesRef = useRef(files);
  filesRef.current = files;
  const dirtyPathsRef = useRef<Set<string>>(new Set());
  const initialIndexDone = useRef(false);

  const indexAllFiles = async (files: Record<string, string>) => {
    for (const [path, content] of Object.entries(files)) {
      fetch("/api/ide/index-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const loadLocal = async () => {
      try {
        const stored = await loadFilesFromIndexedDB();
        if (Object.keys(stored).length > 0) {
          setFiles(stored);
        }
      } catch (err) {
        console.error("Failed to load from IndexedDB:", err);
      } finally {
        setLoaded(true);
      }
    };
    if (user) loadLocal();
  }, [user]);

  useEffect(() => {
    if (loaded && !initialIndexDone.current && Object.keys(files).length > 0) {
      indexAllFiles(files);
      initialIndexDone.current = true;
    }
  }, [loaded, files]);

  // ── Load persisted project graph on files change ──
  useEffect(() => {
    if (Object.keys(files).length > 0) {
      loadPersistedGraph().then(saved => {
        if (saved) {
          setProjectGraph(saved);
        }
        buildProjectGraph(files);
      });
    }
  }, [files]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLocalFolder) {
        dirtyPathsRef.current.forEach(path => {
          const content = filesRef.current[path] || "";
          saveFileToIndexedDB(path, content).catch(console.error);
        });
        dirtyPathsRef.current.clear();
        setDirtyFiles(new Set());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [files, isLocalFolder]);

  // ── Auto‑open chat sidebar when a file is dragged near the right edge ──
  useEffect(() => {
    let dragActive = false;

    const handleDragOver = (e: DragEvent) => {
      if (!dragActive) dragActive = true;
      // If mouse is within 200px of the right edge, open chat
      if (e.clientX > window.innerWidth - 200) {
        setShowChat(true);
      }
    };

    const handleDragEnd = () => {
      dragActive = false;
      // Do NOT auto-close chat after drop – user must close manually
      // setTimeout(() => setShowChat(false), 200);   // ❌ removed
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragend", handleDragEnd);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, []);

  const handleImmediateSave = async (path: string, content: string) => {
    if (isLocalFolder) {
      writeLocalFile(path, content).catch(() => {});
    } else {
      saveFileToIndexedDB(path, content).catch(() => {});
    }
    fetch("/api/ide/index-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    }).catch(() => {});
  };

  // B. Modified file selection handler – most recent first, no slice limit
  const handleSelectFile = (path: string) => {
    setActiveFile(path);
    setOpenFiles(prev => {
      const filtered = prev.filter(f => f !== path);
      return [path, ...filtered];
    });
  };

  // C. Close handler
  const handleCloseFile = (path: string) => {
    setOpenFiles(prev => prev.filter(f => f !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter(f => f !== path);
      setActiveFile(remaining[0] || null);
    }
  };

  const handleNewFile = async (path: string) => {
    setFiles(prev => ({ ...prev, [path]: "" }));
    handleSelectFile(path);
    if (isMobile || isTablet) setActiveView("editor");
    await handleImmediateSave(path, "");
  };

  const handleNewFolder = async (path: string) => {
    const placeholderPath = path + "/.gitkeep";
    setFiles(prev => ({ ...prev, [placeholderPath]: "" }));
    if (isLocalFolder) {
      writeLocalFile(placeholderPath, "").catch(console.error);
    } else {
      saveFileToIndexedDB(placeholderPath, "").catch(console.error);
    }
    fetch("/api/ide/index-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: placeholderPath, content: "" }),
    }).catch(console.error);
  };

  const handleRename = (oldPath: string, newPath: string) => {
    setFiles(prev => {
      const newFiles: Record<string, string> = {};
      for (const [p, content] of Object.entries(prev)) {
        if (p === oldPath) newFiles[newPath] = content;
        else if (p.startsWith(oldPath + "/")) {
          const relative = p.slice(oldPath.length);
          newFiles[newPath + relative] = content;
        } else newFiles[p] = content;
      }
      if (activeFile === oldPath) handleSelectFile(newPath);
      return newFiles;
    });
  };

  const handleDelete = async (path: string) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      for (const p in newFiles) {
        if (p === path || p.startsWith(path + "/")) delete newFiles[p];
      }
      if (activeFile?.startsWith(path)) {
        setActiveFile(null);
        setOpenFiles(prev => prev.filter(f => f !== path));
      }
      return newFiles;
    });
    if (isLocalFolder) {
      deleteLocalFile(path).catch(console.error);
    } else {
      deleteFileFromIndexedDB(path).catch(console.error);
    }
  };

  const handleRefresh = () => {};

  const handleOpenLocalFolder = async () => {
    if (!supportsFileSystemAccess()) {
      alert("File System Access not supported. Files will be stored in your browser.");
      return;
    }
    try {
      const localFiles = await openLocalFolder();
      setFiles(localFiles);
      setIsLocalFolder(true);
      const { dirHandle } = await import("@/lib/ide/local-files");
      if (dirHandle) setLocalFolderName(dirHandle.name);
      indexAllFiles(localFiles);
    } catch (err) {
      console.log("Folder picker cancelled or error:", err);
    }
  };

  const handleOpenProject = async () => {
    const fsManager = getFileSystemManager();
    
    if (!fsManager.isSupported()) {
      alert("File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.");
      return;
    }

    try {
      const projectHandle = await fsManager.openProject();
      if (!projectHandle) {
        return; // User cancelled
      }

      // Load all files from the project
      const allFiles = await fsManager.getAllFiles();
      const filesMap: Record<string, string> = {};

      for (const filePath of allFiles) {
        try {
          const content = await fsManager.readFile(filePath);
          filesMap[filePath] = content;
        } catch (error) {
          console.error(`Failed to read file ${filePath}:`, error);
        }
      }

      setFiles(filesMap);
      setIsLocalFolder(true);
      setLocalFolderName(projectHandle.name);
      indexAllFiles(filesMap);
      
      // Switch to explorer view
      setActiveView("explorer");
    } catch (error) {
      console.error("Failed to open project:", error);
      alert("Failed to open project. Please try again.");
    }
  };

  const handleImportProject = (projectName: string, importedFiles: Record<string, string>) => {
    const prefixedFiles: Record<string, string> = {};
    for (const [path, content] of Object.entries(importedFiles)) {
      const newPath = projectName ? `${projectName}/${path}` : path;
      prefixedFiles[newPath] = content;
    }
    setFiles(prev => ({ ...prev, ...prefixedFiles }));
    indexAllFiles(prefixedFiles);
  };

  // 1. Updated handleViewChange for ActivityBar
  const handleViewChange = (v: string) => {
    if (v === "explorer") {
      // On desktop: toggle sidebar independently
      // On mobile/tablet: toggle activeView
      if (!isMobile && !isTablet) {
        setShowExplorer(prev => !prev);
      } else {
        setActiveView(prev => prev === "explorer" ? "editor" : "explorer");
      }
    } else if (v === "chat") {
      setShowChat(prev => !prev);
    }
  };

  // ── Render the editor with tabs ─────────────────
  const renderEditorWithTabs = () => (
    <div className="flex-1 min-w-0 flex flex-col">
      <EditorTabs
        openFiles={openFiles}
        activeFile={activeFile}
        onSelectFile={handleSelectFile}
        onCloseFile={handleCloseFile}
      />
      <div className="flex-1">
        <Editor
          fileName={activeFile}
          content={activeFile ? files[activeFile] || "" : ""}
          onChange={(value: string | undefined) => {
            if (activeFile && value !== undefined) {
              setFiles(prev => ({ ...prev, [activeFile]: value }));
              setRecentEdits(prev => {
                const filtered = prev.filter(e => e.path !== activeFile);
                return [{ path: activeFile, timestamp: Date.now() }, ...filtered].slice(0, 10);
              });
              dirtyPathsRef.current.add(activeFile);
              if (isLocalFolder) writeLocalFile(activeFile, value).catch(console.error);
            }
          }}
          onCursorChange={(line, column) => setCursorPosition({ line, column })}
          onSave={() => {}}
        />
      </div>
    </div>
  );

  const chatPanelWorkspaceProps = {
    openFiles,
    recentEdits,
    cursorPosition,
    currentErrors,
  };

  const liftedChatProps = {
    messages: chatMessages,
    setMessages: setChatMessages,
    pendingFiles: chatPendingFiles,
    setPendingFiles: setChatPendingFiles,
    showApproval: chatShowApproval,
    setShowApproval: setChatShowApproval,
  };

  // Common props for all ChatPanel instances
  const chatPanelFullProps = {
    activeFile,
    fileContent: activeFile ? files[activeFile] : "",
    onFileWrite: (path: string, content: string) => {
      setFiles(prev => ({ ...prev, [path]: content }));
      handleSelectFile(path);
    },
    onImmediateSave: handleImmediateSave,
    allFiles: files,
    ...chatPanelWorkspaceProps,
    ...liftedChatProps,
    onValidationChange: setProblems,
    useFileSystem: isLocalFolder,
    projectName: localFolderName || undefined,
  };

  // ── Fix ProblemsPanel types: map to ValidationError[] with a default type ──
  const problemsWithType: ValidationError[] = problems.map(e => ({
    file: e.file,
    line: e.line,
    message: e.message,
    type: (e as any).type || "syntax" as const,
  }));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
        Please log in to use the IDE.
      </div>
    );
  }

  // ─── MOBILE LAYOUT ──────────────────────────────
  if (isMobile) {
    return (
      <div className="h-screen bg-[#1e1e1e] text-gray-300 flex flex-col">
        <div className="h-10 border-b border-[#2d2d2d] flex items-center px-3 bg-[#181818] text-[13px] shrink-0">
          <button
            onClick={() => setMobileDrawer(mobileDrawer === "explorer" ? null : "explorer")}
            className="p-1.5 rounded hover:bg-[#2a2d2e] mr-2"
          >
            <Menu size={18} />
          </button>
          <span className="font-medium">Netsyra IDE</span>
          <span className="text-gray-500 ml-2 text-xs">{activeFile?.split("/").pop()}</span>
        </div>

        <div className="flex-1 min-h-0">
          {renderEditorWithTabs()}
        </div>

        <BottomTabs
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view as View);
            setMobileDrawer(view === "editor" ? null : view as View);
          }}
        />

        <MobileDrawer
          open={mobileDrawer !== null}
          onClose={() => setMobileDrawer(null)}
        >
          {mobileDrawer === "explorer" && (
            <Explorer
              files={files}
              activeFile={activeFile}
              onSelectFile={(path) => { handleSelectFile(path); setMobileDrawer(null); setActiveView("editor"); }}
              onNewFile={handleNewFile}
              onNewFolder={handleNewFolder}
              onRename={handleRename}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              onImportProject={handleImportProject}
              onOpenFolder={handleOpenLocalFolder}
              loaded={loaded}
              dirtyFiles={dirtyFiles}
              rootFolderName={localFolderName || undefined}
            />
          )}
          {mobileDrawer === "chat" && (
            <ChatPanel {...chatPanelFullProps} />
          )}
        </MobileDrawer>

        {/* Problems Panel at bottom (mobile) */}
        <ProblemsPanel
          errors={problemsWithType}
          isOpen={problemsOpen}
          onToggle={() => setProblemsOpen(!problemsOpen)}
        />
      </div>
    );
  }

  // ─── TABLET LAYOUT ──────────────────────────────
  if (isTablet) {
    return (
      <div className="h-screen bg-[#1e1e1e] text-gray-300 flex flex-col">
        <div className="h-10 border-b border-[#2d2d2d] flex items-center px-3 bg-[#181818] text-[13px] shrink-0">
          <button
            onClick={() => setActiveView(activeView === "explorer" ? "editor" : "explorer")}
            className="p-1.5 rounded hover:bg-[#2a2d2e] mr-2"
          >
            <PanelLeftClose size={18} />
          </button>
          <span className="font-medium">Netsyra IDE</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeView === "explorer" && (
            <div className="w-64 flex-shrink-0 border-r border-[#2d2d2d]">
              <Explorer
                files={files}
                activeFile={activeFile}
                onSelectFile={(path) => { handleSelectFile(path); setActiveView("editor"); }}
                onNewFile={handleNewFile}
                onNewFolder={handleNewFolder}
                onRename={handleRename}
                onDelete={handleDelete}
                onRefresh={handleRefresh}
                onImportProject={handleImportProject}
                onOpenFolder={handleOpenLocalFolder}
                loaded={loaded}
                dirtyFiles={dirtyFiles}
                rootFolderName={localFolderName || undefined}
              />
            </div>
          )}
          {renderEditorWithTabs()}
        </div>

        <BottomTabs
          activeView={activeView}
          onViewChange={(view) => {
            if (view === "chat") setActiveView("chat" as View);
            else if (view === "explorer") setActiveView("explorer" as View);
            else setActiveView("editor" as View);
          }}
        />

        {/* Problems Panel at bottom (tablet) */}
        <ProblemsPanel
          errors={problemsWithType}
          isOpen={problemsOpen}
          onToggle={() => setProblemsOpen(!problemsOpen)}
        />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ─────────────────────────────
  return (
    <div className="h-screen bg-[#1e1e1e] text-gray-300 flex flex-col">
      {/* 2. Updated top bar with independent toggles for sidebar and chat */}
      <div className="h-8 border-b border-[#2d2d2d] flex items-center px-3 bg-[#323233] text-[13px] shrink-0">
        <span>Netsyra IDE</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowExplorer(prev => !prev)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              showExplorer
                ? "bg-blue-600 text-white"
                : "bg-[#2d2d3d] text-gray-400 hover:text-white"
            }`}
            title="Toggle sidebar"
          >
            {showExplorer ? "Hide Sidebar" : "Show Sidebar"}
          </button>
          <button
            onClick={() => setShowChat(prev => !prev)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              showChat
                ? "bg-blue-600 text-white"
                : "bg-[#2d2d3d] text-gray-400 hover:text-white"
            }`}
            title="Toggle chat panel"
          >
            {showChat ? "Close Chat" : "Open Chat"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ActivityBar 
          activeView={!isMobile && !isTablet ? (showExplorer ? "explorer" : "editor") : activeView}
          onViewChange={(v: string) => handleViewChange(v)}
          onOpenProject={handleOpenProject}
        />

        {showExplorer && (
          <div className="w-72 flex-shrink-0 border-r border-[#2d2d2d]">
            <Explorer
              files={files}
              activeFile={activeFile}
              onSelectFile={handleSelectFile}
              onNewFile={handleNewFile}
              onNewFolder={handleNewFolder}
              onRename={handleRename}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              onImportProject={handleImportProject}
              onOpenFolder={handleOpenLocalFolder}
              loaded={loaded}
              dirtyFiles={dirtyFiles}
              rootFolderName={localFolderName || undefined}
            />
          </div>
        )}

        {renderEditorWithTabs()}

        {/* 3. Chat panel visibility now based solely on showChat */}
        {showChat && (
          <div className="w-96 flex-shrink-0 border-l border-[#2d2d2d]">
            <ChatPanel {...chatPanelFullProps} />
          </div>
        )}
      </div>

      {/* Problems Panel at bottom (desktop) */}
      <ProblemsPanel
        errors={problemsWithType}
        isOpen={problemsOpen}
        onToggle={() => setProblemsOpen(!problemsOpen)}
      />
    </div>
  );
}