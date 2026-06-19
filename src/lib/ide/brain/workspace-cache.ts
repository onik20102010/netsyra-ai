interface ProjectCache {
  projectId: string;
  compressedContext: {
    summary: string;
    architecture: string;
    activeFiles: string[];
    keyDecisions: string[];
  };
  fileSummaries: Record<string, string>;
  lastUpdated: number;
}

let projectCache: ProjectCache | null = null;

export function setWorkspaceSummary(summary: string) {
  if (!projectCache) {
    projectCache = {
      projectId: "default",
      compressedContext: {
        summary: "",
        architecture: "",
        activeFiles: [],
        keyDecisions: [],
      },
      fileSummaries: {},
      lastUpdated: Date.now(),
    };
  }
  projectCache.compressedContext.summary = summary;
  projectCache.lastUpdated = Date.now();
}

export function getWorkspaceSummary(): string | null {
  return projectCache?.compressedContext.summary || null;
}

export function cacheFileSummary(path: string, summary: string) {
  if (!projectCache) return;
  projectCache.fileSummaries[path] = summary;
  projectCache.lastUpdated = Date.now();
}

export function getFileSummary(path: string): string | null {
  return projectCache?.fileSummaries[path] || null;
}

export function storeKeyDecision(decision: string) {
  if (!projectCache) return;
  projectCache.compressedContext.keyDecisions.push(decision);
  projectCache.lastUpdated = Date.now();
}

export function getCompressedContext(): string {
  if (!projectCache) return "";
  const ctx = projectCache.compressedContext;
  let result = `## Project Summary\n${ctx.summary}\n`;
  if (ctx.keyDecisions.length > 0) {
    result += `\n## Key Decisions\n${ctx.keyDecisions.map(d => `- ${d}`).join("\n")}\n`;
  }
  if (ctx.activeFiles.length > 0) {
    result += `\n## Active Files\n${ctx.activeFiles.map(f => `- ${f}`).join("\n")}\n`;
  }
  return result;
}

export function generateWorkspaceSummary(files: Record<string, string>): string {
  const fileList = Object.keys(files).slice(0, 50);
  if (fileList.length === 0) return "No project files.";
  let summary = `Project with ${fileList.length} files.`;
  // Cache file summaries
  fileList.forEach(path => {
    const content = files[path] || "";
    const purpose = path.split("/").pop()?.replace(/\.\w+$/, "") || path;
    cacheFileSummary(path, `File: ${purpose}`);
  });
  return summary;
}