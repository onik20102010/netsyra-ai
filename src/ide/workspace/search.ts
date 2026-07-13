import type { IFileSystem, FileNode, SearchQuery, SearchResult, FolderNode, WorkspaceNode } from "./types";
import { isFileNode, isFolderNode } from "./tree";

export class SearchEngine {
  constructor(private fileSystem: IFileSystem) {}

  async search(root: FolderNode, query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const text = query.text;
    if (!text) return results;

    const regex = query.regex
      ? new RegExp(text, query.caseSensitive ? "g" : "gi")
      : new RegExp(this.escapeRegExp(text), query.caseSensitive ? "g" : "gi");

    const mode = query.mode ?? "all";

    for (const node of this.walk(root)) {
      if (!isFileNode(node)) continue;

      const relativePath = node.relativePath;
      const fileName = node.name;

      if (mode === "filename" || mode === "all") {
        if (regex.test(fileName)) {
          results.push({
            path: node.path,
            relativePath,
            type: "filename",
            match: fileName,
          });
        }
        regex.lastIndex = 0;
      }

      if (mode === "symbol" || mode === "all") {
        for (const symbol of node.symbols) {
          if (regex.test(symbol.name)) {
            results.push({
              path: node.path,
              relativePath,
              type: "symbol",
              line: symbol.range.start.line,
              column: symbol.range.start.column,
              match: symbol.name,
            });
          }
          regex.lastIndex = 0;
        }
      }

      if (mode === "content" || mode === "all") {
        try {
          const content = await this.fileSystem.readFile(node.path, "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            let match: RegExpExecArray | null;
            while ((match = regex.exec(line)) !== null) {
              results.push({
                path: node.path,
                relativePath,
                type: "content",
                line: i,
                column: match.index,
                match: match[0],
                context: line.trim(),
              });
            }
            regex.lastIndex = 0;
          }
        } catch {
          // Skip files that cannot be read.
        }
      }
    }

    return results;
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private *walk(root: FolderNode): Generator<WorkspaceNode> {
    const visit = function* (node: WorkspaceNode): Generator<WorkspaceNode> {
      yield node;
      if (isFolderNode(node)) {
        for (const child of node.children.values()) {
          yield* visit(child);
        }
      }
    };
    yield* visit(root);
  }
}
