import React from "react";
import { FileIcon, FileCode, FileJson, FileType, FolderTree } from "lucide-react";

export function getLanguage(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".scss")) return "scss";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".py")) return "python";
  return "text";
}

export function getFileIcon(name: string, type: "file" | "folder"): React.ReactNode {
  if (type === "folder") {
    return <FolderTree size={14} className="text-ide-accent" />;
  }

  const language = getLanguage(name);
  switch (language) {
    case "typescript":
    case "javascript":
      return <FileCode size={14} className="text-ide-accent" />;
    case "json":
      return <FileJson size={14} className="text-ide-warning" />;
    case "css":
    case "scss":
      return <FileType size={14} className="text-ide-info" />;
    default:
      return <FileIcon size={14} className="text-ide-foreground-muted" />;
  }
}

export function getLanguageIcon(language: string): React.ReactNode {
  return getFileIcon(`.${language}`, "file");
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  language?: string;
  children?: FileItem[];
  isOpen?: boolean;
  handle?: FileSystemHandle;
}

export interface OpenFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  unsaved: boolean;
  handle?: FileSystemFileHandle;
}
