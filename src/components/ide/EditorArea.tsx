"use client";

import React, { useRef, useCallback, useEffect } from "react";
import Editor, { type Monaco, loader } from "@monaco-editor/react";
import { ChevronRight } from "lucide-react";
import { TabBar } from "./TabBar";
import { SplitEditor } from "./SplitEditor";
import { 
  useIdeStore, 
  defineNetsyraTheme, 
  NETSYRA_THEME, 
  buildEditorOptions, 
  defaultEditorConfig,
  getDB 
} from "@/ide";
import type { Problem, FileItem } from "@/ide/types";
import { useProjectIndexer } from "@/hooks/useProjectIndexer";
import { useAuth } from "@/hooks/useAuth";

// --- Breadcrumb Component ---
function Breadcrumbs({ path }: { path: string }) {
  const parts = path.split("/");
  return (
    <div className="h-[22px] px-3 flex items-center gap-0.5 bg-[#161b22] border-b border-[#1f2428] overflow-hidden shrink-0 select-none">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className="text-[12px] text-[#8b949e] truncate px-1 hover:bg-[#1f2428] rounded cursor-pointer transition-colors">
            {part}
          </span>
          {i < parts.length - 1 && (
            <ChevronRight size={12} className="text-[#484f58] shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// --- Empty Editor Placeholder ---
function EmptyEditor() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0d1117] select-none">
      <div className="text-center space-y-2 text-[#6e7681]">
        <div className="text-[16px] font-medium tracking-wide text-[#34e8bb]">Netsyra IDE</div>
        <div className="text-[13px]">
          Open a file from the Explorer to start editing
        </div>
        <div className="text-[11px] text-[#484f58] mt-3">
          Press <kbd className="px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-[10px]">Ctrl+P</kbd> to quick-open a file
        </div>
      </div>
    </div>
  );
}

// --- Main Editor Area Component ---
export function EditorArea() {
  // Cleanup ResizeObserver on unmount
  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, []);

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
  const monacoRef = useRef<Monaco | null>(null);
  const linterWorkerRef = useRef<Worker | null>(null);
  const astWorkerRef = useRef<Worker | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const astDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extraLibsRegisteredRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  const openFiles = useIdeStore((s) => s.openFiles);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const setFileContent = useIdeStore((s) => s.setFileContent);
  const saveFile = useIdeStore((s) => s.saveFile);
  const setCursor = useIdeStore((s) => s.setCursor);
  const editorConfig = useIdeStore((s) => s.editorConfig);
  const setProblems = useIdeStore((s) => s.setProblems);
  const mergeProblems = useIdeStore((s) => s.mergeProblems);
  const workspace = useIdeStore((s) => s.workspace);

  const splitEditorFileId = useIdeStore((s) => s.splitEditorFileId);
  const splitEditorOrientation = useIdeStore((s) => s.splitEditorOrientation);
  const splitEditor = useIdeStore((s) => s.splitEditor);
  const closeSplitEditor = useIdeStore((s) => s.closeSplitEditor);

  const activeFile = openFiles.find((f) => f.id === activeFileId) ?? null;

  // --- Project Indexer (AST + IndexedDB) ---
  useProjectIndexer();
  const { user } = useAuth();
  const userId = user?.id || 'local';
  const db = getDB(userId);

  // --- AST Worker for incremental indexing ---
  const INDEXABLE_LANGUAGES = new Set(['javascript', 'typescript', 'jsx', 'tsx']);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!activeFile || !INDEXABLE_LANGUAGES.has(activeFile.language)) return;
    if (astWorkerRef.current) return;

    astWorkerRef.current = new Worker('/ast.worker.js');
    astWorkerRef.current.onmessage = async (e: MessageEvent) => {
      const { filePath, symbols, imports, relations } = e.data;
      if (!filePath) return;

      // Update file record
      const file = useIdeStore.getState().openFiles.find(f => f.path === filePath);
      if (file) {
        await db.files.put({
          id: filePath,
          path: filePath,
          hash: String(file.content.length),
          lastModified: Date.now(),
        });
      }

      // Replace old symbols with new ones
      await db.symbols.where('filePath').equals(filePath).delete();
      if (symbols && symbols.length > 0) {
        await db.symbols.bulkAdd(symbols.map((s: any) => ({
          name: s.name, kind: s.kind, filePath, line: s.line, column: s.column,
        })));
      }

      // Replace old imports
      await db.imports.where('filePath').equals(filePath).delete();
      if (imports && imports.length > 0) {
        await db.imports.put({ filePath, importedPaths: imports });
      }

      // Replace old relations (symbol graph)
      await db.relations.where('callerFilePath').equals(filePath).delete();
      if (relations && relations.length > 0) {
        await db.relations.bulkAdd(relations.map((r: any) => ({
          symbolName: r.symbolName,
          callerFilePath: r.callerFilePath,
          calleeFilePath: r.calleeFilePath,
          calleeSymbolName: r.calleeSymbolName,
          calleeKind: r.calleeKind,
        })));
      }
    };

    return () => {
      astWorkerRef.current?.terminate();
      astWorkerRef.current = null;
    };
  }, [activeFile]);

  // --- Linter Web Worker (lazy-loaded for lintable file types) ---
  const LINTABLE_LANGUAGES = new Set(['javascript', 'typescript', 'jsx', 'tsx', 'json', 'css', 'scss']);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't spin up the worker until a lintable file is opened
    if (!activeFile || !LINTABLE_LANGUAGES.has(activeFile.language)) return;
    if (linterWorkerRef.current) return; // Already initialized

    linterWorkerRef.current = new Worker('/lint.worker.js');

    linterWorkerRef.current.onmessage = (e: MessageEvent<Problem[]>) => {
      const diagnostics = e.data;
      const currentFileId = useIdeStore.getState().activeFileId;
      if (!currentFileId) return;

      // Merge ESLint problems (source starts with 'eslint' or rule IDs)
      mergeProblems(currentFileId, diagnostics, 'eslint');

      const model = editorRef.current?.getModel();
      const monaco = monacoRef.current;
      if (model && monaco) {
        const markers = diagnostics.map(d => ({
          severity: d.severity === 'error'
            ? monaco.MarkerSeverity.Error
            : d.severity === 'warning'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info,
          message: d.message,
          startLineNumber: d.line,
          startColumn: d.column,
          endLineNumber: d.endLine || d.line,
          endColumn: d.endColumn || (d.column + 20),
        }));
        monaco.editor.setModelMarkers(model, 'netsyra-eslint', markers);
      }
    };

    return () => {
      linterWorkerRef.current?.terminate();
      linterWorkerRef.current = null;
    };
  }, [setProblems, activeFile]);

  // --- Run linter on file switch ---
  useEffect(() => {
    if (activeFile && linterWorkerRef.current && LINTABLE_LANGUAGES.has(activeFile.language)) {
      linterWorkerRef.current.postMessage({
        fileId: activeFile.id,
        path: activeFile.path,
        content: activeFile.content,
        language: activeFile.language,
      });
    }
  }, [activeFileId]);

  // --- Milestone 3: Register workspace files as Monaco extraLibs (VFS) ---
  useEffect(() => {
    if (!workspace || !monacoRef.current) return;

    const flattenFiles = (files: FileItem[]): FileItem[] => {
      const result: FileItem[] = [];
      for (const file of files) {
        if (file.isDirectory) {
          if (file.children) result.push(...flattenFiles(file.children));
        } else {
          result.push(file);
        }
      }
      return result;
    };

    const flatFiles = flattenFiles(workspace.files);
    const tsFiles = flatFiles.filter(f => {
      const ext = f.path.split('.').pop()?.toLowerCase();
      return ['ts', 'tsx', 'js', 'jsx', 'd.ts'].includes(ext || '') && f.content;
    });

    if (tsFiles.length === 0) return;

    const monaco = monacoRef.current;
    const tsDefaults = monaco.languages.typescript.typescriptDefaults;
    const jsDefaults = monaco.languages.typescript.javascriptDefaults;

    // Register all workspace files as extraLibs so TS knows about cross-file types
    const extraLibs = tsFiles.map(f => ({
      content: f.content!,
      filePath: f.path,
    }));

    tsDefaults.setExtraLibs(extraLibs);
    jsDefaults.setExtraLibs(extraLibs);

    // Also set compiler options for better diagnostics
    tsDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      esModuleInterop: true,
      skipLibCheck: true,
      noEmit: true,
    });

    extraLibsRegisteredRef.current = true;
  }, [workspace]);

  // --- Milestone 1: Run TypeScript diagnostics via Monaco's built-in tsWorker ---
  const runTypeScriptDiagnostics = useCallback(async () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const currentFileId = useIdeStore.getState().activeFileId;
    if (!currentFileId) return;

    const file = useIdeStore.getState().openFiles.find(f => f.id === currentFileId);
    if (!file) return;

    // Only run TS diagnostics on TS/JS files
    const isTS = file.language === 'typescript' || file.language === 'tsx';
    const isJS = file.language === 'javascript' || file.language === 'jsx';
    if (!isTS && !isJS) return;

    try {
      const getWorker = isTS
        ? monaco.languages.typescript.getTypeScriptWorker
        : monaco.languages.typescript.getJavaScriptWorker;
      const tsWorker = await getWorker();
      const worker = await tsWorker(model.uri);

      const semanticDiags = await worker.getSemanticDiagnostics(model.uri.toString());
      const syntacticDiags = await worker.getSyntacticDiagnostics(model.uri.toString());

      const allDiags = [...semanticDiags, ...syntacticDiags];

      const tsProblems: Problem[] = allDiags.map((d: any) => ({
        fileId: currentFileId,
        line: d.startLineNumber || 1,
        column: d.startColumn || 1,
        endLine: d.endLineNumber,
        endColumn: d.endColumn,
        message: d.messageText || d.message || 'TypeScript error',
        severity: d.severity === 1 ? 'error' : d.severity === 2 ? 'warning' : 'info',
        source: d.code ? `ts(${d.code})` : 'typescript',
      }));

      // Merge TS problems into the store (replaces only 'ts(' prefixed problems)
      mergeProblems(currentFileId, tsProblems, 'ts(');

      // Draw markers for TS diagnostics
      const markers = tsProblems.map(d => ({
        severity: d.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : d.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info,
        message: d.message,
        startLineNumber: d.line,
        startColumn: d.column,
        endLineNumber: d.endLine || d.line,
        endColumn: d.endColumn || (d.column + 20),
      }));
      monaco.editor.setModelMarkers(model, 'netsyra-typescript', markers);
    } catch (err) {
      // TS worker might not be ready yet — silently ignore
    }
  }, [mergeProblems]);

  // --- Run TS diagnostics on file switch ---
  useEffect(() => {
    if (activeFile && (activeFile.language === 'typescript' || activeFile.language === 'tsx' ||
        activeFile.language === 'javascript' || activeFile.language === 'jsx')) {
      // Small delay to let Monaco create the model
      const timer = setTimeout(() => runTypeScriptDiagnostics(), 300);
      return () => clearTimeout(timer);
    }
  }, [activeFileId, runTypeScriptDiagnostics]);

  // --- Monaco Mount Handler ---
  const handleMount = useCallback(
    (editor: Parameters<NonNullable<Parameters<typeof Editor>[0]["onMount"]>>[0], monaco: Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Expose editor globally for ProblemsPanel click-to-jump
      (window as any).__netsyraEditor = editor;

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

      // 4b. Auto-save on blur if autoSave is enabled
      editor.onDidBlurEditorText(() => {
        if (editorConfig.autoSave && activeFileId) {
          saveFile(activeFileId);
        }
      });

      // 5. Force layout to ensure editor stretches to container height
      editor.layout();

      // 6. ResizeObserver — prevents "Cannot read properties of null (reading 'left')" crash
      //    when panels are toggled/resized and Monaco's automaticLayout races the DOM
      if (containerRef.current) {
        if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
        resizeObserverRef.current = new ResizeObserver(() => {
          editor.layout();
        });
        resizeObserverRef.current.observe(containerRef.current);
      }

      // 7. Run TS diagnostics after mount
      setTimeout(() => runTypeScriptDiagnostics(), 500);
    },
    [setCursor, saveFile, activeFileId, runTypeScriptDiagnostics, editorConfig.autoSave]
  );

  // --- Editor Change Handler (with debounced linting) ---
  const handleChange = (value: string | undefined) => {
    const id = useIdeStore.getState().activeFileId;
    if (id) {
      setFileContent(id, value ?? "");

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        const file = useIdeStore.getState().openFiles.find(f => f.id === id);
        if (file && linterWorkerRef.current && LINTABLE_LANGUAGES.has(file.language)) {
          linterWorkerRef.current.postMessage({
            fileId: id,
            path: file.path,
            content: file.content,
            language: file.language,
          });
        }
      }, 500);

      // TypeScript diagnostics (700ms debounce — slightly after ESLint)
      if (tsDebounceRef.current) clearTimeout(tsDebounceRef.current);
      tsDebounceRef.current = setTimeout(() => {
        runTypeScriptDiagnostics();

        // Milestone 4: Re-lint other open files that might depend on this one
        const state = useIdeStore.getState();
        const otherFiles = state.openFiles.filter(f => f.id !== id);
        for (const otherFile of otherFiles) {
          if (otherFile.language === 'typescript' || otherFile.language === 'tsx' ||
              otherFile.language === 'javascript' || otherFile.language === 'jsx') {
            // Update extraLibs so the TS worker knows about the changed file
            const monaco = monacoRef.current;
            if (monaco && otherFile.content) {
              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                otherFile.content,
                otherFile.path
              );
            }
          }
        }
      }, 700);

      // Incremental AST indexing (2s debounce — heavier than linting)
      if (astDebounceRef.current) clearTimeout(astDebounceRef.current);
      astDebounceRef.current = setTimeout(() => {
        const file = useIdeStore.getState().openFiles.find(f => f.id === id);
        if (file && astWorkerRef.current && INDEXABLE_LANGUAGES.has(file.language)) {
          astWorkerRef.current.postMessage({
            filePath: file.path,
            content: file.content,
          });
        }
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Tabs */}
      <TabBar />

      {activeFile ? (
        <>
          {/* Breadcrumbs */}
          <Breadcrumbs path={activeFile.path} />

          {/* Editor + Split container — CRITICAL: min-h-0 prevents layout squash */}
          <div
            className={`flex-1 flex overflow-hidden min-h-0 ${
              splitEditorOrientation === 'vertical' ? 'flex-col' : 'flex-row'
            }`}
          >
            {/* Primary editor */}
            <div ref={containerRef} className="flex-1 overflow-hidden min-h-0 min-w-0 relative">
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

            {/* Split editor (right or bottom) */}
            {splitEditorFileId && (
              <div
                className={`overflow-hidden min-h-0 min-w-0 ${
                  splitEditorOrientation === 'vertical'
                    ? 'w-full flex-1 border-t border-[#1f2428]'
                    : 'h-full w-1/2 border-l border-[#1f2428]'
                }`}
              >
                <SplitEditor />
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyEditor />
      )}
    </div>
  );
}