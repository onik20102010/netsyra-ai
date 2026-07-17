"use client";

import React, { useRef, useCallback, useEffect } from "react";
import Editor, { type Monaco, loader } from "@monaco-editor/react";
import { ChevronRight } from "lucide-react";
import { TabBar } from "./TabBar";
import { 
  useIdeStore, 
  defineNetsyraTheme, 
  NETSYRA_THEME, 
  buildEditorOptions, 
  defaultEditorConfig 
} from "@/ide";

// --- Breadcrumb Component ---
function Breadcrumbs({ path }: { path: string }) {
  const parts = path.split("/");
  return (
    <div className="h-[22px] px-3 flex items-center gap-0.5 bg-zinc-900 border-b border-zinc-800 overflow-hidden shrink-0 select-none">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className="text-[12px] text-[#cccccc] truncate px-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
            {part}
          </span>
          {i < parts.length - 1 && (
            <ChevronRight size={12} className="text-[#858585] shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// --- Empty Editor Placeholder ---
function EmptyEditor() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] select-none">
      <div className="text-center space-y-2 text-[#858585]">
        <div className="text-[16px] font-medium tracking-wide">Netsyra IDE</div>
        <div className="text-[13px]">
          Open a file from the Explorer to start editing
        </div>
      </div>
    </div>
  );
}

// --- Main Editor Area Component ---
export function EditorArea() {
  // Configure Monaco CDN path & Worker environment on client-side only
  useEffect(() => {
    // 1. Point to jsdelivr (FAR more reliable than unpkg for Monaco workers)
    loader.config({
      paths: {
        vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs",
      },
    });

    // 2. CRITICAL: Define the worker URL globally so Monaco can find its background scripts
    if (typeof window !== 'undefined') {
      window.MonacoEnvironment = {
        getWorkerUrl: function (_workerId, label) {
          return `https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/base/worker/workerMain.js`;
        }
      };
    }
  }, []);

  // State
  const editorRef = useRef<Parameters<NonNullable<Parameters<typeof Editor>[0]["onMount"]>>[0] | null>(null);
  
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const setFileContent = useIdeStore((s) => s.setFileContent);
  const saveFile = useIdeStore((s) => s.saveFile);
  const setCursor = useIdeStore((s) => s.setCursor);
  const editorConfig = useIdeStore((s) => s.editorConfig);

  const activeFile = openFiles.find((f) => f.id === activeFileId) ?? null;

  // --- Monaco Mount Handler ---
  const handleMount = useCallback(
    (editor: Parameters<NonNullable<Parameters<typeof Editor>[0]["onMount"]>>[0], monaco: Monaco) => {
      editorRef.current = editor;

      // 1. Apply Theme
      defineNetsyraTheme(monaco);
      monaco.editor.setTheme(NETSYRA_THEME);

      // 2. Track cursor position for state
      editor.onDidChangeCursorPosition(() => {
        const pos = editor.getPosition();
        if (pos && activeFileId) {
          setCursor(activeFileId, pos.lineNumber, pos.column);
        }
      });

      // 3. Add "Save" keybinding (Ctrl/Cmd + S)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (activeFileId) {
          saveFile(activeFileId);
        }
      });

      // 4. Focus the editor on load
      editor.focus();

      // 5. Force layout to ensure editor stretches to container height
      editor.layout();
    },
    [setCursor, saveFile, activeFileId]
  );

  // --- Editor Change Handler ---
  const handleChange = (value: string | undefined) => {
    const id = useIdeStore.getState().activeFileId;
    if (id) {
      setFileContent(id, value ?? "");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Tabs */}
      <TabBar />

      {activeFile ? (
        <>
          {/* Breadcrumbs */}
          <Breadcrumbs path={activeFile.path} />
          
          {/* Monaco Editor Container - CRITICAL: min-h-0 prevents layout squash */}
          <div className="flex-1 overflow-hidden min-h-0 relative">
            <Editor
              height="100%"
              path={activeFile.path}
              language={activeFile.language}
              value={activeFile.content}
              theme={NETSYRA_THEME}
              beforeMount={defineNetsyraTheme}
              onMount={handleMount}
              onChange={handleChange}
              options={buildEditorOptions(editorConfig)}
            />
          </div>
        </>
      ) : (
        <EmptyEditor />
      )}
    </div>
  );
}