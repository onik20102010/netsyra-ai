export interface RenameResult {
  oldName: string;
  newName: string;
  files: { path: string; occurrences: number; content: string }[];
  totalFiles: number;
  totalOccurrences: number;
  importChanges: number;
  exportChanges: number;
}

export function scanReferences(
  files: Record<string, string>,
  oldName: string
): { path: string; occurrences: number; lines: number[] }[] {
  const results: { path: string; occurrences: number; lines: number[] }[] = [];
  for (const [path, content] of Object.entries(files)) {
    const lines = content.split("\n");
    const foundLines: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      // Match the whole word, not partial matches
      const regex = new RegExp(`\\b${escapeRegex(oldName)}\\b`, "g");
      if (regex.test(lines[i])) {
        foundLines.push(i + 1);
      }
    }
    if (foundLines.length > 0) {
      results.push({ path, occurrences: foundLines.length, lines: foundLines });
    }
  }
  return results;
}

export function computeRenamePreview(
  files: Record<string, string>,
  oldName: string,
  newName: string
): RenameResult {
  const scanned = scanReferences(files, oldName);
  const fileResults = scanned.map(s => {
    const content = files[s.path];
    // Replace all occurrences of oldName with newName (whole word only)
    const regex = new RegExp(`\\b${escapeRegex(oldName)}\\b`, "g");
    const updatedContent = content.replace(regex, newName);
    return { ...s, content: updatedContent };
  });

  let importChanges = 0;
  let exportChanges = 0;
  for (const f of fileResults) {
    const original = files[f.path];
    const importRegex = new RegExp(`(import\\s+.*)\\b${escapeRegex(oldName)}\\b`, "g");
    const exportRegex = new RegExp(`(export\\s+.*)\\b${escapeRegex(oldName)}\\b`, "g");
    if (importRegex.test(original)) importChanges++;
    if (exportRegex.test(original)) exportChanges++;
  }

  return {
    oldName,
    newName,
    files: fileResults,
    totalFiles: fileResults.length,
    totalOccurrences: fileResults.reduce((sum, f) => sum + f.occurrences, 0),
    importChanges,
    exportChanges,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}