import path from "path";
import type { WorkspaceNode, FileNode, FolderNode } from "./types";

export function createFileNode(filePath: string, root: string): FileNode {
  return {
    id: filePath,
    path: filePath,
    relativePath: path.relative(root, filePath),
    name: path.basename(filePath),
    parent: path.dirname(filePath),
    type: "file",
    language: "",
    size: 0,
    hash: "",
    modifiedAt: 0,
    encoding: "utf-8",
    readonly: false,
    opened: false,
    dirty: false,
    deleted: false,
    generated: false,
    temporary: false,
    summary: "",
    dependencies: [],
    references: [],
    imports: [],
    exports: [],
    symbols: [],
    diagnostics: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createFolderNode(folderPath: string, root: string): FolderNode {
  return {
    id: folderPath,
    path: folderPath,
    relativePath: path.relative(root, folderPath),
    name: path.basename(folderPath) || folderPath,
    parent: path.dirname(folderPath),
    type: "folder",
    children: new Map(),
    isExpanded: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function isFolderNode(node: WorkspaceNode): node is FolderNode {
  return (node as FolderNode).type === "folder";
}

export function isFileNode(node: WorkspaceNode): node is FileNode {
  return (node as FileNode).type === "file";
}

export function getNodeByPath(root: FolderNode, targetPath: string): WorkspaceNode | undefined {
  const parts = targetPath.split(path.sep).filter(Boolean);
  let current: WorkspaceNode = root;

  for (const part of parts) {
    if (!isFolderNode(current)) return undefined;
    const child = current.children.get(part);
    if (!child) return undefined;
    current = child;
  }

  return current.relativePath === targetPath ? current : undefined;
}

export const findNodeByPath = getNodeByPath;

export function findNodes(root: FolderNode, predicate: (node: WorkspaceNode) => boolean): WorkspaceNode[] {
  const results: WorkspaceNode[] = [];
  const visit = (node: WorkspaceNode) => {
    if (predicate(node)) results.push(node);
    if (isFolderNode(node)) {
      for (const child of node.children.values()) {
        visit(child);
      }
    }
  };
  visit(root);
  return results;
}

export function findFileNodes(root: FolderNode): FileNode[] {
  return findNodes(root, isFileNode) as FileNode[];
}

export function flattenFolders(root: FolderNode): FolderNode[] {
  return findNodes(root, isFolderNode) as FolderNode[];
}

export function* walkFiles(root: FolderNode): Generator<FileNode> {
  const visit = function* (node: WorkspaceNode): Generator<FileNode> {
    if (isFileNode(node)) yield node;
    if (isFolderNode(node)) {
      for (const child of node.children.values()) {
        yield* visit(child);
      }
    }
  };
  yield* visit(root);
}
