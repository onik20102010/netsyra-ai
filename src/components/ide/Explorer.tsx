// d:\netsyra\src\components\ide\Explorer.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useIdeStore, FileItem, openWorkspaceFromDisk, closeWorkspaceFromDisk, getFileIconDetails } from "@/ide";
import { 
  Folder, FolderOpen, File, FileCode, FileJson, FileText, Image, 
  ChevronRight, ChevronDown, Plus, FolderPlus, Trash2, Pencil, 
  FolderOpen as FolderOpenIcon, X, FilePlus
} from "lucide-react";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetItem: FileItem | null;
  targetPath: string;
}

export function Explorer() {
  const workspace = useIdeStore((s) => s.workspace);
  const activeFileId = useIdeStore((s) => s.activeFileId);
  const openFile = useIdeStore((s) => s.openFile);
  const createFile = useIdeStore((s) => s.createFile);
  const isLoading = useIdeStore((s) => s.isLoading);

  // Local UI state for expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState<{ parentPath: string; isDir: boolean } | null>(null);
  const [newName, setNewName] = useState("");
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetItem: null,
    targetPath: ''
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible]);

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, item: FileItem | null, targetPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetItem: item,
      targetPath: item ? (item.isDirectory ? item.path : targetPath) : targetPath
    });
  };

  // Context menu actions
  const handleContextMenuAction = (action: string) => {
    const parentPath = contextMenu.targetItem?.isDirectory 
      ? contextMenu.targetItem.path 
      : contextMenu.targetPath;

    if (action === 'newFile') {
      setIsCreating({ parentPath, isDir: false });
      setNewName("");
      // Expand the folder if it's a directory
      if (contextMenu.targetItem?.isDirectory) {
        setExpandedFolders(prev => new Set([...prev, parentPath]));
      }
    } else if (action === 'newFolder') {
      setIsCreating({ parentPath, isDir: true });
      setNewName("");
      // Expand the folder if it's a directory
      if (contextMenu.targetItem?.isDirectory) {
        setExpandedFolders(prev => new Set([...prev, parentPath]));
      }
    }

    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Handle creating a file/folder
  const handleCreate = (parentPath: string) => {
    if (newName.trim()) {
      createFile(parentPath, newName.trim(), isCreating?.isDir || false);
      setNewName("");
      setIsCreating(null);
    }
  };

  // Recursive Tree Renderer
  const renderTree = (items: FileItem[], level = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isActive = activeFileId === item.id;

      if (item.isDirectory) {
        return (
          <div key={item.id}>
            <div
              className={`flex items-center h-[28px] px-2 cursor-pointer hover:bg-[#2a2d2e] group ${
                isExpanded ? "bg-[#2a2d2e]" : ""
              }`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => toggleFolder(item.path)}
              onContextMenu={(e) => handleContextMenu(e, item, item.path)}
            >
              <span className="mr-1 text-[#858585]">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="text-[#cccccc] mr-1">
                {isExpanded ? <FolderOpen size={16} className="text-[#90a4ae]" /> : <Folder size={16} className="text-[#90a4ae]" />}
              </span>
              <span className="text-[13px] truncate text-[#cccccc] flex-1">{item.name}</span>
              
              {/* Hover action buttons */}
              <div className="hidden group-hover:flex items-center gap-0.5 ml-2">
                <button
                  className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition-colors"
                  title="New File"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating({ parentPath: item.path, isDir: false });
                    setNewName("");
                    setExpandedFolders(prev => new Set([...prev, item.path]));
                  }}
                >
                  <Plus size={12} />
                </button>
                <button
                  className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition-colors"
                  title="New Folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating({ parentPath: item.path, isDir: true });
                    setNewName("");
                    setExpandedFolders(prev => new Set([...prev, item.path]));
                  }}
                >
                  <FolderPlus size={12} />
                </button>
              </div>
            </div>

            {/* Recursively render children if expanded */}
            {isExpanded && item.children && (
              <div>
                {/* Input for new file/folder inside this directory */}
                {isCreating?.parentPath === item.path && (
                  <div
                    className="flex items-center h-[28px] px-2 bg-[#2a2d2e]"
                    style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
                  >
                    <input
                      type="text"
                      autoFocus
                      className="flex-1 bg-[#3c3c3c] text-[#cccccc] text-[13px] px-1 border border-[#007acc] outline-none rounded-sm"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate(item.path);
                        if (e.key === "Escape") setIsCreating(null);
                      }}
                      onBlur={() => setIsCreating(null)}
                      placeholder={isCreating?.isDir ? "folder name" : "file name"}
                    />
                  </div>
                )}
                {renderTree(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      }

      // It's a file
      const { iconName, color } = getFileIconDetails(item.path, false);
      // Map Lucide icon name to actual component
      const IconComponent = 
        iconName === "FileCode" ? FileCode :
        iconName === "FileJson" ? FileJson :
        iconName === "FileText" ? FileText :
        iconName === "Image" ? Image :
        File;

      return (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
              type: 'file',
              path: item.path,
              name: item.name,
              id: item.id
            }));
          }}
          className={`flex items-center h-[28px] px-2 cursor-pointer hover:bg-[#2a2d2e] ${isActive ? "bg-[#04395e] text-white" : ""}`}
          style={{ paddingLeft: `${level * 12 + 20}px` }}
          onClick={() => openFile(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item, item.path.substring(0, item.path.lastIndexOf('/')) || '')}
        >
          <span className="mr-1">
            <IconComponent size={16} color={color} />
          </span>
          <span className={`text-[13px] truncate ${isActive ? "text-white" : "text-[#cccccc]"}`}>
            {item.name}
          </span>
        </div>
      );
    });
  };

  // --- Explorer Header Actions ---
  return (
    <div className="flex flex-col h-full text-[#cccccc]">
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#3e3e3e] min-h-[28px]">
        {workspace ? (
          <div className="flex items-center gap-1">
            {/* Create File */}
            <button
              className="p-1 rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-white transition-colors"
              title="New File"
              onClick={() => setIsCreating({ parentPath: workspace.rootPath, isDir: false })}
            >
              <Plus size={16} />
            </button>
            {/* Create Folder */}
            <button
              className="p-1 rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-white transition-colors"
              title="New Folder"
              onClick={() => setIsCreating({ parentPath: workspace.rootPath, isDir: true })}
            >
              <FolderPlus size={16} />
            </button>
            {/* Close Project */}
            <button
              className="p-1 rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-red-400 transition-colors ml-1"
              title="Close Project"
              onClick={closeWorkspaceFromDisk}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="w-full">
            <button
              onClick={openWorkspaceFromDisk}
              disabled={isLoading}
              className="w-full py-1 px-2 text-[12px] bg-[#2a2d2e] hover:bg-[#3c3c3c] border border-[#3e3e3e] rounded text-[#cccccc] transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? "Loading..." : <><FolderOpenIcon size={14} /> Open Project</>}
            </button>
          </div>
        )}
      </div>

      {/* Tree Content */}
      <div 
        className="flex-1 overflow-auto min-h-0 bg-[#252526] pt-1"
        onContextMenu={(e) => {
          if (workspace) {
            handleContextMenu(e, null, workspace.rootPath);
          }
        }}
      >
        {workspace ? (
          renderTree(workspace.files)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#858585] text-[13px] px-4 text-center select-none">
            <p className="mb-2">No workspace opened</p>
            <p className="text-[12px]">Click "Open Project" above to start.</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#252526] border border-[#3e3e3e] rounded shadow-xl py-1 z-50 min-w-[180px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            className="w-full px-3 py-1.5 text-left text-[13px] text-[#cccccc] hover:bg-[#04395e] flex items-center gap-2 transition-colors"
            onClick={() => handleContextMenuAction('newFile')}
          >
            <FilePlus size={14} />
            New File
          </button>
          <button
            className="w-full px-3 py-1.5 text-left text-[13px] text-[#cccccc] hover:bg-[#04395e] flex items-center gap-2 transition-colors"
            onClick={() => handleContextMenuAction('newFolder')}
          >
            <FolderPlus size={14} />
            New Folder
          </button>
        </div>
      )}
    </div>
  );
}