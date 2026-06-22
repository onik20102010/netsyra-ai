export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

const MAX_FILES = 10;

export class ProjectContext {
  private projectName: string = "";
  private folderStructure: FileNode[] = [];
  private recentFiles: string[] = [];

  setProjectName(name: string): void {
    this.projectName = name;
  }

  getProjectName(): string {
    return this.projectName;
  }

  setFolderStructure(structure: FileNode[]): void {
    this.folderStructure = structure;
  }

  getFolderStructure(): FileNode[] {
    return this.folderStructure;
  }

  addRecentFile(filePath: string): void {
    if (!this.recentFiles.includes(filePath)) {
      this.recentFiles.push(filePath);
      if (this.recentFiles.length > MAX_FILES) {
        this.recentFiles.shift();
      }
    }
  }

  getRecentFiles(): string[] {
    return [...this.recentFiles];
  }

  getContext(): {
    projectName: string;
    folderStructure: FileNode[];
    recentFiles: string[];
  } {
    return {
      projectName: this.projectName,
      folderStructure: this.folderStructure,
      recentFiles: this.recentFiles,
    };
  }

  clear(): void {
    this.projectName = "";
    this.folderStructure = [];
    this.recentFiles = [];
  }
}
