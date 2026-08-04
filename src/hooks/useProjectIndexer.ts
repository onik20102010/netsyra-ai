"use client";

import { useEffect, useRef } from "react";
import { getDB } from "@/ide/db";
import { useIdeStore } from "@/ide/store";
import type { FileItem } from "@/ide/types";
import { useAuth } from "@/hooks/useAuth";

function flattenTree(files: FileItem[]): FileItem[] {
  const result: FileItem[] = [];
  for (const file of files) {
    if (file.isDirectory) {
      if (file.children) {
        result.push(...flattenTree(file.children));
      }
    } else {
      result.push(file);
    }
  }
  return result;
}

function isIndexable(file: FileItem): boolean {
  const ext = file.path.split(".").pop()?.toLowerCase();
  return ["ts", "tsx", "js", "jsx", "mjs"].includes(ext || "");
}

async function simpleHash(content: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

export function useProjectIndexer() {
  const workspace = useIdeStore((s) => s.workspace);
  const { user } = useAuth();
  const astWorkerRef = useRef<Worker | null>(null);
  const indexedRef = useRef<Set<string>>(new Set());

  // Use authenticated user ID for database isolation, fallback to 'local'
  const userId = user?.id || 'local';
  const db = getDB(userId);

  useEffect(() => {
    if (!workspace) return;

    const indexProject = async () => {
      const flatFiles = flattenTree(workspace.files);
      const indexableFiles = flatFiles.filter(isIndexable);

      if (indexableFiles.length === 0) return;

      // --- Incremental indexing: only reindex files whose hash changed ---
      const filesToIndex: typeof indexableFiles = [];
      const stalePaths = new Set<string>();

      for (const file of indexableFiles) {
        if (!file.content) continue;
        const hash = await simpleHash(file.content);
        const existing = await db.files.get(file.path);

        if (!existing || existing.hash !== hash) {
          filesToIndex.push(file);
        }
      }

      // Detect deleted files (in DB but not in workspace)
      const allDbFiles = await db.files.toArray();
      const workspacePaths = new Set(indexableFiles.map(f => f.path));
      for (const dbFile of allDbFiles) {
        if (!workspacePaths.has(dbFile.path)) {
          stalePaths.add(dbFile.path);
        }
      }

      // Clean up stale entries
      for (const stalePath of stalePaths) {
        await db.files.delete(stalePath);
        await db.symbols.where('filePath').equals(stalePath).delete();
        await db.imports.where('filePath').equals(stalePath).delete();
        await db.relations.where('callerFilePath').equals(stalePath).delete();
      }

      if (filesToIndex.length === 0) {
        // All files up to date — just update metadata
        await db.metadata.put({
          id: 'project',
          lastIndexed: Date.now(),
          fileCount: indexableFiles.length,
        });
        return;
      }

      // Create AST worker
      if (!astWorkerRef.current) {
        astWorkerRef.current = new Worker("/ast.worker.js");
        astWorkerRef.current.onmessage = async (e: MessageEvent) => {
          const { filePath, symbols, imports, relations } = e.data;
          if (indexedRef.current.has(filePath)) return;
          indexedRef.current.add(filePath);

          // Save file metadata with hash
          const file = filesToIndex.find((f) => f.path === filePath);
          if (file) {
            const hash = await simpleHash(file.content || "");
            await db.files.put({
              id: filePath,
              path: filePath,
              hash,
              lastModified: Date.now(),
            });
          }

          // Clear old symbols for this file, then batch insert new ones
          await db.symbols.where("filePath").equals(filePath).delete();
          if (symbols.length > 0) {
            await db.symbols.bulkAdd(
              symbols.map((s: any) => ({
                name: s.name,
                kind: s.kind,
                filePath,
                line: s.line,
                column: s.column,
              }))
            );
          }

          // Update imports
          await db.imports.where("filePath").equals(filePath).delete();
          await db.imports.put({ filePath, importedPaths: imports });

          // Update relations (symbol graph)
          await db.relations.where("callerFilePath").equals(filePath).delete();
          if (relations && relations.length > 0) {
            await db.relations.bulkAdd(
              relations.map((r: any) => ({
                symbolName: r.symbolName,
                callerFilePath: r.callerFilePath,
                calleeFilePath: r.calleeFilePath,
                calleeSymbolName: r.calleeSymbolName,
                calleeKind: r.calleeKind,
              }))
            );
          }
        };
      }

      // Send only changed files to the worker
      for (const file of filesToIndex) {
        if (file.content) {
          astWorkerRef.current.postMessage({
            filePath: file.path,
            content: file.content,
          });
        }
      }

      // Mark as indexed
      await db.metadata.put({
        id: "project",
        lastIndexed: Date.now(),
        fileCount: indexableFiles.length,
      });
    };

    indexProject();

    return () => {
      astWorkerRef.current?.terminate();
      astWorkerRef.current = null;
      indexedRef.current.clear();
    };
  }, [workspace, userId]);

  return astWorkerRef;
}
