"use client";
import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";

interface EditorProps {
  fileName: string | null;
  content: string;
  onChange: (value: string | undefined) => void;
  onSave?: () => void; // now optional
}

export default function EditorPanel({ fileName, content, onChange, onSave }: EditorProps) {
  const language = fileName?.endsWith(".tsx") || fileName?.endsWith(".ts")
    ? "typescript"
    : fileName?.endsWith(".js") || fileName?.endsWith(".jsx")
    ? "javascript"
    : fileName?.endsWith(".css")
    ? "css"
    : fileName?.endsWith(".json")
    ? "json"
    : "plaintext";

  // Expose onSave to the editor via the monaco instance only if provided
  const handleMount = (editor: any, monaco: any) => {
    if (onSave) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave();
      });
    }
  };

  return (
    <div className="h-full w-full">
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
    </div>
  );
}