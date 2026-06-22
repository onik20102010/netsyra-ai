"use client";
import { X, File } from "lucide-react";

interface EditorTabsProps {
  openFiles: string[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
}

export default function EditorTabs({
  openFiles,
  activeFile,
  onSelectFile,
  onCloseFile,
}: EditorTabsProps) {
  if (openFiles.length === 0) return null;

  return (
    <div className="flex items-center bg-[#252526] border-b border-[#3c3c3c] overflow-x-auto">
      {openFiles.map((file) => {
        const isActive = file === activeFile;
        const fileName = file.split("/").pop() || file;
        return (
          <div
            key={file}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", file);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onSelectFile(file)}
            className={`group flex items-center gap-1 px-3 py-1.5 text-[13px] cursor-pointer border-r border-[#3c3c3c] select-none whitespace-nowrap ${
              isActive
                ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]"
                : "bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2a2a]"
            }`}
          >
            <File size={14} className="text-blue-400 shrink-0" />
            <span className="truncate max-w-[140px]">{fileName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile(file);
              }}
              className="p-0.5 rounded hover:bg-[#3c3c3c] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} className="text-gray-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
}