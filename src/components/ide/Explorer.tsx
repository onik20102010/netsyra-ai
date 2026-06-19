"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, RefreshCw, Search, FolderOpenIcon } from "lucide-react";
import ContextMenu from "./ContextMenu";

// ─── Types ────────────────────────────────────────
interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  path: string;
}

interface ExplorerProps {
  files: Record<string, string>;      // path -> content
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onNewFile: (path: string) => void;
  onNewFolder: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  onRefresh: () => void;
  onImportProject?: (projectName: string, files: Record<string, string>) => void;
  onOpenFolder?: () => void;   // new optional prop for folder mode
  loaded?: boolean;
  dirtyFiles?: Set<string>;
  rootFolderName?: string;   // e.g., "my-project" when a local folder is opened
}

// ─── Tree builder ──────────────────────────────────
function buildTree(files: Record<string, string>): FileNode[] {
  const root: FileNode = { name: "", type: "folder", children: [], path: "" };
  for (const path of Object.keys(files)) {
    const parts = path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      if (isFile) {
        current.children = current.children || [];
        if (!current.children.find(n => n.name === part && n.type === "file")) {
          current.children.push({ name: part, type: "file", path });
        }
      } else {
        let folder = current.children?.find(n => n.name === part && n.type === "folder");
        if (!folder) {
          folder = { name: part, type: "folder", children: [], path: parts.slice(0, i + 1).join("/") };
          current.children = current.children || [];
          current.children.push(folder);
        }
        current = folder;
      }
    }
  }
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => { if (n.children) sortNodes(n.children); });
  };
  if (root.children) sortNodes(root.children);
  return root.children || [];
}

// ─── Main component ────────────────────────────────
export default function Explorer({
  files,
  activeFile,
  onSelectFile,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onRefresh,
  onImportProject,
  onOpenFolder,   // destructure new prop
  loaded,
  dirtyFiles,
  rootFolderName,   // ← destructure
}: ExplorerProps) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; type: "file" | "folder" } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creating, setCreating] = useState<{ parentPath: string; type: "file" | "folder" } | null>(null);
  const [createValue, setCreateValue] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowSearchDropdown(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter files on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results = Object.keys(files).filter(path =>
      path.toLowerCase().includes(query)
    );
    setSearchResults(results.slice(0, 20)); // limit to 20
    setShowSearchDropdown(results.length > 0);
  }, [searchQuery, files]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Toggle folder expand ───────────────────────
  const toggleExpand = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // ── Right-click handler ────────────────────────
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, path: node.path, type: node.type });
  };

  // ── Rename logic ──────────────────────────────
  const startRename = (path: string) => {
    const name = path.split("/").pop() || "";
    setRenaming(path);
    setRenameValue(name);
  };
  const submitRename = () => {
    if (renaming && renameValue.trim()) {
      const oldPath = renaming;
      const parentPath = oldPath.split("/").slice(0, -1).join("/");
      const newPath = parentPath ? `${parentPath}/${renameValue.trim()}` : renameValue.trim();
      if (newPath !== oldPath) onRename(oldPath, newPath);
    }
    setRenaming(null);
  };

  // ── Create logic ──────────────────────────────
  const startCreate = (parentPath: string, type: "file" | "folder") => {
    setCreating({ parentPath, type });
    setCreateValue("");
  };
  const submitCreate = () => {
    if (creating && createValue.trim()) {
      const fullPath = creating.parentPath
        ? `${creating.parentPath}/${createValue.trim()}`
        : createValue.trim();
      if (creating.type === "file") onNewFile(fullPath);
      else onNewFolder(fullPath);
    }
    setCreating(null);
  };

  // ── Open Folder (local folder import) – fallback if onOpenFolder not provided ──
  const handleOpenFolder = async () => {
    try {
      // @ts-ignore - File System Access API
      const dirHandle = await window.showDirectoryPicker();
      const importedFiles: Record<string, string> = {};
      const readDir = async (dirHandle: any, parentPath: string) => {
        for await (const [name, handle] of dirHandle.entries()) {
          const childPath = parentPath ? `${parentPath}/${name}` : name;
          if (handle.kind === "file") {
            const file = await handle.getFile();
            const text = await file.text();
            importedFiles[childPath] = text;
          } else if (handle.kind === "directory") {
            await readDir(handle, childPath);
          }
        }
      };
      await readDir(dirHandle, "");
      if (onImportProject) {
        const projectName = dirHandle.name || "project";
        onImportProject(projectName, importedFiles);
      } else {
        // Fallback: merge into existing files
        for (const [path, content] of Object.entries(importedFiles)) {
          onNewFile(path);
        }
      }
    } catch (err) {
      console.log("Folder picker cancelled or not supported.");
    }
  };

  // ── Get creation parent path (now uses selected folder) ──
  const getCreationParentPath = (): string => {
    return selectedFolder || "";
  };

  // ── Render a single node (with indentation guides) ──
  const renderNode = (node: FileNode, depth: number, isLastChild: boolean) => {
    const isExpanded = expanded[node.path] || false;
    const isActive = activeFile === node.path;
    const isFolder = node.type === "folder";
    const isSelectedFolder = isFolder && selectedFolder === node.path;

    // Tooltip: show full path relative to project root or browser storage
    const tooltip = node.type === "file"
      ? rootFolderName
        ? `${rootFolderName}/${node.path}`         // local folder mode
        : `Browser storage: ${node.path}`           // IndexedDB mode
      : node.path;                                   // folder: just show path

    // Indentation guides: vertical lines at each depth
    const guideStyle = depth > 0
      ? {
          position: "relative" as const,
        }
      : {};

    return (
      <div key={node.path} style={guideStyle}>
        {/* Indentation lines */}
        {depth > 0 && (
          <>
            {/* Continuous line from parent */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: `${depth * 16 - 8}px`,
                width: "1px",
                background: "#404040",
              }}
            />
            {/* Horizontal line from guide to node */}
            <div
              className="absolute"
              style={{
                left: `${depth * 16 - 8}px`,
                top: "50%",
                width: "8px",
                height: "1px",
                background: "#404040",
              }}
            />
          </>
        )}

        {/* Node row */}
        <div
          className={`flex items-center py-0.5 pr-2 cursor-pointer text-[13px] hover:bg-[#2a2d2e] transition-colors ${
            isActive ? "bg-[#37373d] text-white" : 
            isSelectedFolder ? "bg-[#37373d] text-white" : 
            "text-gray-300"
          }`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
          title={tooltip}
          onClick={() => {
            if (isFolder) {
              toggleExpand(node.path);
              setSelectedFolder(node.path);          // ← select the folder
            } else {
              onSelectFile(node.path);
              setSelectedFolder(null);               // ← deselect folder when file clicked
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {/* Chevron or spacer */}
          {isFolder ? (
            <span className="mr-1">{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
          ) : (
            <span className="mr-1 w-4" />
          )}
          {/* Icon */}
          {isFolder ? (
            isExpanded ? <FolderOpen size={16} className="mr-1 text-yellow-400" /> : <Folder size={16} className="mr-1 text-yellow-400" />
          ) : (
            <File size={16} className="mr-1 text-blue-400" />
          )}
          {/* Dirty indicator (unsaved changes) */}
          {dirtyFiles?.has(node.path) && (
            <span className="w-2 h-2 rounded-full bg-gray-500 mr-1" title="Unsaved changes" />
          )}
          {/* Name or rename input */}
          {renaming === node.path ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={e => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") setRenaming(null); }}
              className="bg-[#3c3c3c] text-white border border-blue-500 px-1 flex-1 outline-none text-[13px]"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        {/* Children */}
        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map((child, index) =>
              renderNode(child, depth + 1, index === node.children!.length - 1)
            )}
            {/* Create input inside this folder */}
            {creating && creating.parentPath === node.path && (
              <div
                className="flex items-center py-0.5 pr-2 text-[13px]"
                style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}
              >
                <span className="mr-1 w-4" />
                {creating.type === "folder" ? <Folder size={16} className="mr-1 text-yellow-400" /> : <File size={16} className="mr-1 text-blue-400" />}
                <input
                  autoFocus
                  value={createValue}
                  onChange={e => setCreateValue(e.target.value)}
                  onBlur={submitCreate}
                  onKeyDown={e => {
                    if (e.key === "Enter") submitCreate();
                    if (e.key === "Escape") setCreating(null);
                  }}
                  className="bg-[#3c3c3c] text-white border border-blue-500 px-1 flex-1 outline-none text-[13px]"
                  placeholder={creating.type === "file" ? "filename.ts" : "folder-name"}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] text-gray-300 select-none">
      {/* Header with Open Folder button */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#3c3c3c]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFolder || handleOpenFolder}
            className="p-1 rounded hover:bg-[#2a2d2e] text-gray-400"
            title="Open Folder"
          >
            <FolderOpenIcon size={16} />
          </button>
          <button
            onClick={() => startCreate(getCreationParentPath(), "file")}
            className="p-1 rounded hover:bg-[#2a2d2e] text-gray-400"
            title="New File"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => startCreate(getCreationParentPath(), "folder")}
            className="p-1 rounded hover:bg-[#2a2d2e] text-gray-400"
            title="New Folder"
          >
            <Folder size={16} />
          </button>
          <button onClick={onRefresh} className="p-1 rounded hover:bg-[#2a2d2e] text-gray-400" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative border-b border-[#3c3c3c]">
        <div className="flex items-center px-2 py-1">
          <Search size={14} className="text-gray-500 mr-1" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search files (Ctrl+P)"
            className="bg-transparent text-gray-300 text-[13px] outline-none flex-1 placeholder-gray-500"
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
          />
        </div>
        {showSearchDropdown && (
          <div
            ref={searchDropdownRef}
            className="absolute top-full left-0 right-0 bg-[#1e1e1e] border border-[#454545] rounded-b shadow-2xl z-50 max-h-60 overflow-y-auto"
          >
            {searchResults.map(path => (
              <button
                key={path}
                onClick={() => {
                  onSelectFile(path);
                  setShowSearchDropdown(false);
                  setSearchQuery("");
                }}
                className="w-full text-left px-3 py-1.5 text-[13px] text-gray-300 hover:bg-[#094771] transition-colors flex items-center gap-2"
              >
                <File size={14} className="text-blue-400 shrink-0" />
                <span className="truncate">{path}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tree area */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Root-level create input */}
        {creating && creating.parentPath === "" && (
          <div className="flex items-center py-0.5 pr-2 text-[13px]" style={{ paddingLeft: "4px" }}>
            <span className="mr-1 w-4" />
            {creating.type === "folder" ? <Folder size={16} className="mr-1 text-yellow-400" /> : <File size={16} className="mr-1 text-blue-400" />}
            <input
              autoFocus
              value={createValue}
              onChange={e => setCreateValue(e.target.value)}
              onBlur={submitCreate}
              onKeyDown={e => {
                if (e.key === "Enter") submitCreate();
                if (e.key === "Escape") setCreating(null);
              }}
              className="bg-[#3c3c3c] text-white border border-blue-500 px-1 flex-1 outline-none text-[13px]"
              placeholder={creating.type === "file" ? "filename.ts" : "folder-name"}
            />
          </div>
        )}

        {tree.length > 0 ? (
          tree.map((node, idx) => renderNode(node, 0, idx === tree.length - 1))
        ) : (
          <div className="p-4 text-gray-500 text-sm text-center">
            No files yet. Click + to add a file, or 📂 to open a folder.
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            ...(contextMenu.type === "folder"
              ? [
                  { label: "New File", action: () => { startCreate(contextMenu.path, "file"); setContextMenu(null); } },
                  { label: "New Folder", action: () => { startCreate(contextMenu.path, "folder"); setContextMenu(null); } },
                ]
              : []),
            { label: "Rename", action: () => { startRename(contextMenu.path); setContextMenu(null); } },
            { label: "Delete", action: () => { onDelete(contextMenu.path); setContextMenu(null); } },
          ]}
        />
      )}
    </div>
  );
}