// ═══════════════════════════════════════════════════════════════
// Netsyra IDE — File Utilities
// Language detection, file icons, path helpers
// ═══════════════════════════════════════════════════════════════

// ── Language Detection ──────────────────────────────────────────

const EXTENSION_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  html: "html",
  htm: "html",
  xml: "xml",
  svg: "xml",
  md: "markdown",
  mdx: "markdown",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  sql: "sql",
  dockerfile: "dockerfile",
  gitignore: "plaintext",
  env: "plaintext",
  txt: "plaintext",
  log: "plaintext",
};

const FILENAME_MAP: Record<string, string> = {
  "Dockerfile": "dockerfile",
  "Makefile": "makefile",
  ".gitignore": "plaintext",
  ".env": "plaintext",
  ".editorconfig": "plaintext",
  ".eslintrc": "json",
  ".prettierrc": "json",
};

export function getLanguage(filePath: string): string {
  const filename = filePath.split("/").pop() ?? filePath;
  if (FILENAME_MAP[filename]) return FILENAME_MAP[filename];
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MAP[ext] ?? "plaintext";
}

// ── File Type Icons (lucide-react names as strings) ─────────────

export type FileIconName =
  | "folder"
  | "folder-open"
  | "file"
  | "file-code"
  | "file-json"
  | "file-text"
  | "image"
  | "settings"
  | "database"
  | "terminal"
  | "git"
  | "package"
  | "lock"
  | "braces";

export function getFileIcon(name: string, type: "file" | "folder"): FileIconName {
  if (type === "folder") return "folder";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "rb", "go", "rs", "java", "c", "cpp", "cs", "php", "swift", "kt"].includes(ext)) return "file-code";
  if (["json"].includes(ext)) return "file-json";
  if (["png", "jpg", "jpeg", "gif", "bmp", "webp", "ico", "svg"].includes(ext)) return "image";
  if (["md", "mdx", "txt", "log"].includes(ext)) return "file-text";
  if (["env", "lock", "toml", "yaml", "yml"].includes(ext)) return "settings";
  if (["sql", "db"].includes(ext)) return "database";
  if (["sh", "bash", "zsh"].includes(ext)) return "terminal";
  if (name === ".gitignore" || name.includes("git")) return "git";
  if (name === "package.json" || ext === "lock") return "package";
  return "file";
}

// ── Path Helpers ────────────────────────────────────────────────

export function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function getDirName(path: string): string {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/") || "/";
}

export function getExtension(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export function joinPath(...parts: string[]): string {
  return normalizePath(parts.join("/"));
}
