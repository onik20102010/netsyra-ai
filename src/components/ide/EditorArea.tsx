"use client";

import React, { useEffect, useState } from "react";
import { Editor, type Monaco } from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileCode, Loader2, ChevronRight } from "lucide-react";
import { type OpenFile, getFileIcon } from "./file-utils";
import { type RuntimeEventMessage } from "@/hooks/useRuntime";

interface EditorAreaProps {
  openFiles: OpenFile[];
  activeFile: string | null;
  onFileSelect: (id: string) => void;
  onFileClose: (id: string) => void;
  onFileChange: (id: string, value: string) => void;
  onSave?: () => void;
  events: RuntimeEventMessage[];
}

function Breadcrumbs({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return <span className="text-ide-foreground-dim">root</span>;
  return (
    <div className="flex items-center gap-1 text-ide-xs text-ide-foreground-dim">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className="hover:text-ide-foreground cursor-pointer transition-colors">{part}</span>
          {i < parts.length - 1 && <ChevronRight size={10} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export function EditorArea({ openFiles, activeFile, onFileSelect, onFileClose, onFileChange, onSave, events }: EditorAreaProps) {
  const active = openFiles.find((f) => f.id === activeFile);
  const [editor, setEditor] = useState<ReturnType<Monaco["editor"]["create"]> | null>(null);
  const [monaco, setMonaco] = useState<Monaco | null>(null);

  const activePath = active?.path ?? "";
  const diagnostics = events.filter((e) => {
    const p = e.payload as { file?: string; diagnostics?: { line: number; message: string; severity?: string }[] } | undefined;
    return p?.diagnostics && p.file === activePath;
  });

  useEffect(() => {
    if (!editor || !monaco || !active) return;
    const model = editor.getModel();
    if (!model) return;
    const markers: Parameters<typeof monaco.editor.setModelMarkers>[2] = [];
    diagnostics.forEach((evt) => {
      const p = evt.payload as { diagnostics?: { line: number; message: string; severity?: string }[] };
      p.diagnostics?.forEach((d) => {
        const severityMap: Record<string, typeof monaco.MarkerSeverity.Error> = {
          error: monaco.MarkerSeverity.Error,
          warning: monaco.MarkerSeverity.Warning,
          info: monaco.MarkerSeverity.Info,
          hint: monaco.MarkerSeverity.Hint,
        };
        markers.push({
          severity: severityMap[d.severity ?? "error"] ?? monaco.MarkerSeverity.Error,
          startLineNumber: d.line,
          startColumn: 1,
          endLineNumber: d.line,
          endColumn: model.getLineLength(d.line) + 1,
          message: d.message,
          resource: model.uri,
        });
      });
    });
    monaco.editor.setModelMarkers(model, "netsyra-runtime", markers);
  }, [editor, monaco, active, diagnostics]);

  return (
    <div className="flex flex-col h-full bg-ide-bg">
      <div className="flex items-center h-9 bg-ide-surface border-b border-ide-border overflow-x-auto ide-scroll">
        {openFiles.length === 0 && (
          <div className="px-3 text-ide-sm text-ide-foreground-dim">No files open</div>
        )}
        {openFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file.id)}
            className={`group flex items-center gap-2 px-3 h-full min-w-[120px] max-w-[200px] border-r border-ide-border text-ide-sm transition-colors ${
              activeFile === file.id
                ? "bg-ide-bg text-ide-foreground border-t-2 border-t-ide-primary"
                : "bg-ide-surface text-ide-foreground-muted hover:bg-ide-bg"
            }`}
          >
            {getFileIcon(file.name, "file")}
            <span className="flex-1 truncate">{file.name}</span>
            {file.unsaved && <span className="w-1.5 h-1.5 rounded-full bg-ide-foreground" />}
            <X
              size={12}
              onClick={(e) => { e.stopPropagation(); onFileClose(file.id); }}
              className="opacity-0 group-hover:opacity-100 hover:text-ide-error text-ide-foreground-dim transition-opacity"
            />
          </button>
        ))}
      </div>

      {active && (
        <div className="h-7 px-3 flex items-center gap-2 bg-ide-bg border-b border-ide-border">
          <Breadcrumbs path={active.path} />
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="h-full"
            >
              <Editor
                height="100%"
                language={active.language}
                value={active.content}
                theme="vs-dark"
                onChange={(value) => value !== undefined && onFileChange(active.id, value)}
                onMount={(ed, m) => { ed.focus(); setEditor(ed); setMonaco(m); if (onSave) ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => onSave()); }}
                options={{
                  minimap: { enabled: true, scale: 1, showSlider: "mouseover" },
                  stickyScroll: { enabled: true },
                  bracketPairColorization: { enabled: true },
                  folding: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  autoIndent: "advanced",
                  smoothScrolling: true,
                  cursorSmoothCaretAnimation: "on",
                  fontSize: 13,
                  fontFamily: "var(--font-jetbrains), monospace",
                  scrollBeyondLastLine: false,
                  renderLineHighlight: "all",
                  lineNumbers: "on",
                  glyphMargin: true,
                  contextmenu: true,
                  quickSuggestions: true,
                  wordBasedSuggestions: "currentDocument",
                  automaticLayout: true,
                  codeLens: true,
                  inlayHints: { enabled: "on" },
                  hover: { enabled: true, delay: 300 },
                }}
                loading={
                  <div className="h-full flex items-center justify-center text-ide-foreground-dim text-ide-sm">
                    <Loader2 size={16} className="animate-spin mr-2" /> Loading editor...
                  </div>
                }
              />
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-ide-foreground-dim gap-4">
              <FileCode size={48} className="opacity-20" />
              <div className="text-center">
                <p className="text-ide-lg font-medium text-ide-foreground">Netsyra IDE</p>
                <p className="text-ide-sm mt-1">Open a file from the Explorer to start editing</p>
              </div>
              <div className="flex items-center gap-2 text-ide-xs text-ide-foreground-dim">
                <span className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border">⌘P</span>
                <span>Quick Open</span>
                <span className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border">⌘K</span>
                <span>Command Palette</span>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
