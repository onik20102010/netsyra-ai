"use client";
import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Lightbulb } from "lucide-react";

interface EditorProps {
  fileName: string | null;
  content: string;
  onChange: (value: string | undefined) => void;
  onCursorChange?: (line: number, column: number) => void;
  onSave?: () => void;
}

export default function EditorPanel({ fileName, content, onChange, onCursorChange, onSave }: EditorProps) {
  const language = fileName?.endsWith(".tsx") || fileName?.endsWith(".ts")
    ? "typescript"
    : fileName?.endsWith(".js") || fileName?.endsWith(".jsx")
    ? "javascript"
    : fileName?.endsWith(".css")
    ? "css"
    : fileName?.endsWith(".json")
    ? "json"
    : "plaintext";

  // ── Explanation state ──────────────────────────
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainPosition, setExplainPosition] = useState({ top: 0, left: 0 });
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const explanationCache = useRef<Record<string, string>>({});

  // ── Explanation handler ─────────────────────────
  const handleHover = async (word: string, position: { top: number; left: number }) => {
    if (explanationCache.current[word]) {
      setExplanation(explanationCache.current[word]);
      setExplainPosition(position);
      return;
    }
    // Call the IDE agent for explanation
    try {
      const res = await fetch("/api/ide-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Explain this code in one sentence: "${word}"` }],
          mode: "ask",
          activeFile: fileName,
          fileContent: content,
          files: {},
        }),
      });
      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value);
        }
        explanationCache.current[word] = text;
        setExplanation(text);
        setExplainPosition(position);
      }
    } catch {}
  };

  // ── Editor mount handler ────────────────────────
  const handleMount = (editor: any, monaco: any) => {
    if (onSave) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave();
      });
    }

    // Cursor position reporting
    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e: any) => {
        onCursorChange(e.position.lineNumber, e.position.column);
      });
    }

    // Hover to explain code
    editor.onMouseMove((e: any) => {
      const target = e.target;
      if (target && target.position) {
        const { lineNumber, column } = target.position;
        const model = editor.getModel();
        if (model) {
          const word = model.getWordAtPosition({ lineNumber, column });
          if (word) {
            const coords = editor.getScrolledVisiblePosition({ lineNumber, column });
            if (coords) {
              setExplainPosition({ top: coords.top, left: coords.left });
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              hoverTimer.current = setTimeout(() => {
                handleHover(word.word, { top: coords.top, left: coords.left });
              }, 800);
            }
          } else {
            setExplanation(null);
          }
        }
      }
    });
  };

  return (
    <div className="h-full w-full relative">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        language={language}
        value={content}
        onChange={onChange}
        theme="vs-dark"
        onMount={handleMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />

      {/* Explanation tooltip */}
      {explanation && (
        <div
          className="absolute z-50 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-3 text-xs text-gray-300 max-w-xs shadow-xl"
          style={{ top: explainPosition.top + 20, left: explainPosition.left + 10 }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Lightbulb size={12} className="text-yellow-400" />
            <span className="text-gray-400 font-medium">Explanation</span>
          </div>
          <p className="leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}