import path from "path";

export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescriptreact",
    ".js": "javascript",
    ".jsx": "javascriptreact",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".json": "json",
    ".md": "markdown",
    ".mdx": "markdown",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".less": "less",
    ".py": "python",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".kt": "kotlin",
    ".swift": "swift",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".xml": "xml",
    ".svg": "xml",
    ".sql": "sql",
    ".graphql": "graphql",
    ".gql": "graphql",
    ".prisma": "prisma",
    ".env": "dotenv",
    ".gitignore": "gitignore",
    ".dockerfile": "dockerfile",
    ".dockerignore": "gitignore",
  };

  const basename = path.basename(filePath).toLowerCase();
  if (map[basename]) return map[basename];
  if (basename === "dockerfile") return "dockerfile";
  if (basename === "makefile") return "makefile";

  return map[ext] ?? "plaintext";
}
