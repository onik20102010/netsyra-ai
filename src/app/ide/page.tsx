"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import Editor from "@/components/ide/Editor";
import ChatPanel from "@/components/ide/ChatPanel";
import ActivityBar from "@/components/ide/ActivityBar";
import Explorer from "@/components/ide/Explorer";
import MobileDrawer from "@/components/ide/MobileDrawer";
import BottomTabs from "@/components/ide/BottomTabs";
import { Button } from "@/components/ui/button";
import { Loader2, Menu, X, PanelLeftClose, PanelRightClose } from "lucide-react";

type View = "explorer" | "search" | "chat" | "editor";

export default function IdePage() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<View>("editor");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<View | null>(null);

  // Detect screen size
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Load files from Supabase on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await fetch("/api/ide/files");
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || {});
        }
      } catch (err) {
        console.error("Failed to load IDE files:", err);
      } finally {
        setLoaded(true);
      }
    };
    if (user) loadFiles();
  }, [user]);

  // Debounced auto-save (2 seconds after last change)
  const saveQueue = useRef<Record<string, string>>({});
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const scheduleSave = useCallback((path: string, content: string) => {
    saveQueue.current[path] = content;
    setDirtyFiles(prev => new Set(prev).add(path));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const toSave = { ...saveQueue.current };
      saveQueue.current = {};
      Object.entries(toSave).forEach(([p, c]) => {
        fetch("/api/ide/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: p, content: c }),
        }).catch(console.error);
      });
      setDirtyFiles(prev => {
        const next = new Set(prev);
        Object.keys(toSave).forEach(p => next.delete(p));
        return next;
      });
    }, 2000);
  }, []);

  // Ctrl+S immediate save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        const toSave = { ...saveQueue.current };
        saveQueue.current = {};
        Object.entries(toSave).forEach(([p, c]) => {
          fetch("/api/ide/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: p, content: c }),
          }).catch(console.error);
        });
        setDirtyFiles(new Set());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // File operations
  const handleNewFile = (path: string) => {
    setFiles(prev => ({ ...prev, [path]: "" }));
    setActiveFile(path);
    if (isMobile || isTablet) setActiveView("editor");
  };
  const handleNewFolder = (path: string) => {
    const placeholderPath = path + "/.gitkeep";
    setFiles(prev => ({ ...prev, [placeholderPath]: "" }));
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
      if (activeFile === oldPath) setActiveFile(newPath);
      return newFiles;
    });
  };
  const handleDelete = async (path: string) => {
    // Immediately remove from state
    setFiles(prev => {
      const newFiles = { ...prev };
      for (const p in newFiles) {
        if (p === path || p.startsWith(path + "/")) delete newFiles[p];
      }
      if (activeFile?.startsWith(path)) setActiveFile(null);
      return newFiles;
    });
    // Delete from backend
    fetch(`/api/ide/files?path=${encodeURIComponent(path)}`, { method: "DELETE" }).catch(console.error);
  };
  const handleRefresh = () => {};

  // Import project handler
  const handleImportProject = (projectName: string, importedFiles: Record<string, string>) => {
    const prefixedFiles: Record<string, string> = {};
    for (const [path, content] of Object.entries(importedFiles)) {
      const newPath = projectName ? `${projectName}/${path}` : path;
      prefixedFiles[newPath] = content;
    }
    setFiles(prev => ({ ...prev, ...prefixedFiles }));
  };

  // Handle view change
  const handleViewChange = (view: View) => {
    if (isMobile || isTablet) {
      setMobileDrawer(view === activeView ? null : view);
    } else {
      setActiveView(view);
    }
  };

  // Loading / auth states
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
        {/* Top bar */}
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

        {/* Editor (always visible) */}
        <div className="flex-1 min-h-0">
          <Editor
            fileName={activeFile}
            content={activeFile ? files[activeFile] || "" : ""}
            onChange={(value: string | undefined) => {
              if (activeFile && value !== undefined) {
                setFiles(prev => ({ ...prev, [activeFile!]: value }));
                scheduleSave(activeFile, value);
              }
            }}
            onSave={() => {}}
          />
        </div>

        {/* Bottom tabs */}
        <BottomTabs
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view as View);
            setMobileDrawer(view === "editor" ? null : view as View);
          }}
        />

        {/* Mobile drawer (slide-over) */}
        <MobileDrawer
          open={mobileDrawer !== null}
          onClose={() => setMobileDrawer(null)}
        >
          {mobileDrawer === "explorer" && (
            <Explorer
              files={files}
              activeFile={activeFile}
              onSelectFile={(path) => { setActiveFile(path); setMobileDrawer(null); setActiveView("editor"); }}
              onNewFile={handleNewFile}
              onNewFolder={handleNewFolder}
              onRename={handleRename}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              onImportProject={handleImportProject}
              loaded={loaded}
              dirtyFiles={dirtyFiles}
            />
          )}
          {mobileDrawer === "chat" && (
            <ChatPanel
              activeFile={activeFile}
              fileContent={activeFile ? files[activeFile] : ""}
              onFileWrite={(path: string, content: string) => {
                setFiles(prev => ({ ...prev, [path]: content }));
                setActiveFile(path);
              }}
            />
          )}
        </MobileDrawer>
      </div>
    );
  }

  // ─── TABLET LAYOUT ──────────────────────────────
  if (isTablet) {
    return (
      <div className="h-screen bg-[#1e1e1e] text-gray-300 flex flex-col">
        {/* Top bar */}
        <div className="h-10 border-b border-[#2d2d2d] flex items-center px-3 bg-[#181818] text-[13px] shrink-0">
          <button
            onClick={() => setActiveView(activeView === "explorer" ? "editor" : "explorer")}
            className="p-1.5 rounded hover:bg-[#2a2d2e] mr-2"
          >
            <PanelLeftClose size={18} />
          </button>
          <span className="font-medium">Netsyra IDE</span>
        </div>

        {/* Main area */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === "explorer" && (
            <div className="w-64 flex-shrink-0 border-r border-[#2d2d2d]">
              <Explorer
                files={files}
                activeFile={activeFile}
                onSelectFile={(path) => { setActiveFile(path); setActiveView("editor"); }}
                onNewFile={handleNewFile}
                onNewFolder={handleNewFolder}
                onRename={handleRename}
                onDelete={handleDelete}
                onRefresh={handleRefresh}
                onImportProject={handleImportProject}
                loaded={loaded}
                dirtyFiles={dirtyFiles}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Editor
              fileName={activeFile}
              content={activeFile ? files[activeFile] || "" : ""}
              onChange={(value: string | undefined) => {
                if (activeFile && value !== undefined) {
                  setFiles(prev => ({ ...prev, [activeFile!]: value }));
                  scheduleSave(activeFile, value);
                }
              }}
              onSave={() => {}}
            />
          </div>
        </div>

        {/* Bottom tabs */}
        <BottomTabs
          activeView={activeView}
          onViewChange={(view) => {
            if (view === "chat") setActiveView("chat" as View);
            else if (view === "explorer") setActiveView("explorer" as View);
            else setActiveView("editor" as View);
          }}
        />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ─────────────────────────────
  return (
    <div className="h-screen bg-[#1e1e1e] text-gray-300 flex flex-col">
      {/* Title bar */}
      <div className="h-8 border-b border-[#2d2d2d] flex items-center px-3 bg-[#323233] text-[13px] shrink-0">
        Netsyra IDE
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar – accepts string; we cast internally */}
        <ActivityBar activeView={activeView} onViewChange={(v: string) => setActiveView(v as View)} />

        {/* Explorer */}
        {activeView === "explorer" && (
          <div className="w-72 flex-shrink-0 border-r border-[#2d2d2d]">
            <Explorer
              files={files}
              activeFile={activeFile}
              onSelectFile={setActiveFile}
              onNewFile={handleNewFile}
              onNewFolder={handleNewFolder}
              onRename={handleRename}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              onImportProject={handleImportProject}
              loaded={loaded}
              dirtyFiles={dirtyFiles}
            />
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 min-w-0">
          <Editor
            fileName={activeFile}
            content={activeFile ? files[activeFile] || "" : ""}
            onChange={(value: string | undefined) => {
              if (activeFile && value !== undefined) {
                setFiles(prev => ({ ...prev, [activeFile!]: value }));
                scheduleSave(activeFile, value);
              }
            }}
            onSave={() => {}}
          />
        </div>

        {/* AI Chat */}
        {activeView === "chat" && (
          <div className="w-96 flex-shrink-0 border-l border-[#2d2d2d]">
            <ChatPanel
              activeFile={activeFile}
              fileContent={activeFile ? files[activeFile] : ""}
              onFileWrite={(path: string, content: string) => {
                setFiles(prev => ({ ...prev, [path]: content }));
                setActiveFile(path);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}