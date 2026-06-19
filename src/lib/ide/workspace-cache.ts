// In-memory cache per session (clears on page refresh)
let workspaceSummary: string | null = null;

export function setWorkspaceSummary(summary: string) {
  workspaceSummary = summary;
}

export function getWorkspaceSummary(): string | null {
  return workspaceSummary;
}

export function generateWorkspaceSummary(files: Record<string, string>): string {
  const fileList = Object.keys(files).slice(0, 50);
  if (fileList.length === 0) return "No project files.";
  
  let summary = "## Project Overview\n";
  summary += `Total files: ${fileList.length}\n\n`;
  
  // Group by top-level folders
  const groups: Record<string, string[]> = {};
  fileList.forEach(path => {
    const parts = path.split("/");
    const top = parts.length > 1 ? parts[0] : "root";
    if (!groups[top]) groups[top] = [];
    groups[top].push(path);
  });
  
  for (const [folder, paths] of Object.entries(groups)) {
    summary += `### ${folder}/\n`;
    paths.slice(0, 10).forEach(p => {
      summary += `- ${p}\n`;
    });
    if (paths.length > 10) summary += `  ... +${paths.length - 10} more files\n`;
    summary += "\n";
  }
  
  return summary;
}