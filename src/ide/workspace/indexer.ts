import path from "path";
import { createHash } from "crypto";
import type { IFileSystem, FileSystemEntry, FolderNode, FileNode, WorkspaceProject } from "./types";
import { IgnoreEngine } from "./ignore";
import { createFileNode, createFolderNode } from "./tree";
import { extractSymbols } from "./symbols";
import { generateSummary } from "./summary";
import { detectLanguage } from "./language";

export interface IndexerOptions {
  maxFileSizeBytes?: number;
  maxFilesToIndex?: number;
  batchSize?: number;
}

export class WorkspaceIndexer {
  private count = 0;

  constructor(
    private fileSystem: IFileSystem,
    private ignoreEngine: IgnoreEngine,
    private options: IndexerOptions = {}
  ) {}

  async indexProject(project: WorkspaceProject): Promise<FolderNode> {
    const root = createFolderNode(project.root, project.root);
    root.name = project.name;
    await this.indexDirectory(project.root, root, project.root);
    return root;
  }

  async indexDirectory(dirPath: string, parent: FolderNode, root: string): Promise<void> {
    const entries = await this.fileSystem.readDir(dirPath);

    for (const entry of entries) {
      if (this.count >= (this.options.maxFilesToIndex ?? 100_000)) break;

      const relativePath = path.relative(root, entry.path);
      if (this.ignoreEngine.isIgnored(relativePath, entry.isDirectory)) continue;

      if (entry.isDirectory) {
        const folderNode = createFolderNode(entry.path, root);
        parent.children.set(folderNode.name, folderNode);
        await this.indexDirectory(entry.path, folderNode, root);
      } else if (entry.isFile) {
        if (entry.size > (this.options.maxFileSizeBytes ?? 5 * 1024 * 1024)) {
          const fileNode = createFileNode(entry.path, root);
          fileNode.size = entry.size;
          fileNode.modifiedAt = entry.modifiedAt;
          fileNode.language = detectLanguage(entry.path);
          fileNode.summary = "File too large to index";
          parent.children.set(fileNode.name, fileNode);
          this.count++;
          continue;
        }

        const fileNode = await this.indexFile(entry, root);
        parent.children.set(fileNode.name, fileNode);
        this.count++;
      }
    }
  }

  async indexFile(entry: FileSystemEntry, root: string): Promise<FileNode> {
    const fileNode = createFileNode(entry.path, root);
    const content = await this.fileSystem.readFile(entry.path, "utf-8");
    const hash = createHash("sha256").update(content).digest("hex");

    fileNode.size = entry.size;
    fileNode.modifiedAt = entry.modifiedAt;
    fileNode.hash = hash;
    fileNode.language = detectLanguage(entry.path);
    fileNode.summary = generateSummary(entry.path, content);
    fileNode.symbols = extractSymbols(entry.path, content);
    fileNode.imports = this.extractImports(content);
    fileNode.exports = this.extractExports(content);
    fileNode.dependencies = fileNode.imports;

    return fileNode;
  }

  async reindexFile(fileNode: FileNode): Promise<void> {
    const content = await this.fileSystem.readFile(fileNode.path, "utf-8");
    const hash = createHash("sha256").update(content).digest("hex");

    fileNode.hash = hash;
    fileNode.size = content.length;
    fileNode.modifiedAt = Date.now();
    fileNode.language = detectLanguage(fileNode.path);
    fileNode.summary = generateSummary(fileNode.path, content);
    fileNode.symbols = extractSymbols(fileNode.path, content);
    fileNode.imports = this.extractImports(content);
    fileNode.exports = this.extractExports(content);
    fileNode.dependencies = fileNode.imports;
    fileNode.updatedAt = Date.now();
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const esmImport = /import\s+.*?from\s+['"]([^'"]+)['"];?/g;
    const commonJs = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = esmImport.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = commonJs.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return [...new Set(imports)];
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum)?\s*([A-Za-z0-9_$]+)/g;
    let match: RegExpExecArray | null;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) exports.push(match[1]);
    }
    return [...new Set(exports)];
  }
}
