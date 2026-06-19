// ─── Compression Levels ──────────────────────────
export type CompressionLevel = 1 | 2 | 3 | 4;

// Level 1: Full code (no compression – only for active file)
// Level 2: AST-like summary (purpose, imports, exports, key functions)
// Level 3: Memory summary (single-sentence description)
// Level 4: Embedding reference only (not shown to model, used for RAG)

export interface CompressedFile {
  path: string;
  level: CompressionLevel;
  // Level 2 fields
  purpose?: string;
  imports?: string[];
  exports?: string[];
  functions?: { name: string; signature: string; purpose: string }[];
  // Level 3 fields
  summary?: string;
  // Common
  tokenEstimate: number;
}

// ─── Main compression function ────────────────────
export function compressFile(
  path: string,
  content: string,
  level: CompressionLevel
): CompressedFile {
  const base: CompressedFile = { path, level, tokenEstimate: 0 };

  if (level === 1) {
    // Full code — return as-is
    return { ...base, tokenEstimate: Math.ceil(content.length / 4) };
  }

  if (level === 2) {
    const lines = content.split("\n");
    const purpose = extractPurpose(path, content);
    const imports = extractImports(content);
    const exports = extractExports(content);
    const functions = extractFunctions(content);

    const compressed = [
      purpose ? `Purpose: ${purpose}` : "",
      imports.length > 0 ? `Imports: ${imports.join(", ")}` : "",
      exports.length > 0 ? `Exports: ${exports.join(", ")}` : "",
      ...functions.map(f => `fn ${f.name}(${f.signature}): ${f.purpose}`),
    ]
      .filter(Boolean)
      .join("\n");

    return {
      ...base,
      purpose,
      imports,
      exports,
      functions,
      tokenEstimate: Math.ceil(compressed.length / 4),
    };
  }

  if (level === 3) {
    const summary = generateSummary(path, content);
    return { ...base, summary, tokenEstimate: Math.ceil(summary.length / 4) };
  }

  // Level 4: embedding reference — no text sent to model
  return { ...base, tokenEstimate: 0 };
}

// ─── Heuristic extractors ─────────────────────────
function extractPurpose(path: string, content: string): string {
  const lower = path.toLowerCase();
  const name = path.split("/").pop()?.replace(/\.\w+$/, "") || "";

  if (lower.includes("auth") || lower.includes("login")) return "Authentication logic";
  if (lower.includes("middleware")) return "Request middleware / route protection";
  if (lower.includes("api")) return "API route handler";
  if (lower.includes("component") || content.includes("export default function") || content.includes("export function")) {
    return `${name} UI component`;
  }
  if (content.includes("export default function") || content.includes("export function")) {
    return `${name} function`;
  }
  if (lower.includes("config")) return "Configuration file";
  if (lower.includes("test")) return "Test file";
  if (lower.includes("model") || lower.includes("schema")) return "Data model / schema";
  return `${name} module`;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const regex = /import\s+(?:\{[^}]*\}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const imp = match[1];
    // Only include local imports, not external packages
    if (imp.startsWith(".") || imp.startsWith("/")) {
      imports.push(imp.split("/").pop() || imp);
    }
  }
  return [...new Set(imports)];
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const defRegex = /export\s+default\s+(?:function|class|const)\s+(\w+)/g;
  const namedRegex = /export\s+(?:function|class|const|let|var)\s+(\w+)/g;
  let match;
  while ((match = defRegex.exec(content)) !== null) exports.push(match[1]);
  while ((match = namedRegex.exec(content)) !== null) exports.push(match[1]);
  return [...new Set(exports)];
}

function extractFunctions(content: string): { name: string; signature: string; purpose: string }[] {
  const funcs: { name: string; signature: string; purpose: string }[] = [];
  const regex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    const params = match[2];
    const purpose = inferFunctionPurpose(name);
    funcs.push({ name, signature: params, purpose });
  }
  return funcs.slice(0, 10); // limit
}

function inferFunctionPurpose(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("get") || lower.includes("fetch")) return "data retrieval";
  if (lower.includes("set") || lower.includes("update")) return "data mutation";
  if (lower.includes("handle") || lower.includes("on")) return "event handler";
  if (lower.includes("validate") || lower.includes("check")) return "validation";
  if (lower.includes("render") || lower.includes("display")) return "UI rendering";
  if (lower.includes("auth") || lower.includes("login")) return "authentication";
  if (lower.includes("init") || lower.includes("setup")) return "initialization";
  return "utility function";
}

function generateSummary(path: string, content: string): string {
  const purpose = extractPurpose(path, content);
  const name = path.split("/").pop()?.replace(/\.\w+$/, "") || "";
  const exports = extractExports(content);
  if (exports.length > 0) {
    return `${name}: ${purpose} — exports ${exports.join(", ")}`;
  }
  return `${name}: ${purpose}`;
}

// ─── Compress entire project ──────────────────────
export function compressProject(
  files: Record<string, string>,
  activeFilePath: string | null,
  relevantPaths: string[] = []
): Record<string, CompressedFile> {
  const compressed: Record<string, CompressedFile> = {};

  for (const [path, content] of Object.entries(files)) {
    let level: CompressionLevel = 3; // default: memory summary

    // Active file → full code (level 1)
    if (path === activeFilePath) {
      level = 1;
    }
    // Relevant files (from RAG) → AST summary (level 2)
    else if (relevantPaths.includes(path)) {
      level = 2;
    }
    // Everything else → memory summary (level 3)

    compressed[path] = compressFile(path, content, level);
  }

  return compressed;
}

// ─── Format compressed context for the model ───────
export function formatCompressedContext(
  compressed: Record<string, CompressedFile>,
  maxTokens: number = 2000
): string {
  let ctx = "";
  let tokensUsed = 0;

  // Active file first (level 1)
  const activeFile = Object.values(compressed).find(f => f.level === 1);
  if (activeFile) {
    ctx += `## Active File: \`${activeFile.path}\`\n`;
    ctx += `- Purpose: ${activeFile.purpose || "N/A"}\n`;
    if (activeFile.exports) ctx += `- Exports: ${activeFile.exports.join(", ")}\n`;
    if (activeFile.imports) ctx += `- Key imports: ${activeFile.imports.slice(0, 5).join(", ")}\n`;
    if (activeFile.functions) {
      ctx += `- Functions:\n`;
      activeFile.functions.forEach(f => {
        ctx += `  - ${f.name}(${f.signature}): ${f.purpose}\n`;
      });
    }
    ctx += "\n";
    tokensUsed += activeFile.tokenEstimate;
  }

  // Relevant files (level 2)
  const relevantFiles = Object.values(compressed).filter(f => f.level === 2);
  if (relevantFiles.length > 0) {
    ctx += `## Related Files\n`;
    for (const file of relevantFiles) {
      if (tokensUsed > maxTokens) break;
      ctx += `### \`${file.path}\`\n`;
      if (file.purpose) ctx += `- Purpose: ${file.purpose}\n`;
      if (file.exports) ctx += `- Exports: ${file.exports.join(", ")}\n`;
      if (file.imports) ctx += `- Imports: ${file.imports.join(", ")}\n`;
      if (file.functions && file.functions.length > 0) {
        ctx += `- Functions: ${file.functions.map(f => f.name).join(", ")}\n`;
      }
      ctx += "\n";
      tokensUsed += file.tokenEstimate;
    }
  }

  // Other files summary (level 3) — only a count
  const otherFiles = Object.values(compressed).filter(f => f.level >= 3);
  if (otherFiles.length > 0) {
    ctx += `## Project Overview\n`;
    ctx += `- ${otherFiles.length} additional files in project\n`;
    // Show top-level folders summary
    const folders = new Set<string>();
    otherFiles.forEach(f => {
      const parts = f.path.split("/");
      if (parts.length > 1) folders.add(parts[0]);
    });
    if (folders.size > 0) {
      ctx += `- Folders: ${Array.from(folders).join(", ")}\n`;
    }
    // Show semantic groups
    const purposes = otherFiles.map(f => f.purpose || f.summary || "").filter(Boolean);
    if (purposes.length > 0) {
      const unique = [...new Set(purposes)].slice(0, 10);
      ctx += `- File types: ${unique.join("; ")}\n`;
    }
  }

  return ctx;
}