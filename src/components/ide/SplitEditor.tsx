// d:\netsyra\src\components\ide\SplitEditor.tsx
"use client";

import React, { useRef, useEffect } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { X, SplitSquareHorizontal, SplitSquareVertical } from "lucide-react";
import {
  useIdeStore,
  defineNetsyraTheme,
  NETSYRA_THEME,
  buildEditorOptions,
} from "@/ide";

/**
 * A secondary Monaco editor shown beside the primary editor when the user
 * splits the editor. Reads the file identified by `splitEditorFileId` from
 * the store and renders it. Includes a small toolbar to close the split or
 * toggle orientation.
 */
export function SplitEditor() {
  const splitEditorFileId = useIdeStore((s) => s.splitEditorFileId);
  const splitEditorOrientation = useIdeStore((s) => s.splitEditorOrientation);
  const closeSplitEditor = useIdeStore((s) => s.closeSplitEditor);
  const setSplitOrientation = useIdeStore((s) => s.setSplitOrientation);
  const openFiles = useIdeStore((s) => s.openFiles);
  const setFileContent = useIdeStore((s) => s.setFileContent);
  const editorConfig = useIdeStore((s) => s.editorConfig);

  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const splitFile = openFiles.find((f) => f.id === splitEditorFileId) ?? null;

  // --- Resize observer to keep Monaco layout correct ---
  useEffect(() => {
    if (containerRef.current && editorRef.current) {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      resizeObserverRef.current = new ResizeObserver(() => {
        editorRef.current?.layout();
      });
      resizeObserverRef.current.observe(containerRef.current);
    }
    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [splitFile?.id, splitEditorOrientation]);

  // --- Cleanup editor on unmount or split close ---
  useEffect(() => {
    if (!splitFile && editorRef.current) {
      editorRef.current.dispose?.();
      editorRef.current = null;
    }
  }, [splitFile]);

  if (!splitFile) return null;

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();
    editor.layout();
    if (containerRef.current) {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      resizeObserverRef.current = new ResizeObserver(() => editor.layout());
      resizeObserverRef.current.observe(containerRef.current);
    }
  };

  const handleChange = (value: string | undefined) => {
    if (splitFile && value !== undefined) {
      setFileContent(splitFile.id, value);
    }
  };

  const filename = splitFile.path.split("/").pop() || splitFile.path;

  return (
    <div className="flex flex-col h-full min-w-0 bg-[#0d1117] border-l border-[#1f2428]">
      {/* Split editor toolbar */}
      <div className="flex items-center justify-between h-[28px] px-2 bg-[#161b22] border-b border-[#1f2428] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] text-[#34e8bb] font-medium truncate">
            {filename}
          </span>
          <span className="text-[10px] text-[#484f58] uppercase tracking-wider shrink-0">
            Split
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setSplitOrientation(splitEditorOrientation === 'horizontal' ? 'vertical' : 'horizontal')}
            className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
            title={`Switch to ${splitEditorOrientation === 'horizontal' ? 'vertical' : 'horizontal'} split`}
          >
            {splitEditorOrientation === 'horizontal' ? (
              <SplitSquareVertical size={14} />
            ) : (
              <SplitSquareHorizontal size={14} />
            )}
          </button>
          <button
            onClick={closeSplitEditor}
            className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#f85149] transition-colors"
            title="Close split editor"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Monaco editor */}
      <div ref={containerRef} className="flex-1 overflow-hidden min-h-0 relative">
        <Editor
          height="100%"
          path={splitFile.path + "::split"}
          language={splitFile.language}
          value={splitFile.content}
          theme={NETSYRA_THEME}
          beforeMount={defineNetsyraTheme}
          onMount={handleMount}
          onChange={handleChange}
          options={{
            ...buildEditorOptions(editorConfig),
            // Read-only is false; user can edit. But we suppress the minimap to save space in split.
            minimap: { enabled: false, scale: 1, showSlider: "mouseover", renderCharacters: false },
          }}
        />
      </div>
    </div>
  );
}
