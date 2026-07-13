import type { IFileSystem, WorkspaceProject } from "./types";

export class FileWatcher {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private fileSystem: IFileSystem,
    private onChange: (event: "created" | "deleted" | "modified" | "renamed", path: string) => void
  ) {}

  async start(project: WorkspaceProject): Promise<void> {
    await this.stop();
    this.unsubscribe = await this.fileSystem.watch(project.root, this.onChange);
  }

  async stop(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
