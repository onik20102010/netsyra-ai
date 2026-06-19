import { getProjectGraph, ProjectGraph } from "./project-graph";

export interface ExportEntry {
  name: string;           // exported name
  path: string;           // file path (e.g., "src/components/Button.tsx")
  isDefault: boolean;     // default export?
}

// Build a searchable export map from the project graph
export function buildExportIndex(): Record<string, ExportEntry> {
  const graph = getProjectGraph();
  if (!graph) return {};

  const index: Record<string, ExportEntry> = {};

  for (const [filePath, node] of Object.entries(graph.nodes)) {
    for (const exp of node.exports) {
      // Avoid overwriting; prefer first match (could be refined)
      if (!index[exp]) {
        index[exp] = { name: exp, path: filePath, isDefault: false };
      }
    }
  }

  return index;
}

// Detect components used in JSX/TSX but not imported
export function findMissingImports(
  code: string,
  filePath: string,
  exportIndex: Record<string, ExportEntry>
): ExportEntry[] {
  // Find all JSX-like tags (not exhaustive but catches typical components)
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)\s*(\/>|>)/g;
  const usedComponents = new Set<string>();
  let match;
  while ((match = componentRegex.exec(code)) !== null) {
    usedComponents.add(match[1]);
  }

  // Find existing imports in the code
  const existingImports = extractExistingImports(code);

  // Determine which used components are missing
  const missing: ExportEntry[] = [];
  for (const comp of usedComponents) {
    if (!existingImports.has(comp) && exportIndex[comp]) {
      missing.push(exportIndex[comp]);
    }
  }

  return missing;
}

// Parse existing imports (simple version)
function extractExistingImports(code: string): Set<string> {
  const imported = new Set<string>();
  // import { X } from '...'
  const namedRegex = /import\s+\{([^}]+)\}\s+from/g;
  let match;
  while ((match = namedRegex.exec(code)) !== null) {
    match[1].split(",").forEach(n => imported.add(n.trim()));
  }
  // import X from '...'
  const defaultRegex = /import\s+(\w+)\s+from/g;
  while ((match = defaultRegex.exec(code)) !== null) {
    imported.add(match[1]);
  }
  return imported;
}

// Generate import statement string
export function generateImportStatement(
  entries: ExportEntry[],
  currentFilePath: string
): string {
  // Group by source file
  const grouped: Record<string, ExportEntry[]> = {};
  entries.forEach(entry => {
    if (!grouped[entry.path]) grouped[entry.path] = [];
    grouped[entry.path].push(entry);
  });

  let result = "";
  for (const [sourcePath, exports] of Object.entries(grouped)) {
    // Compute relative path from current file to source
    const relativePath = computeRelativePath(currentFilePath, sourcePath);
    const defaultExport = exports.find(e => e.isDefault);
    const namedExports = exports.filter(e => !e.isDefault).map(e => e.name);

    if (defaultExport && namedExports.length > 0) {
      result += `import ${defaultExport.name}, { ${namedExports.join(", ")} } from "${relativePath}";\n`;
    } else if (defaultExport) {
      result += `import ${defaultExport.name} from "${relativePath}";\n`;
    } else if (namedExports.length > 0) {
      result += `import { ${namedExports.join(", ")} } from "${relativePath}";\n`;
    }
  }

  return result;
}

// Simple relative path computation (for browser contexts)
function computeRelativePath(from: string, to: string): string {
  const fromParts = from.split("/");
  const toParts = to.split("/");

  // Remove filename from from path
  fromParts.pop();

  // Find common prefix
  let common = 0;
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++;
  }

  const upCount = fromParts.length - common;
  const relativeParts = Array(upCount).fill("..");
  relativeParts.push(...toParts.slice(common));

  let result = relativeParts.join("/") || ".";
  // Remove file extension for import (optional, but cleaner)
  result = result.replace(/\.(tsx?|jsx?)$/, "");
  return result;
}

// Apply auto-import to a file's content
export function autoImportFile(
  content: string,
  filePath: string,
  exportIndex: Record<string, ExportEntry>
): { content: string; addedImports: number } {
  const missing = findMissingImports(content, filePath, exportIndex);
  if (missing.length === 0) return { content, addedImports: 0 };

  const importBlock = generateImportStatement(missing, filePath);
  // Insert imports after any existing imports (or at top)
  const lines = content.split("\n");
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("import ")) {
      lastImportLine = i;
    }
  }

  if (lastImportLine >= 0) {
    lines.splice(lastImportLine + 1, 0, importBlock.trim());
  } else {
    lines.unshift(importBlock.trim());
  }

  return { content: lines.join("\n"), addedImports: missing.length };
}

// Remove duplicate imports and fix wrong paths (simple cleanup)
export function cleanupImports(code: string): string {
  const lines = code.split("\n");
  const seenImports = new Set<string>();
  const cleaned: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("import ")) {
      const normalized = line.trim().replace(/\s+/g, " ");
      if (!seenImports.has(normalized)) {
        seenImports.add(normalized);
        cleaned.push(line);
      }
      // else skip duplicate
    } else {
      cleaned.push(line);
    }
  }

  return cleaned.join("\n");
}

// Build export index directly from a flat files record (for client-side use)
export function buildExportIndexFromFiles(files: Record<string, string>): Record<string, ExportEntry> {
  const index: Record<string, ExportEntry> = {};
  for (const [path, content] of Object.entries(files)) {
    const exports = extractExportsFromContent(content);
    for (const exp of exports) {
      if (!index[exp]) {
        index[exp] = { name: exp, path, isDefault: false };
      }
    }
  }
  return index;
}

function extractExportsFromContent(content: string): string[] {
  const exports: string[] = [];
  const defRegex = /export\s+default\s+(?:function|class|const)\s+(\w+)/g;
  let match;
  while ((match = defRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  const namedRegex = /export\s+(?:function|class|const|let|var)\s+(\w+)/g;
  while ((match = namedRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  const braceRegex = /export\s+\{([^}]+)\}/g;
  while ((match = braceRegex.exec(content)) !== null) {
    match[1].split(",").forEach(n => {
      const name = n.trim().split(/\s+/)[0];
      if (name) exports.push(name);
    });
  }
  return exports;
}