export function analyzeWorkspace(files: Record<string, string>): {
  isEmpty: boolean;
  framework: string;
  hasPackageJson: boolean;
  fileCount: number;
  topLevelFolders: string[];
} {
  const paths = Object.keys(files);
  const fileCount = paths.length;
  const hasPackageJson = paths.some(p => p.endsWith("package.json"));
  const topLevelFolders = new Set<string>();
  paths.forEach(p => {
    const parts = p.split("/");
    if (parts.length > 1) topLevelFolders.add(parts[0]);
  });

  let framework = "Unknown";
  if (paths.some(p => p.includes("next.config"))) framework = "Next.js";
  else if (paths.some(p => p.includes("vite.config"))) framework = "Vite";
  else if (paths.some(p => p.includes("react"))) framework = "React";
  else if (paths.some(p => p.endsWith(".py"))) framework = "Python";

  const isEmpty = fileCount === 0;

  return { isEmpty, framework, hasPackageJson, fileCount, topLevelFolders: Array.from(topLevelFolders) };
}