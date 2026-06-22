"use client";

import React, { useState } from "react";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface SimpleExplorerProps {
  projectName: string;
  structure: FileNode[];
  onFileSelect?: (path: string) => void;
}

export default function SimpleExplorer({ projectName, structure, onFileSelect }: SimpleExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: FileNode, path: string = "", level: number = 0) => {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(fullPath);

    return (
      <div key={fullPath} style={{ marginLeft: level * 12 }}>
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-gray-800 cursor-pointer rounded"
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(fullPath);
            } else if (onFileSelect) {
              onFileSelect(fullPath);
            }
          }}
        >
          {node.type === "folder" ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <Folder className="w-4 h-4 text-blue-400" />
            </>
          ) : (
            <div className="w-4 h-4" />
          )}
          <span className="text-sm text-gray-300">{node.name}</span>
        </div>
        {node.type === "folder" && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, fullPath, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border-r border-gray-700 h-full">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-white">{projectName}</h2>
      </div>
      <div className="p-2">
        {structure.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">
            No files yet
          </div>
        ) : (
          structure.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
}
