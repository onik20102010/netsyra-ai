import { detectLanguage } from "./language";

export function generateSummary(filePath: string, content: string): string {
  const language = detectLanguage(filePath);
  const firstComment = extractFirstComment(content, language);
  const firstLines = content.split("\n").slice(0, 3).join(" ").trim();
  const firstNonEmptyLine = firstLines.replace(/\s+/g, " ").slice(0, 120);

  if (firstComment) return firstComment.slice(0, 200);
  if (firstNonEmptyLine) return firstNonEmptyLine;
  return `${language} file`;
}

function extractFirstComment(content: string, language: string): string | null {
  const lines = content.split("\n");
  const commentMarkers = ["//", "#", "--", "/*", "*", "<!--"];
  const candidates: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const isComment = commentMarkers.some((marker) => trimmed.startsWith(marker));
    if (isComment) {
      candidates.push(trimmed.replace(/^\s*(\/\/|#|\/\*|\*|<!--|--)/, "").trim());
    } else {
      break;
    }
  }

  if (candidates.length === 0) return null;
  return candidates.join(" ").slice(0, 200);
}
