"use client";

import React, { useRef, useCallback } from "react";
import { Editor, type Monaco, loader } from "@monaco-editor/react";
import { ChevronRight } from "lucide-react";
import { TabBar } from "./TabBar";
import { NETSYRA_THEME, defineNetsyraTheme, buildEditorOptions, defaultEditorConfig, useIdeStore } from "@/ide";

loader.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs",
  },
});

function Breadcrumbs({ path }: { path: string }) {
  const parts = path.split("/");
  return (
    <div className="h-[22px] px-3 flex items-center gap-0.5 bg-[#1e1e1e] border-b border-[#2d2d2d] overflow-hidden shrink-0">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className="text-[12px] text-[#cccccc] truncate px-1 hover:bg-white/10 rounded cursor-pointer">
            {part}
          </span>
          {i < parts.length - 1 && <ChevronRight size={12} className="text-[#858585] shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function EmptyEditor() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center space-y-2 text-[#858585]">
        <div className="text-[14px]">Netsyra IDE</div>
        <div className="text-[12px]">Open a file from the Explorer to start editing</div>
      </div>
    </div>
  );
}

export function EditorArea() {
  const editorRef = useRef<Parameters<NonNullable<Parameters<typeof Editor>[0]["onMount"]>>[0] | null>(null);
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const setFileContent = useIdeStore((s) => s.setFileContent);
  const saveFile = useIdeStore((s) => s.saveFile);
  const setCursor = useIdeStore((s) => s.setCursor);

  const activeFile = openFiles.find((f) => f.id === activeFileId) ?? null;

  const handleMount = useCallback(
    (ed: Parameters<NonNullable<Parameters<typeof Editor>[0]["onMount"]>>[0], monaco: Monaco) => {
      editorRef.current = ed;
      defineNetsyraTheme(monaco);
      monaco.editor.setTheme(NETSYRA_THEME);
      ed.onDidChangeCursorPosition(() => {
        const pos = ed.getPosition();
        if (pos) setCursor({ lineNumber: pos.lineNumber, column: pos.column });
      });
      ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const id = useIdeStore.getState().activeFileId;
        if (id) saveFile(id);
      });
      ed.focus();
    },
    [setCursor, saveFile]
  );

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <TabBar />
      {activeFile ? (
        <>
          <Breadcrumbs path={activeFile.path} />
          <div className="flex-1 overflow-hidden min-h-0">
            <Editor
              height="100%"
              path={activeFile.path}
              language={activeFile.language}
              value={activeFile.content}
              theme={NETSYRA_THEME}
              beforeMount={(monaco) => defineNetsyraTheme(monaco)}
              onMount={handleMount}
              onChange={(value) => {
                const id = useIdeStore.getState().activeFileId;
                if (id) setFileContent(id, value ?? "");
              }}
              options={buildEditorOptions(defaultEditorConfig)}
            />
          </div>
        </>
      ) : (
        <EmptyEditor />
      )}
    </div>
  );
}
