export interface ValidationError {
  file: string;
  line: number;
  message: string;
  type: "syntax" | "import" | "reference" | "consistency";
}

// Main validation function
export function validatePatch(
  files: { path: string; content: string }[],
  projectFiles: Record<string, string>  // all files in project
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  for (const file of files) {
    // 1. Syntax check (basic bracket/parenthesis matching)
    const syntaxErrors = checkSyntax(file.content, file.path);
    errors.push(...syntaxErrors);

    // 2. Import validation (do imported files exist?)
    const importErrors = checkImports(file.content, file.path, projectFiles);
    errors.push(...importErrors);

    // 3. Component usage validation (are used components defined?)
    const referenceErrors = checkReferences(file.content, file.path, projectFiles, files);
    errors.push(...referenceErrors);
  }

  // 4. Consistency check: are there cross-file dependencies that might be broken?
  const consistencyErrors = checkConsistency(files, projectFiles);
  errors.push(...consistencyErrors);

  return { valid: errors.length === 0, errors };
}

// ── Basic syntax checker ───────────────────────────
function checkSyntax(code: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split("\n");

  // Unmatched brackets, parentheses, braces
  let brackets = 0, parens = 0, braces = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === "(") parens++;
      if (ch === ")") parens--;
      if (ch === "[") brackets++;
      if (ch === "]") brackets--;
      if (ch === "{") braces++;
      if (ch === "}") braces--;
    }
    if (parens < 0) {
      errors.push({ file: filePath, line: i + 1, message: "Unexpected closing parenthesis", type: "syntax" });
      parens = 0;
    }
    if (brackets < 0) {
      errors.push({ file: filePath, line: i + 1, message: "Unexpected closing bracket", type: "syntax" });
      brackets = 0;
    }
    if (braces < 0) {
      errors.push({ file: filePath, line: i + 1, message: "Unexpected closing brace", type: "syntax" });
      braces = 0;
    }
  }
  if (parens !== 0) errors.push({ file: filePath, line: lines.length, message: "Missing closing parenthesis", type: "syntax" });
  if (brackets !== 0) errors.push({ file: filePath, line: lines.length, message: "Missing closing bracket", type: "syntax" });
  if (braces !== 0) errors.push({ file: filePath, line: lines.length, message: "Missing closing brace", type: "syntax" });

  // Common syntax errors: missing closing semicolon (not critical, so just warn)
  // We'll skip that for now.

  return errors;
}

// ── Import validator ───────────────────────────────
function checkImports(
  code: string,
  filePath: string,
  projectFiles: Record<string, string>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const importRegex = /import\s+(?:(?:\{[^}]*\}|[\w*]+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1];
    // Skip external packages (no relative path)
    if (!importPath.startsWith(".") && !importPath.startsWith("/")) continue;
    // Resolve relative path
    const currentDir = filePath.split("/").slice(0, -1).join("/");
    const resolved = resolveImportPath(importPath, currentDir, Object.keys(projectFiles));
    if (!resolved) {
      errors.push({
        file: filePath,
        line: getLineNumber(code, match.index),
        message: `Import "${importPath}" not found in project`,
        type: "import",
      });
    }
  }
  return errors;
}

function resolveImportPath(importPath: string, currentDir: string, allPaths: string[]): string | null {
  const base = currentDir ? currentDir + "/" : "";
  const candidate = (base + importPath).replace(/\/\.\//g, "/");
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
  for (const ext of extensions) {
    if (allPaths.includes(candidate + ext)) return candidate + ext;
  }
  return null;
}

// ── Reference validator (component usage) ──────────
function checkReferences(
  code: string,
  filePath: string,
  projectFiles: Record<string, string>,
  patchFiles: { path: string; content: string }[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  // Find JSX tags
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)\s*(\/>|>)/g;
  let match;
  while ((match = componentRegex.exec(code)) !== null) {
    const component = match[1];
    // Check if imported in this file
    const isImported = new RegExp(`import\\s+\\{[^}]*\\b${component}\\b[^}]*\\}|import\\s+${component}\\s+from`).test(code);
    if (isImported) continue;
    // Check if defined in the same file
    if (code.includes(`function ${component}`) || code.includes(`const ${component}`) || code.includes(`class ${component}`)) continue;
    // Check if defined in any project file
    const existsInProject = Object.entries(projectFiles).some(([p, c]) =>
      c.includes(`export function ${component}`) ||
      c.includes(`export const ${component}`) ||
      c.includes(`export default ${component}`) ||
      c.includes(`export class ${component}`)
    );
    if (!existsInProject) {
      // Check in patch files too
      const existsInPatch = patchFiles.some(f =>
        f.content.includes(`export function ${component}`) ||
        f.content.includes(`export const ${component}`) ||
        f.content.includes(`export default ${component}`) ||
        f.content.includes(`export class ${component}`)
      );
      if (!existsInPatch) {
        errors.push({
          file: filePath,
          line: getLineNumber(code, match.index),
          message: `Component "${component}" is not defined or imported`,
          type: "reference",
        });
      }
    }
  }
  return errors;
}

// ── Cross‑file consistency check ──────────────────
function checkConsistency(
  patchFiles: { path: string; content: string }[],
  projectFiles: Record<string, string>
): ValidationError[] {
  const errors: ValidationError[] = [];
  // For each patched file, check if other patched files that import from it are updated consistently.
  // This is simplistic: we just check that if file A is modified and file B imports from A, then B should also be in the patch (if B needs changes).
  // Real implementation would be more complex. For now, we skip.
  return errors;
}

// Helper: get line number from character index
function getLineNumber(code: string, index: number): number {
  return code.slice(0, index).split("\n").length;
}