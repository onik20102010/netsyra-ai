"use client";

import React from "react";
import { Terminal, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  onCodeBlock?: (filePath: string, content: string) => void;
}

export default function MarkdownRenderer({ content, onCodeBlock }: MarkdownRendererProps) {
  const [copiedCommand, setCopiedCommand] = React.useState<string | null>(null);

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const result: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLanguage = "";
    let codeFilePath = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block detection
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          // Start of code block
          const meta = line.slice(3).trim();
          codeLanguage = meta.split(" ")[0] || "";
          codeFilePath = meta.includes("path:") ? meta.split("path:")[1].trim() : "";
          inCodeBlock = true;
          codeContent = [];
        } else {
          // End of code block
          inCodeBlock = false;
          result.push(
            <div key={`code-${i}`} className="my-4">
              <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-700">
                <code className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {codeContent.join("\n")}
                </code>
              </pre>
            </div>
          );
          if (onCodeBlock && codeFilePath) {
            onCodeBlock(codeFilePath, codeContent.join("\n"));
          }
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Command detection (PowerShell, CMD, Bash)
      if (line.match(/^(PS|>|#|\$|>)/)) {
        const command = line.replace(/^(PS|>|#|\$|>)\s*/, "");
        result.push(
          <div key={`cmd-${i}`} className="my-2">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Terminal className="w-4 h-4 text-green-400 flex-shrink-0" />
                <code className="text-sm text-gray-300 font-mono flex-1">{command}</code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(command);
                  setCopiedCommand(command);
                  setTimeout(() => setCopiedCommand(null), 2000);
                }}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors ml-2"
              >
                <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        );
        continue;
      }

      // Headings
      if (line.startsWith("###")) {
        result.push(
          <h3 key={`h3-${i}`} className="text-lg font-bold text-white mt-4 mb-2">
            {line.slice(3).trim()}
          </h3>
        );
        continue;
      }
      if (line.startsWith("##")) {
        result.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold text-white mt-4 mb-2">
            {line.slice(2).trim()}
          </h2>
        );
        continue;
      }
      if (line.startsWith("#")) {
        result.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold text-white mt-4 mb-2">
            {line.slice(1).trim()}
          </h1>
        );
        continue;
      }

      // Thinking/Thoughts sections
      if (line.toLowerCase().includes("thinking") || line.toLowerCase().includes("thoughts")) {
        result.push(
          <div key={`thinking-${i}`} className="my-2">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
              {line}
            </span>
          </div>
        );
        continue;
      }

      // Regular text
      if (line.trim()) {
        result.push(
          <p key={`p-${i}`} className="text-sm text-gray-300 my-1 leading-relaxed">
            {line}
          </p>
        );
      }
    }

    return result;
  };

  return <div className="prose prose-invert max-w-none">{renderMarkdown(content)}</div>;
}
