import path from "path";
import { createHash } from "crypto";
import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { IRuntimeKernel } from "@/ide/kernel/types";
import type { RuntimeEvent, EventCategory } from "@/ide/types";
import type {
  WorkspaceState,
  WorkspaceProject,
  FolderNode,
  FileNode,
  FileHandle,
  SearchQuery,
  SearchResult,
  Diagnostic,
  GitInfo,
  SymbolInfo,
  FileSummary,
  WorkspaceSnapshot,
  WorkspaceNode,
} from "./types";
import { NodeFileSystem } from "./filesystem";
import { IgnoreEngine } from "./ignore";
import { WorkspaceIndexer } from "./indexer";
import { BufferManager, createFileHandle } from "./buffer";
import { SearchEngine } from "./search";
import { DiagnosticsManager } from "./diagnostics";
import { FileWatcher } from "./watcher";
import { findGitRoot, readGitStatus } from "./git";
import { detectLanguage } from "./language";
import {
  createFileNode,
  createFolderNode,
  findFileNodes,
  findNodeByPath,
  isFileNode,
  isFolderNode,
  walkFiles,
} from "./tree";

export class WorkspaceEngine extends BaseSubsystem {
  private kernel?: IRuntimeKernel;
  private fileSystem = new NodeFileSystem();
  private state: WorkspaceState = "closed";
  private project: WorkspaceProject | null = null;
  private tree: FolderNode | null = null;
  private ignoreEngine: IgnoreEngine | null = null;
  private indexer: WorkspaceIndexer | null = null;
  private bufferManager = new BufferManager();
  private searchEngine: SearchEngine | null = null;
  private diagnosticsManager = new DiagnosticsManager();
  private fileWatcher: FileWatcher | null = null;
  private gitInfo: GitInfo = { modified: [], staged: [], untracked: [], ignored: [], conflicts: [] };
  private operations: import("./types").WorkspaceOperation[] = [];
  private maxFilesToIndex = 100_000;
  private maxFileSizeBytes = 5 * 1024 * 1024;

  constructor() {
    super({
      id: "workspace-engine",
      name: "Workspace Engine",
      version: "1.0.0",
      capabilities: ["workspace", "files", "indexing", "search", "diagnostics"],
      dependencies: ["runtime-event-bus"],
    });
  }

  async initialize(config?: { kernel?: IRuntimeKernel }): Promise<void> {
    await super.initialize(config);
    this.kernel = config?.kernel;
    this.searchEngine = new SearchEngine(this.fileSystem);
  }

  async start(): Promise<void> {
    this.lifecycle = "running";
  }

  async shutdown(): Promise<void> {
    await this.closeProject();
    this.lifecycle = "stopped";
  }

  async onEvent(event: RuntimeEvent): Promise<void> {
    if (event.type === "ui:open-project" && typeof event.payload === "string") {
      await this.openProject(event.payload);
    } else if (event.type === "ui:close-project") {
      await this.closeProject();
    } else if (event.type === "ui:open-file" && typeof event.payload === "string") {
      await this.openFile(event.payload);
    } else if (event.type === "ui:save-file" && typeof event.payload === "string") {
      await this.saveFile(event.payload);
    }
  }

  async openProject(rootPath: string): Promise<WorkspaceProject> {
    this.state = "discovering";
    this.emit("workspace:opening", { rootPath });

    const resolved = this.resolveWorkspacePath(rootPath);
    if (!(await this.fileSystem.exists(resolved))) {
      throw new Error(`Workspace path does not exist: ${resolved}`);
    }

    const stat = await this.fileSystem.stat(resolved);
    if (!stat.isDirectory) {
      throw new Error(`Workspace path is not a directory: ${resolved}`);
    }

    const project = await this.discoverProject(resolved);
    this.project = project;
    this.gitInfo = await this.detectGit(resolved);

    this.ignoreEngine = new IgnoreEngine(resolved, this.fileSystem);
    await this.ignoreEngine.loadGitignore();

    this.indexer = new WorkspaceIndexer(this.fileSystem, this.ignoreEngine, {
      maxFileSizeBytes: this.maxFileSizeBytes,
      maxFilesToIndex: this.maxFilesToIndex,
    });

    this.state = "indexing";
    this.emit("workspace:indexing", { project });
    this.tree = await this.indexer.indexProject(project);

    this.fileWatcher = new FileWatcher(this.fileSystem, (event, filePath) => {
      this.handleFileSystemEvent(event, filePath);
    });
    await this.fileWatcher.start(project);

    this.state = "ready";
    this.emit("workspace:opened", { project, git: this.gitInfo });
    this.emit("workspace:indexed", { project, totalFiles: this.countFiles() });

    return project;
  }

  async closeProject(): Promise<void> {
    await this.fileWatcher?.stop();
    this.fileWatcher = null;
    this.bufferManager = new BufferManager();
    this.tree = null;
    this.project = null;
    this.ignoreEngine = null;
    this.indexer = null;
    this.state = "closed";
    this.emit("workspace:closed", {});
  }

  async openFile(filePath: string): Promise<FileHandle> {
    const resolved = this.resolveWorkspacePath(filePath);
    if (this.bufferManager.has(resolved)) {
      const handle = this.bufferManager.get(resolved)!;
      handle.opened = true;
      this.emit("workspace:file-opened", { path: resolved });
      return handle;
    }

    const node = this.getNode(resolved);
    if (!node || !isFileNode(node)) {
      throw new Error(`File not found in workspace: ${filePath}`);
    }

    const content = await this.fileSystem.readFile(resolved, "utf-8");
    const hash = createHash("sha256").update(content).digest("hex");
    const handle = createFileHandle(resolved, node, content, hash);
    this.bufferManager.set(resolved, handle);
    node.opened = true;
    this.emit("workspace:file-opened", { path: resolved });
    return handle;
  }

  async closeFile(filePath: string): Promise<void> {
    const resolved = this.resolveWorkspacePath(filePath);
    const handle = this.bufferManager.get(resolved);
    if (!handle) return;

    if (handle.dirty) {
      throw new Error(`File has unsaved changes: ${filePath}`);
    }

    this.bufferManager.delete(resolved);
    handle.node.opened = false;
    this.emit("workspace:file-closed", { path: resolved });
  }

  async readFile(filePath: string): Promise<string> {
    const resolved = this.resolveWorkspacePath(filePath);
    const handle = this.bufferManager.get(resolved);
    if (handle) return handle.buffer.getText();
    return this.fileSystem.readFile(resolved, "utf-8");
  }

  async writeFile(filePath: string, content: string, source = "user"): Promise<void> {
    const resolved = this.resolveWorkspacePath(filePath);
    let handle = this.bufferManager.get(resolved);

    if (!handle) {
      const node = this.getNode(resolved);
      if (node && isFileNode(node)) {
        const original = await this.fileSystem.readFile(resolved, "utf-8");
        const hash = createHash("sha256").update(original).digest("hex");
        handle = createFileHandle(resolved, node, original, hash);
        this.bufferManager.set(resolved, handle);
      } else {
        throw new Error(`File not found in workspace: ${filePath}`);
      }
    }

    this.bufferManager.pushUndo(resolved, handle.buffer.getText());
    handle.buffer.setText(content);
    handle.dirty = true;
    handle.node.dirty = true;
    this.emit("workspace:file-changed", { path: resolved, source });
  }

  async saveFile(filePath: string): Promise<void> {
    const resolved = this.resolveWorkspacePath(filePath);
    const handle = this.bufferManager.get(resolved);
    if (!handle) {
      throw new Error(`File is not open: ${filePath}`);
    }

    const content = handle.buffer.getText();
    await this.validateSave(handle);
    await this.fileSystem.writeFile(resolved, content, "utf-8");

    const newHash = createHash("sha256").update(content).digest("hex");
    handle.buffer.originalText = content;
    handle.buffer.originalHash = newHash;
    handle.dirty = false;
    handle.node.dirty = false;
    handle.node.hash = newHash;
    handle.node.size = content.length;
    handle.node.modifiedAt = Date.now();

    await this.indexer?.reindexFile(handle.node);
    this.emit("workspace:file-saved", { path: resolved, size: content.length });
  }

  async createFile(filePath: string, content = ""): Promise<FileNode> {
    const resolved = this.resolveWorkspacePath(filePath);
    await this.fileSystem.writeFile(resolved, content, "utf-8");
    const node = await this.indexFileNode(resolved);
    this.insertNode(node);
    this.emit("workspace:file-created", { path: resolved });
    return node;
  }

  async createFolder(folderPath: string): Promise<FolderNode> {
    const resolved = this.resolveWorkspacePath(folderPath);
    await this.fileSystem.mkdir(resolved, { recursive: true });
    const node = createFolderNode(resolved, this.getRoot());
    this.insertNode(node);
    this.emit("workspace:folder-created", { path: resolved });
    return node;
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const resolvedOld = this.resolveWorkspacePath(oldPath);
    const resolvedNew = this.resolveWorkspacePath(newPath);
    await this.fileSystem.rename(resolvedOld, resolvedNew);
    await this.refreshTree();
    this.emit("workspace:file-renamed", { oldPath: resolvedOld, newPath: resolvedNew });
  }

  async moveFile(oldPath: string, newPath: string): Promise<void> {
    await this.renameFile(oldPath, newPath);
    this.emit("workspace:file-moved", { oldPath, newPath });
  }

  async deleteFile(filePath: string, hard = false): Promise<void> {
    const resolved = this.resolveWorkspacePath(filePath);
    const node = this.getNode(resolved);
    if (node && isFileNode(node)) {
      node.deleted = true;
    }

    if (hard) {
      await this.fileSystem.remove(resolved);
      this.removeNode(resolved);
    }

    this.bufferManager.delete(resolved);
    this.emit("workspace:file-deleted", { path: resolved, hard });
  }

  async deleteFolder(folderPath: string, hard = false): Promise<void> {
    const resolved = this.resolveWorkspacePath(folderPath);
    if (hard) {
      await this.fileSystem.remove(resolved, true);
    }
    this.removeNode(resolved);
    this.emit("workspace:folder-deleted", { path: resolved, hard });
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const resolvedSource = this.resolveWorkspacePath(sourcePath);
    const resolvedDest = this.resolveWorkspacePath(destPath);
    await this.fileSystem.copy(resolvedSource, resolvedDest);
    await this.refreshTree();
    this.emit("workspace:file-copied", { sourcePath: resolvedSource, destPath: resolvedDest });
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.tree || !this.searchEngine) return [];
    return this.searchEngine.search(this.tree, query);
  }

  getSymbols(filePath: string): SymbolInfo[] {
    const resolved = this.resolveWorkspacePath(filePath);
    const node = this.getNode(resolved);
    if (node && isFileNode(node)) return node.symbols;
    return [];
  }

  getSummary(filePath: string): string {
    const resolved = this.resolveWorkspacePath(filePath);
    const node = this.getNode(resolved);
    if (node && isFileNode(node)) return node.summary;
    return "";
  }

  getFileDiagnostics(filePath: string): Diagnostic[] {
    return this.diagnosticsManager.get(this.resolveWorkspacePath(filePath));
  }

  setFileDiagnostics(filePath: string, diagnostics: Diagnostic[]): void {
    this.diagnosticsManager.set(this.resolveWorkspacePath(filePath), diagnostics);
    this.emit("workspace:diagnostics-updated", { path: filePath, diagnostics });
  }

  getTree(): FolderNode | null {
    return this.tree;
  }

  getTreeSnapshot(): unknown | null {
    if (!this.tree) return null;
    return this.serializeNode(this.tree);
  }

  getSnapshot(): WorkspaceSnapshot {
    return {
      state: this.state,
      project: this.project,
      totalFiles: this.countFiles(),
      totalFolders: this.countFolders(),
      openFiles: this.bufferManager.list().map((h) => h.path),
      dirtyFiles: this.bufferManager.list().filter((h) => h.dirty).map((h) => h.path),
      indexingProgress: this.state === "indexing" ? 0 : 1,
    };
  }

  getProject(): WorkspaceProject | null {
    return this.project;
  }

  getState(): WorkspaceState {
    return this.state;
  }

  getGitInfo(): GitInfo {
    return this.gitInfo;
  }

  override getMetrics(): Record<string, unknown> {
    return {
      state: this.state,
      totalFiles: this.countFiles(),
      totalFolders: this.countFolders(),
      openFiles: this.bufferManager.list().length,
      dirtyFiles: this.bufferManager.list().filter((h) => h.dirty).length,
    };
  }

  override getDiagnostics(): Record<string, unknown> {
    return {
      state: this.state,
      project: this.project?.root ?? null,
      totalFiles: this.countFiles(),
      totalFolders: this.countFolders(),
      openFiles: this.bufferManager.list().map((h) => h.path),
      dirtyFiles: this.bufferManager.list().filter((h) => h.dirty).map((h) => h.path),
      git: this.gitInfo,
    };
  }

  private async discoverProject(root: string): Promise<WorkspaceProject> {
    const name = path.basename(root);
    const metadata = await this.detectMetadata(root);
    const entryPoints: string[] = [];
    const configFiles: string[] = [];

    for (const file of metadata.importantFiles) {
      if (
        file === "package.json" ||
        file === "next.config.ts" ||
        file === "next.config.js" ||
        file === "tsconfig.json" ||
        file === "Dockerfile"
      ) {
        configFiles.push(file);
      }
      if (file === "page.tsx" || file === "layout.tsx" || file === "index.ts" || file === "index.js") {
        entryPoints.push(file);
      }
    }

    return {
      root,
      name,
      framework: metadata.detectedFrameworks[0] ?? "unknown",
      packageManager: this.detectPackageManager(root, metadata),
      entryPoints,
      configFiles,
      metadata,
    };
  }

  private async detectMetadata(root: string): Promise<import("./types").ProjectMetadata> {
    const metadata: import("./types").ProjectMetadata = {
      detectedFrameworks: [],
      hasPackageJson: false,
      hasTsConfig: false,
      hasNextConfig: false,
      hasDockerfile: false,
      hasGit: false,
      environmentFiles: [],
      importantFolders: [],
      importantFiles: [],
      routingType: "unknown",
      buildSystem: "unknown",
    };

    const entries = await this.fileSystem.readDir(root);
    for (const entry of entries) {
      if (entry.isDirectory) {
        if (entry.name === "src" || entry.name === "app" || entry.name === "pages" || entry.name === "components" || entry.name === "lib") {
          metadata.importantFolders.push(entry.name);
        }
      } else if (entry.isFile) {
        metadata.importantFiles.push(entry.name);
        if (entry.name === "package.json") {
          metadata.hasPackageJson = true;
          metadata.buildSystem = "webpack";
          try {
            const pkg = JSON.parse(await this.fileSystem.readFile(entry.path, "utf-8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps?.next) metadata.detectedFrameworks.push("next");
            if (deps?.react) metadata.detectedFrameworks.push("react");
            if (deps?.vue) metadata.detectedFrameworks.push("vue");
            if (deps?.svelte) metadata.detectedFrameworks.push("svelte");
            if (deps?.["@remix-run/core"]) metadata.detectedFrameworks.push("remix");
          } catch {
            // ignore
          }
        }
        if (entry.name === "tsconfig.json") metadata.hasTsConfig = true;
        if (entry.name === "next.config.ts" || entry.name === "next.config.js" || entry.name === "next.config.mjs") {
          metadata.hasNextConfig = true;
          metadata.detectedFrameworks.push("next");
          metadata.buildSystem = "next";
        }
        if (entry.name.toLowerCase() === "dockerfile" || entry.name === "Dockerfile") metadata.hasDockerfile = true;
        if (entry.name.startsWith(".env")) metadata.environmentFiles.push(entry.name);
      }
    }

    if (metadata.importantFolders.includes("app")) metadata.routingType = "app";
    else if (metadata.importantFolders.includes("pages")) metadata.routingType = "pages";
    else if (metadata.importantFolders.includes("app") && metadata.importantFolders.includes("pages")) metadata.routingType = "mixed";

    metadata.hasGit = await this.fileSystem.exists(path.join(root, ".git"));
    if (metadata.detectedFrameworks.length === 0 && metadata.hasPackageJson) metadata.detectedFrameworks.push("node");

    return metadata;
  }

  private detectPackageManager(root: string, metadata: import("./types").ProjectMetadata): string {
    if (metadata.importantFiles.includes("pnpm-lock.yaml")) return "pnpm";
    if (metadata.importantFiles.includes("yarn.lock")) return "yarn";
    if (metadata.importantFiles.includes("bun.lockb")) return "bun";
    if (metadata.importantFiles.includes("package-lock.json")) return "npm";
    return "unknown";
  }

  private async detectGit(root: string): Promise<GitInfo> {
    const gitRoot = await findGitRoot(this.fileSystem, root);
    if (!gitRoot) return { modified: [], staged: [], untracked: [], ignored: [], conflicts: [] };
    return readGitStatus(gitRoot);
  }

  private async handleFileSystemEvent(
    event: "created" | "deleted" | "modified" | "renamed",
    filePath: string
  ): Promise<void> {
    if (!this.tree || !this.project) return;

    if (event === "deleted") {
      const node = this.getNode(filePath);
      if (node) {
        this.removeNode(filePath);
        this.emit("workspace:file-deleted", { path: filePath, hard: true });
      }
    } else if (event === "modified" || event === "created") {
      if (await this.fileSystem.exists(filePath)) {
        const stat = await this.fileSystem.stat(filePath);
        if (stat.isFile) {
          const node = await this.indexFileNode(filePath);
          this.insertNode(node);
          this.emit("workspace:file-changed", { path: filePath, source: "filesystem" });
        } else if (stat.isDirectory) {
          const node = createFolderNode(filePath, this.project.root);
          this.insertNode(node);
        }
      }
    }
  }

  private async indexFileNode(filePath: string): Promise<FileNode> {
    const root = this.project?.root ?? "";
    const stat = await this.fileSystem.stat(filePath);
    const content = await this.fileSystem.readFile(filePath, "utf-8");
    const hash = createHash("sha256").update(content).digest("hex");
    const node = createFileNode(filePath, root);
    node.size = stat.size;
    node.modifiedAt = stat.modifiedAt;
    node.hash = hash;
    node.language = detectLanguage(filePath);
    return node;
  }

  private insertNode(node: WorkspaceNode): void {
    if (!this.tree || !this.project) return;
    const parts = path.relative(this.project.root, node.path).split(path.sep).filter(Boolean);
    let current: FolderNode = this.tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      const child = current.children.get(part);
      if (child && isFolderNode(child)) {
        current = child;
      } else {
        const folder = createFolderNode(path.join(this.project.root, ...parts.slice(0, i + 1)), this.project.root);
        current.children.set(part, folder);
        current = folder;
      }
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      current.children.set(lastPart, node);
    }
  }

  private removeNode(filePath: string): void {
    if (!this.tree || !this.project) return;
    const parts = path.relative(this.project.root, filePath).split(path.sep).filter(Boolean);
    let current: FolderNode = this.tree;
    const stack: FolderNode[] = [current];

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      const child = current.children.get(part);
      if (child && isFolderNode(child)) {
        current = child;
        stack.push(current);
      } else {
        return;
      }
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      current.children.delete(lastPart);
    }
  }

  private getNode(filePath: string): WorkspaceNode | undefined {
    if (!this.tree || !this.project) return undefined;
    return findNodeByPath(this.tree, path.relative(this.project.root, filePath));
  }

  private getRoot(): string {
    return this.project?.root ?? "";
  }

  private resolveWorkspacePath(inputPath: string): string {
    if (!this.project) {
      if (!path.isAbsolute(inputPath)) {
        throw new Error("No workspace open and path is relative");
      }
      return path.resolve(inputPath);
    }

    const root = path.resolve(this.project.root);
    const resolved = path.resolve(root, inputPath);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new Error("Path traversal detected");
    }
    return resolved;
  }

  private async validateSave(handle: FileHandle): Promise<void> {
    if (handle.readonly) {
      throw new Error(`File is read-only: ${handle.path}`);
    }
    const content = handle.buffer.getText();
    if (content.length > this.maxFileSizeBytes) {
      throw new Error(`File exceeds maximum save size: ${handle.path}`);
    }
  }

  private async refreshTree(): Promise<void> {
    if (!this.project || !this.indexer) return;
    this.tree = await this.indexer.indexProject(this.project);
  }

  private countFiles(): number {
    return this.tree ? findFileNodes(this.tree).length : 0;
  }

  private countFolders(): number {
    if (!this.tree) return 0;
    let count = 0;
    const visit = (node: WorkspaceNode) => {
      if (isFolderNode(node)) {
        count++;
        for (const child of node.children.values()) visit(child);
      }
    };
    visit(this.tree);
    return count;
  }

  private serializeNode(node: WorkspaceNode): unknown {
    const base = {
      id: node.id,
      path: node.path,
      relativePath: node.relativePath,
      name: node.name,
      type: node.type,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };

    if (isFileNode(node)) {
      return {
        ...base,
        language: node.language,
        size: node.size,
        hash: node.hash,
        modifiedAt: node.modifiedAt,
        dirty: node.dirty,
        opened: node.opened,
        readonly: node.readonly,
        generated: node.generated,
        temporary: node.temporary,
        summary: node.summary,
      };
    }

    if (isFolderNode(node)) {
      return {
        ...base,
        isExpanded: node.isExpanded,
        children: Array.from(node.children.values()).map((child) => this.serializeNode(child)),
      };
    }

    return base;
  }

  private emit(type: string, payload: unknown, category: EventCategory = "workspace"): void {
    this.kernel?.emit(type, payload, this.id).catch(() => {
      // Events are best-effort; ignore emission errors.
    });
  }
}
