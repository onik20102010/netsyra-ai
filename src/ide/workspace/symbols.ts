import type { SymbolInfo } from "./types";

export function extractSymbols(filePath: string, content: string): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];
  const language = filePath.toLowerCase();

  const patterns: { kind: SymbolInfo["kind"]; regex: RegExp }[] = [
    { kind: "function", regex: /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/g },
    { kind: "function", regex: /(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g },
    { kind: "class", regex: /(?:export\s+)?class\s+([A-Za-z0-9_$]+)/g },
    { kind: "interface", regex: /(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/g },
    { kind: "type", regex: /(?:export\s+)?type\s+([A-Za-z0-9_$]+)/g },
    { kind: "component", regex: /(?:export\s+)?(?:function|const)\s+([A-Z][A-Za-z0-9_$]*)\s*(?:[\(\=]|\s*:\s*React)/g },
    { kind: "hook", regex: /(?:export\s+)?(?:function|const)\s+(use[A-Z][A-Za-z0-9_$]*)\s*(?:[\(\=]|\s*:\s*)/g },
    { kind: "export", regex: /export\s+(?:default\s+)?(?:const|let|var|class|function|interface|type|enum)\s+([A-Za-z0-9_$]+)/g },
    { kind: "variable", regex: /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/g },
  ];

  const lines = content.split("\n");

  for (const { kind, regex } of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      if (!name) continue;

      const index = match.index;
      const line = content.substring(0, index).split("\n").length;
      const lineText = lines[line - 1] ?? "";
      const column = lineText.indexOf(name) ?? 0;

      symbols.push({
        name,
        kind,
        range: {
          start: { line: line - 1, column },
          end: { line: line - 1, column: column + name.length },
        },
      });
    }
  }

  const unique = new Map<string, SymbolInfo>();
  for (const symbol of symbols) {
    const key = `${symbol.kind}:${symbol.name}`;
    if (!unique.has(key)) unique.set(key, symbol);
  }

  return Array.from(unique.values());
}
