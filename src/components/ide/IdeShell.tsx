"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useRuntime } from "@/hooks/useRuntime";
import { ResizableSplit } from "./ResizableSplit";
import { Toaster, toast as sonner } from "sonner";
import { type FileItem, type OpenFile, getLanguage } from "./file-utils";
import { type RuntimeStatus } from "@/ide/types";
import { StatusBar } from "./StatusBar";
import { TitleBar } from "./TitleBar";
import { ActivityBar, type View } from "./ActivityBar";
import { SidebarContent } from "./SidebarContent";
import { BottomPanel, type BottomTab } from "./BottomPanel";
import { EditorArea } from "./EditorArea";
import { CommandPalette } from "./CommandPalette";
import { AgentAccessTip } from "./AgentAccessTip";
import { openWorkspace, restoreWorkspace, buildWorkspace, readFileText, writeFileText, applyFileChange } from "@/lib/workspace";

export function IdeShell() {
  const { status, error, events, connected, agentConnected, token, setToken, sendAction } = useRuntime();
  const [activeView, setActiveView] = useState<View>("explorer");
  const [activeBottom, setActiveBottom] = useState<BottomTab>("terminal");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBottom, setShowBottom] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showAccessTip, setShowAccessTip] = useState(true);
  const [workspace, setWorkspace] = useState<FileItem | null>(null);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const notify = (message: string) => {
    sonner(message);
  };

  const openFile = async (item: FileItem) => {
    if (item.type !== "file") return;
    if (!item.handle || item.handle.kind !== "file") {
      notify("Cannot open this file");
      return;
    }
    const existing = openFiles.find((f) => f.id === item.id);
    if (existing) {
      setActiveFileId(item.id);
      return;
    }
    try {
      const handle = item.handle as FileSystemFileHandle;
      const content = await readFileText(handle);
      const newFile: OpenFile = {
        id: item.id,
        name: item.name,
        path: item.path,
        language: getLanguage(item.path),
        content,
        unsaved: false,
        handle,
      };
      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFileId(item.id);
    } catch {
      notify("Failed to open file");
    }
  };

  const closeFile = (id: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  };

  const changeFile = (id: string, value: string) => {
    setOpenFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content: value, unsaved: value !== f.content } : f))
    );
  };

  const saveFile = async () => {
    if (!activeFileId) return;
    const file = openFiles.find((f) => f.id === activeFileId);
    if (!file?.handle) return;
    try {
      await writeFileText(file.handle, file.content);
      setOpenFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, unsaved: false } : f))
      );
      notify("Saved");
    } catch {
      notify("Failed to save file");
    }
  };

  const openFolder = async () => {
    const handle = await openWorkspace();
    if (!handle) return;
    notify("Opening folder...");
    try {
      const root = await buildWorkspace(handle);
      setWorkspace(root);
      setActiveView("explorer");
    } catch {
      notify("Failed to open folder");
    }
  };

  const refreshWorkspace = async () => {
    if (!workspace?.handle || workspace.handle.kind !== "directory") return;
    notify("Refreshing...");
    try {
      const root = await buildWorkspace(workspace.handle as FileSystemDirectoryHandle);
      setWorkspace(root);
    } catch {
      notify("Failed to refresh folder");
    }
  };

  useEffect(() => {
    restoreWorkspace().then((handle) => {
      if (handle) buildWorkspace(handle).then(setWorkspace);
    });
  }, []);

  useEffect(() => {
    if (error) notify(`Runtime error: ${error}`);
  }, [error]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveFile();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setShowSidebar((s) => !s);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setShowBottom((s) => !s);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeFileId, openFiles]);

  const applyChanges = async (changes: { path: string; newContent?: string; operation: string }[]) => {
    if (!workspace?.handle || workspace.handle.kind !== "directory") {
      notify("No workspace open");
      return;
    }
    const root = workspace.handle as FileSystemDirectoryHandle;
    let applied = 0;
    for (const change of changes) {
      if (!change.newContent) continue;
      try {
        await applyFileChange(root, change.path, change.newContent);
        applied++;
        setOpenFiles((prev) =>
          prev.map((f) => (f.path === change.path ? { ...f, content: change.newContent!, unsaved: false } : f))
        );
      } catch (err) {
        console.error("Failed to apply change:", err);
        notify(`Failed to apply ${change.path}`);
      }
    }
    if (applied > 0) {
      await refreshWorkspace();
      notify(`Applied ${applied} change(s)`);
    }
  };

  const handleCommand = (id: string) => {
    if (id === "toggle-sidebar") setShowSidebar((s) => !s);
    if (id === "toggle-panel") setShowBottom((s) => !s);
    if (id === "toggle-runtime") setActiveView("runtime");
    if (id === "toggle-chat") setActiveView("chat");
    if (id === "boot-runtime") void sendAction("boot");
    if (id === "restart-runtime") void sendAction("restart");
    if (id === "shutdown-runtime") void sendAction("shutdown");
    if (id === "theme-light" || id === "theme-dark") notify("Theme switching will be enabled in the next update");
    if (id === "reload-window") window.location.reload();
    if (id === "open-file") notify("Open file dialog will be enabled soon");
    if (id === "open-folder") void openFolder();
    if (id === "save") void saveFile();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-ide-bg text-ide-foreground font-sans">
      <TitleBar onCommandPalette={() => setCommandPaletteOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar active={activeView} onSelect={(v) => { setActiveView(v); setShowSidebar(true); }} />

        <ResizableSplit
          direction="horizontal"
          defaultSplit={18}
          minFirst={10}
          minSecond={20}
          showFirst={showSidebar}
          showSecond={true}
          firstPanelName="Sidebar"
          secondPanelName="Editor"
          onToggleFirst={() => setShowSidebar(true)}
          first={
            <SidebarContent
              active={activeView}
              workspace={workspace}
              openFiles={openFiles}
              activeFile={activeFileId}
              onFileOpen={openFile}
              onOpenFolder={openFolder}
              onRefresh={refreshWorkspace}
              onToast={notify}
              onApplyChanges={applyChanges}
              events={events}
              runtimeStatus={status}
            />
          }
          second={
            <ResizableSplit
              direction="vertical"
              defaultSplit={70}
              minFirst={20}
              minSecond={15}
              showFirst={true}
              showSecond={showBottom}
              firstPanelName="Editor"
              secondPanelName="Bottom Panel"
              onToggleSecond={() => setShowBottom(true)}
              first={
                <EditorArea
                  openFiles={openFiles}
                  activeFile={activeFileId}
                  onFileSelect={setActiveFileId}
                  onFileClose={closeFile}
                  onFileChange={changeFile}
                  onSave={saveFile}
                  events={events}
                />
              }
              second={
                <BottomPanel active={activeBottom} onSelect={setActiveBottom} events={events} sendAction={sendAction} />
              }
            />
          }
        />
      </div>

      <StatusBar status={status} connected={connected} onToast={notify} />

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onSelect={handleCommand} />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "hsl(220 13% 8%)", color: "hsl(220 10% 92%)", border: "1px solid hsl(220 13% 20%)" },
        }}
      />

      {error && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-ide-toast px-4 py-2 bg-ide-error text-white rounded shadow-ide-lg text-ide-sm flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <AgentAccessTip
        open={showAccessTip}
        onClose={() => setShowAccessTip(false)}
        token={token}
        setToken={setToken}
        agentConnected={agentConnected}
        onOpenFolder={openFolder}
      />
    </div>
  );
}
