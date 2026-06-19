import { getWorkspaceSummary } from "./workspace-cache";
import { compressProject, formatCompressedContext } from "./context-compressor";

interface IDEContext {
  activeFile: string | null;
  fileContent: string;
  projectFiles?: string[];
  selectedText?: string;
  diagnostics?: string[];
  messages?: { role: string; content: string }[];
  files?: Record<string, string>;
  relevantPaths?: string[];
  workspaceState?: {
    openFiles: string[];
    recentEdits: { path: string; timestamp: number }[];
    cursorPosition: { line: number; column: number } | null;
    currentErrors: string[];
  };
}

export function buildSystemContext(context: IDEContext): string {
  const { activeFile, fileContent, files, messages, diagnostics, relevantPaths } = context;
  let ctx = "";

  // 1. Workspace summary (cached)
  const summary = getWorkspaceSummary();
  if (summary) {
    ctx += `## Workspace Summary\n${summary}\n\n`;
  }

  // 2. Compressed project context
  if (files && Object.keys(files).length > 0) {
    const compressed = compressProject(files, activeFile, relevantPaths || []);
    const compressedCtx = formatCompressedContext(compressed, 2000);
    ctx += compressedCtx;
  }

  // 3. Active file content (only if not already compressed fully)
  if (activeFile && fileContent && !files?.[activeFile]) {
    ctx += `## Active File: \`${activeFile}\`\n`;
    const lines = fileContent.split("\n");
    const preview = lines.slice(0, 40).join("\n");
    ctx += `\`\`\`\n${preview}\n\`\`\`\n`;
    if (lines.length > 40) ctx += `… file has ${lines.length} lines total. First 40 shown.\n`;
  }

  // 4. Diagnostics
  if (diagnostics && diagnostics.length > 0) {
    ctx += `## Diagnostics\n`;
    diagnostics.slice(0, 5).forEach(d => ctx += `- ${d}\n`);
    if (diagnostics.length > 5) ctx += `… +${diagnostics.length - 5} more\n`;
  }

  // 5. Recent conversation (compressed)
  if (messages && messages.length > 1) {
    const recent = messages.slice(-4).map(m => `${m.role}: ${m.content.slice(0, 100)}`).join("\n");
    ctx += `## Recent Messages\n${recent}\n\n`;
  }

  return ctx;
}