"use client";

import { useCallback, useRef } from "react";
import { DiffEditor, type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Check, X } from "lucide-react";
import {
  useIdeStore,
  defineNetsyraTheme,
  NETSYRA_THEME,
  type PendingDiff,
} from "@/ide";
import type { EditorConfig } from "@/ide/types";

/**
 * InlineDiffEditor — shows an AI-proposed change in place, as a single-pane
 * (inline) diff with red removed lines and green added lines, plus an
 * Accept / Reject bar. Replaces the normal editor for a file while that file
 * has a pending diff.
 *
 * Keyboard: Alt+Enter accepts, Shift+Alt+Backspace rejects.
 */
export function InlineDiffEditor({
  diff,
  language,
  config,
}: {
  diff: PendingDiff;
  language: string;
  config: EditorConfig;
}) {
  const clearPendingDiff = useIdeStore((s) => s.clearPendingDiff);
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  const accept = useCallback(() => {
    const store = useIdeStore.getState();
    const file = store.openFiles.find((f) => f.path === diff.filePath);
    if (file) {
      store.setFileContent(file.id, diff.newContent);
      store.saveFile(file.id);
    } else if (diff.fileId) {
      store.updateFileContent(diff.fileId, diff.newContent);
    }
    clearPendingDiff(diff.filePath);
  }, [diff, clearPendingDiff]);

  const reject = useCallback(() => {
    clearPendingDiff(diff.filePath);
  }, [diff.filePath, clearPendingDiff]);

  const handleMount = useCallback(
    (diffEditor: editor.IStandaloneDiffEditor, monaco: Monaco) => {
      diffEditorRef.current = diffEditor;

      // Apply tabSize to both the original and modified editors
      const original = diffEditor.getOriginalEditor();
      const modified = diffEditor.getModifiedEditor();
      original.updateOptions({ tabSize: config.tabSize });
      modified.updateOptions({ tabSize: config.tabSize });

      // Bind Accept / Reject to the modified pane so shortcuts work while the
      // user is scrolling through the change.
      modified.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, accept);
      modified.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.Backspace,
        reject
      );

      diffEditor.layout();
    },
    [accept, reject, config.tabSize]
  );

  return (
    <div className="relative h-full w-full">
      <DiffEditor
        height="100%"
        language={language}
        original={diff.oldContent}
        modified={diff.newContent}
        theme={NETSYRA_THEME}
        beforeMount={defineNetsyraTheme}
        onMount={handleMount}
        options={{
          // Inline (single pane) so changes read like the file itself
          renderSideBySide: false,
          readOnly: true,
          originalEditable: false,
          renderOverviewRuler: true,
          renderMarginRevertIcon: false,
          hideUnchangedRegions: { enabled: true, minimumLineCount: 6, contextLineCount: 3 },
          automaticLayout: true,
          fontSize: config.fontSize,
          fontFamily: config.fontFamily,
          lineHeight: config.lineHeight,
          fontLigatures: true,
          lineNumbers: config.lineNumbers ? "on" : "off",
          lineNumbersMinChars: 5,
          minimap: { enabled: config.minimap, renderCharacters: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 8, bottom: 8 },
          overviewRulerBorder: false,
          guides: { indentation: true },
          wordWrap: config.wordWrap,
          bracketPairColorization: { enabled: config.bracketPairColorization },
        }}
      />

      {/* Accept / Reject — floating over the diff, like an inline suggestion */}
      <div className="absolute bottom-3 right-4 z-10 flex items-center gap-1.5">
        <button
          onClick={accept}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1f6feb] hover:bg-[#388bfd] text-white text-[12px] font-medium shadow-lg shadow-black/40 transition-colors"
          title="Accept this change (Alt+Enter)"
        >
          <Check size={12} />
          Accept
          <kbd className="ml-0.5 text-[10px] font-mono text-white/70">Alt+↵</kbd>
        </button>
        <button
          onClick={reject}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] text-[12px] font-medium border border-[#30363d] shadow-lg shadow-black/40 transition-colors"
          title="Reject this change (Shift+Alt+Backspace)"
        >
          <X size={12} />
          Reject
          <kbd className="ml-0.5 text-[10px] font-mono text-[#8b949e]">Shift+Alt+⌫</kbd>
        </button>
      </div>
    </div>
  );
}