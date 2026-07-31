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
  const renameItem = useIdeStore((s) => s.renameItem);
  const deleteItem = useIdeStore((s) => s.deleteItem);
  const isLoading = useIdeStore((s) => s.isLoading);

  // Local UI state for expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState<{ parentPath: string; isDir: boolean } | null>(null);
  const [newName, setNewName] = useState("");
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);
  
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
    } else if (action === 'rename' && contextMenu.targetItem) {
      setRenamingItem(contextMenu.targetItem);
      setRenameValue(contextMenu.targetItem.name);
    } else if (action === 'delete' && contextMenu.targetItem) {
      setConfirmDelete(contextMenu.targetItem);
    }

    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Handle rename submission
  const handleRename = () => {
    if (renamingItem && renameValue.trim() && renameValue.trim() !== renamingItem.name) {
      renameItem(renamingItem.id, renameValue.trim());
    }
    setRenamingItem(null);
    setRenameValue("");
  };

  // Handle delete confirmation
  const handleDelete = () => {
    if (confirmDelete) {
      deleteItem(confirmDelete.id);
    }
    setConfirmDelete(null);
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
        // Inline rename mode for this directory
        if (renamingItem?.id === item.id) {
          return (
            <div
              key={item.id}
              className="flex items-center h-[28px] px-2 bg-[#161b22]"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              <span className="mr-1 text-[#6e7681]">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="text-[#8b949e] mr-1">
                <Folder size={16} className="text-[#34e8bb]" />
              </span>
              <input
                type="text"
                autoFocus
                className="flex-1 bg-[#0d1117] text-[#e6edf3] text-[13px] px-1 border border-[#34e8bb] outline-none rounded-sm"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") { setRenamingItem(null); setRenameValue(""); }
                }}
                onBlur={handleRename}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        }
        return (
          <div key={item.id}>
            <div
              className={`flex items-center h-[28px] px-2 cursor-pointer hover:bg-[#161b22] group ${
                isExpanded ? "bg-[#161b22]" : ""
              }`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => toggleFolder(item.path)}
              onContextMenu={(e) => handleContextMenu(e, item, item.path)}
            >
              <span className="mr-1 text-[#6e7681]">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="text-[#8b949e] mr-1">
                {isExpanded ? <FolderOpen size={16} className="text-[#34e8bb]" /> : <Folder size={16} className="text-[#34e8bb]" />}
              </span>
              <span className="text-[13px] truncate text-[#e6edf3] flex-1">{item.name}</span>
              
              {/* Hover action buttons */}
              <div className="hidden group-hover:flex items-center gap-0.5 ml-2">
                <button
                  className="p-0.5 rounded hover:bg-[#30363d] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
                  title="New File"
                  aria-label="New File"
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
                  className="p-0.5 rounded hover:bg-[#30363d] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
                  title="New Folder"
                  aria-label="New Folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating({ parentPath: item.path, isDir: true });
                    setNewName("");
                    setExpandedFolders(prev => new Set([...prev, item.path]));
                  }}
                >
                  <FolderPlus size={12} />
                </button>
                <button
                  className="p-0.5 rounded hover:bg-[#30363d] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
                  title="Rename"
                  aria-label="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingItem(item);
                    setRenameValue(item.name);
                  }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="p-0.5 rounded hover:bg-[#30363d] text-[#6e7681] hover:text-[#f85149] transition-colors"
                  title="Delete"
                  aria-label="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(item);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Recursively render children if expanded */}
            {isExpanded && item.children && (
              <div>
                {/* Input for new file/folder inside this directory */}
                {isCreating?.parentPath === item.path && (
                  <div
                    className="flex items-center h-[28px] px-2 bg-[#161b22]"
                    style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
                  >
                    <input
                      type="text"
                      autoFocus
                      className="flex-1 bg-[#0d1117] text-[#e6edf3] text-[13px] px-1 border border-[#34e8bb] outline-none rounded-sm"
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

      // Inline rename mode for this file
      if (renamingItem?.id === item.id) {
        return (
          <div
            key={item.id}
            className="flex items-center h-[28px] px-2 bg-[#161b22]"
            style={{ paddingLeft: `${level * 12 + 20}px` }}
          >
            <span className="mr-1">
              <IconComponent size={16} color={color} />
            </span>
            <input
              type="text"
              autoFocus
              className="flex-1 bg-[#0d1117] text-[#e6edf3] text-[13px] px-1 border border-[#34e8bb] outline-none rounded-sm"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setRenamingItem(null); setRenameValue(""); }
              }}
              onBlur={handleRename}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      }

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
          className={`flex items-center h-[28px] px-2 cursor-pointer hover:bg-[#161b22] group ${isActive ? "bg-[#1f2428] text-[#34e8bb]" : ""}`}
          style={{ paddingLeft: `${level * 12 + 20}px` }}
          onClick={() => openFile(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item, item.path.substring(0, item.path.lastIndexOf('/')) || '')}
        >
          <span className="mr-1">
            <IconComponent size={16} color={color} />
          </span>
          <span className={`text-[13px] truncate flex-1 ${isActive ? "text-[#34e8bb]" : "text-[#e6edf3]"}`}>
            {item.name}
          </span>
          {/* Hover action buttons for files */}
          <div className="hidden group-hover:flex items-center gap-0.5 ml-2">
            <button
              className="p-0.5 rounded hover:bg-[#30363d] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
              title="Rename"
              aria-label="Rename file"
              onClick={(e) => {
                e.stopPropagation();
                setRenamingItem(item);
                setRenameValue(item.name);
              }}
            >
              <Pencil size={12} />
            </button>
            <button
              className="p-0.5 rounded hover:bg-[#30363d] text-[#6e7681] hover:text-[#f85149] transition-colors"
              title="Delete"
              aria-label="Delete file"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(item);
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      );
    });
  };

  // --- Explorer Header Actions ---
  return (
    <div className="flex flex-col h-full text-[#e6edf3]">
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#1f2428] min-h-[28px] bg-[#161b22]">
        {workspace ? (
          <div className="flex items-center gap-1">
            {/* Create File */}
            <button
              className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
              title="New File"
              aria-label="New File"
              onClick={() => setIsCreating({ parentPath: workspace.rootPath, isDir: false })}
            >
              <Plus size={16} />
            </button>
            {/* Create Folder */}
            <button
              className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
              title="New Folder"
              aria-label="New Folder"
              onClick={() => setIsCreating({ parentPath: workspace.rootPath, isDir: true })}
            >
              <FolderPlus size={16} />
            </button>
            {/* Close Project */}
            <button
              className="p-1 rounded hover:bg-[#1f2428] text-[#6e7681] hover:text-[#f85149] transition-colors ml-1"
              title="Close Project"
              aria-label="Close Project"
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
              className="w-full py-1 px-2 text-[12px] bg-[#161b22] hover:bg-[#1f2428] border border-[#30363d] rounded text-[#e6edf3] transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? "Loading..." : <><FolderOpenIcon size={14} /> Open Project</>}
            </button>
          </div>
        )}
      </div>

      {/* Tree Content */}
      <div 
        className="flex-1 overflow-auto min-h-0 bg-[#0d1117] pt-1"
        onContextMenu={(e) => {
          if (workspace) {
            handleContextMenu(e, null, workspace.rootPath);
          }
        }}
      >
        {workspace ? (
          renderTree(workspace.files)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#6e7681] text-[13px] px-4 text-center select-none">
            <p className="mb-2">No workspace opened</p>
            <p className="text-[12px]">Click "Open Project" above to start.</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#161b22] border border-[#30363d] rounded-md shadow-xl py-1 z-50 min-w-[180px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            className="w-full px-3 py-1.5 text-left text-[13px] text-[#e6edf3] hover:bg-[#1f2428] flex items-center gap-2 transition-colors"
            onClick={() => handleContextMenuAction('newFile')}
          >
            <FilePlus size={14} className="text-[#34e8bb]" />
            New File
          </button>
          <button
            className="w-full px-3 py-1.5 text-left text-[13px] text-[#e6edf3] hover:bg-[#1f2428] flex items-center gap-2 transition-colors"
            onClick={() => handleContextMenuAction('newFolder')}
          >
            <FolderPlus size={14} className="text-[#34e8bb]" />
            New Folder
          </button>
          {contextMenu.targetItem && (
            <>
              <div className="border-t border-[#30363d] my-1" />
              <button
                className="w-full px-3 py-1.5 text-left text-[13px] text-[#e6edf3] hover:bg-[#1f2428] flex items-center gap-2 transition-colors"
                onClick={() => handleContextMenuAction('rename')}
              >
                <Pencil size={14} className="text-[#6e7681]" />
                Rename
                <span className="ml-auto text-[10px] text-[#484f58]">F2</span>
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-[13px] text-[#f85149] hover:bg-[#1f2428] flex items-center gap-2 transition-colors"
                onClick={() => handleContextMenuAction('delete')}
              >
                <Trash2 size={14} />
                Delete
                <span className="ml-auto text-[10px] text-[#484f58]">Del</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={18} className="text-[#f85149]" />
              <h3 className="text-[14px] font-semibold text-[#e6edf3]">Confirm Delete</h3>
            </div>
            <p className="text-[13px] text-[#8b949e] mb-4">
              Are you sure you want to delete{" "}
              <span className="text-[#e6edf3] font-medium">{confirmDelete.name}</span>?
              {confirmDelete.isDirectory && (
                <span className="block mt-1 text-[#d29922]">
                  This will permanently delete all contents inside this folder.
                </span>
              )}
              <span className="block mt-1 text-[#6e7681]">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1.5 text-[12px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1f2428] rounded transition-colors"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 text-[12px] bg-[#f85149] hover:bg-[#f85149]/80 text-white font-medium rounded transition-colors"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}