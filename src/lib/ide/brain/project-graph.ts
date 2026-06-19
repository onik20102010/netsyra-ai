// ─── Types ────────────────────────────────────────
export interface GraphNode {
  path: string;
  type: "component" | "function" | "class" | "route" | "config" | "unknown";
  exports: string[];
  imports: string[];
  usedBy: string[];        // files that import from this
  lastEdited: number;
  semanticTags: string[];
}

export interface ProjectGraph {
  nodes: Record<string, GraphNode>;
  dependencies: Record<string, string[]>;   // package → version
  framework: string;
  routeMap: Record<string, string>;         // route → file path
  builtAt: number;
}

// ─── In‑memory cache ──────────────────────────────
let projectGraph: ProjectGraph | null = null;

export function getProjectGraph(): ProjectGraph | null {
  return projectGraph;
}

export function setProjectGraph(graph: ProjectGraph) {
  projectGraph = graph;
}

// ─── IndexedDB persistence ────────────────────────
const GRAPH_DB = "netsyra-graph";
const GRAPH_STORE = "graphs";

function openGraphDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(GRAPH_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(GRAPH_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function persistGraph(graph: ProjectGraph): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openGraphDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GRAPH_STORE, "readwrite");
    tx.objectStore(GRAPH_STORE).put({ id: "current", graph, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPersistedGraph(): Promise<ProjectGraph | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openGraphDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GRAPH_STORE, "readonly");
      const req = tx.objectStore(GRAPH_STORE).get("current");
      req.onsuccess = () => resolve(req.result?.graph || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ─── Parser (lightweight regex, no AST) ────────────
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const regex = /import\s+(?:\{[^}]*\}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  const reqRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = reqRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function extractExports(content: string): string[] {
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

function detectNodeType(path: string, content: string): GraphNode["type"] {
  const lower = path.toLowerCase();
  if (lower.includes("route") || lower.includes("/api/")) return "route";
  if (lower.includes("component") || lower.endsWith(".tsx") || lower.endsWith(".jsx")) return "component";
  if (content.includes("export function") || content.includes("export class")) return "function";
  if (content.includes("export class")) return "class";
  if (lower.includes("config") || lower.includes(".json")) return "config";
  return "unknown";
}

function detectSemanticTags(path: string, content: string): string[] {
  const tags: string[] = [];
  const lower = path.toLowerCase();
  if (lower.includes("auth") || lower.includes("login")) tags.push("authentication");
  if (lower.includes("chat") || lower.includes("bot")) tags.push("chatbot");
  if (lower.includes("db") || lower.includes("database")) tags.push("database");
  if (lower.includes("api")) tags.push("api");
  if (lower.includes("ui") || lower.includes("component")) tags.push("ui");
  if (lower.includes("test") || lower.endsWith(".test.ts")) tags.push("testing");
  return tags;
}

function resolveImportPath(importPath: string, currentFile: string, files: Record<string, string>): string | null {
  if (importPath.startsWith(".") || importPath.startsWith("/")) {
    const currentDir = currentFile.split("/").slice(0, -1).join("/");
    const resolved = (currentDir ? currentDir + "/" : "") + importPath.replace(/^\.\//, "");
    const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".py", "/index.ts", "/index.tsx", "/index.js"];
    for (const ext of extensions) {
      const fullPath = resolved + ext;
      if (files[fullPath]) return fullPath;
    }
    return resolved;
  }
  return null;
}

// ─── Graph builder ─────────────────────────────────
export function buildProjectGraph(files: Record<string, string>): ProjectGraph {
  const nodes: Record<string, GraphNode> = {};
  const dependencies: Record<string, string[]> = {};
  const routeMap: Record<string, string> = {};
  const now = Date.now();

  const importMap: Record<string, string[]> = {};
  for (const [path, content] of Object.entries(files)) {
    const rawImports = extractImports(content);
    const resolvedImports: string[] = [];
    rawImports.forEach(imp => {
      const resolved = resolveImportPath(imp, path, files);
      if (resolved) resolvedImports.push(resolved);
    });
    importMap[path] = resolvedImports;

    const exports = extractExports(content);
    const type = detectNodeType(path, content);
    const tags = detectSemanticTags(path, content);

    nodes[path] = {
      path,
      type,
      exports,
      imports: resolvedImports,
      usedBy: [],
      lastEdited: now,
      semanticTags: tags,
    };

    if (path.includes("/app/") && (path.endsWith("page.tsx") || path.endsWith("page.ts"))) {
      const route = "/" + path.split("/app/")[1].replace(/\/page\.(tsx|ts)$/, "");
      routeMap[route] = path;
    }
    if (path.includes("/api/") && path.endsWith(".ts")) {
      routeMap["/api/" + path.split("/api/")[1].replace(/\.ts$/, "")] = path;
    }
  }

  for (const [path, node] of Object.entries(nodes)) {
    node.imports.forEach(importedPath => {
      if (nodes[importedPath] && !nodes[importedPath].usedBy.includes(path)) {
        nodes[importedPath].usedBy.push(path);
      }
    });
  }

  if (files["package.json"]) {
    try {
      const pkg = JSON.parse(files["package.json"]);
      Object.assign(dependencies, pkg.dependencies || {}, pkg.devDependencies || {});
    } catch {}
  }

  let framework = "Unknown";
  const allPaths = Object.keys(files);
  if (allPaths.some(p => p.includes("next.config"))) framework = "Next.js";
  else if (allPaths.some(p => p.includes("vite.config"))) framework = "Vite";
  else if (allPaths.some(p => p.includes("react"))) framework = "React";
  else if (allPaths.some(p => p.endsWith(".py"))) framework = "Python";

  const graph: ProjectGraph = {
    nodes,
    dependencies: Object.keys(dependencies).reduce((acc, k) => ({ ...acc, [k]: [dependencies[k]] }), {}),
    framework,
    routeMap,
    builtAt: now,
  };

  setProjectGraph(graph);
  persistGraph(graph); // fire-and-forget persistence

  return graph;
}

// ─── Query helpers ─────────────────────────────────
export function getFilesImpacting(path: string): string[] {
  const graph = getProjectGraph();
  if (!graph || !graph.nodes[path]) return [];
  const directUsers = graph.nodes[path].usedBy;
  const indirectUsers: string[] = [];
  directUsers.forEach(user => {
    if (graph.nodes[user]) {
      indirectUsers.push(...graph.nodes[user].usedBy);
    }
  });
  return [...new Set([...directUsers, ...indirectUsers])];
}

export function getRelatedFiles(query: string): string[] {
  const graph = getProjectGraph();
  if (!graph) return [];
  const results: string[] = [];
  const lower = query.toLowerCase();
  for (const [path, node] of Object.entries(graph.nodes)) {
    if (
      node.semanticTags.some(tag => lower.includes(tag)) ||
      node.exports.some(exp => lower.includes(exp.toLowerCase())) ||
      path.toLowerCase().includes(lower)
    ) {
      results.push(path);
    }
  }
  return results.slice(0, 10);
}

export function formatGraphContext(): string {
  const graph = getProjectGraph();
  if (!graph) return "";
  let ctx = "\n## Project Knowledge Graph\n";
  ctx += `- Framework: ${graph.framework}\n`;
  ctx += `- Files: ${Object.keys(graph.nodes).length}\n`;
  ctx += `- Routes: ${Object.keys(graph.routeMap).length}\n`;

  const topUsed = Object.values(graph.nodes)
    .filter(n => n.usedBy.length > 0)
    .sort((a, b) => b.usedBy.length - a.usedBy.length)
    .slice(0, 5);

  if (topUsed.length > 0) {
    ctx += "\n### Key Shared Files\n";
    topUsed.forEach(n => {
      ctx += `- \`${n.path}\` → used by ${n.usedBy.length} file(s)\n`;
    });
  }

  if (Object.keys(graph.routeMap).length > 0) {
    ctx += "\n### Routes\n";
    Object.entries(graph.routeMap).slice(0, 10).forEach(([route, file]) => {
      ctx += `- \`${route}\` → \`${file}\`\n`;
    });
  }

  const allTags = new Set<string>();
  Object.values(graph.nodes).forEach(n => n.semanticTags.forEach(t => allTags.add(t)));
  if (allTags.size > 0) {
    ctx += `\n### Semantic Tags\n`;
    allTags.forEach(tag => {
      const filesWithTag = Object.values(graph.nodes).filter(n => n.semanticTags.includes(tag)).map(n => n.path);
      ctx += `- ${tag}: ${filesWithTag.length} file(s)\n`;
    });
  }

  return ctx;
}

// ─── Dependency chain analysis ─────────────────────
export function getFullDependencyChain(startPath: string): string[] {
  const graph = getProjectGraph();
  if (!graph || !graph.nodes[startPath]) return [startPath];

  const visited = new Set<string>();
  const result: string[] = [];

  function walk(path: string) {
    if (visited.has(path)) return;
    visited.add(path);
    result.push(path);
    const node = graph?.nodes[path];
    if (node) {
      node.imports.forEach(walk);
      node.usedBy.forEach(walk);
    }
  }

  walk(startPath);
  return result;
}

// ─── Circular dependency detection ─────────────────
export function detectCircularDependencies(): string[][] {
  const graph = getProjectGraph();
  if (!graph) return [];

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const stack: string[] = [];

  function dfs(path: string): boolean {
    if (inStack.has(path)) {
      const cycleStart = stack.indexOf(path);
      cycles.push([...stack.slice(cycleStart), path]);
      return true;
    }
    if (visited.has(path)) return false;

    visited.add(path);
    inStack.add(path);
    stack.push(path);

    const node = graph?.nodes[path];
    if (node) {
      for (const imp of node.imports) {
        if (graph?.nodes[imp]) dfs(imp);
      }
    }

    stack.pop();
    inStack.delete(path);
    return false;
  }

  for (const path of Object.keys(graph.nodes)) {
    dfs(path);
  }

  return cycles;
}

// ─── Impact analysis ───────────────────────────────
export interface ImpactReport {
  targetFile: string;
  directlyAffected: string[];
  indirectlyAffected: string[];
  fullChain: string[];
  circularDependencies: string[][];
  routesAffected: string[];
}

export function getImpactAnalysis(targetFile: string): ImpactReport {
  const graph = getProjectGraph();
  const nodes = graph?.nodes || {};
  const node = nodes[targetFile];

  const directlyAffected = node?.usedBy || [];
  const indirectlyAffected: string[] = [];
  const fullChain = getFullDependencyChain(targetFile);

  directlyAffected.forEach(file => {
    const fileNode = nodes[file];
    if (fileNode) {
      fileNode.usedBy.forEach(u => {
        if (!directlyAffected.includes(u) && !indirectlyAffected.includes(u) && u !== targetFile) {
          indirectlyAffected.push(u);
        }
      });
    }
  });

  const routesAffected: string[] = [];
  if (graph?.routeMap) {
    Object.entries(graph.routeMap).forEach(([route, file]) => {
      if (fullChain.includes(file)) routesAffected.push(route);
    });
  }

  const circularDependencies = detectCircularDependencies().filter(cycle =>
    cycle.includes(targetFile)
  );

  return {
    targetFile,
    directlyAffected,
    indirectlyAffected,
    fullChain,
    circularDependencies,
    routesAffected,
  };
}

// ─── Format impact for the agent ───────────────────
export function formatImpactContext(impact: ImpactReport): string {
  let ctx = `\n## File Impact Analysis\n`;
  ctx += `- Target: \`${impact.targetFile}\`\n`;

  if (impact.circularDependencies.length > 0) {
    ctx += `\n### ⚠️ Circular Dependencies Detected\n`;
    impact.circularDependencies.forEach((cycle, i) => {
      ctx += `- Cycle ${i + 1}: ${cycle.join(" → ")}\n`;
    });
    ctx += `\n**WARNING:** Fix circular dependencies before making changes.\n`;
  }

  if (impact.directlyAffected.length > 0) {
    ctx += `\n### Directly Affected Files (import from target)\n`;
    impact.directlyAffected.forEach(f => ctx += `- \`${f}\`\n`);
  }

  if (impact.indirectlyAffected.length > 0) {
    ctx += `\n### Indirectly Affected Files (second-level)\n`;
    impact.indirectlyAffected.forEach(f => ctx += `- \`${f}\`\n`);
  }

  if (impact.routesAffected.length > 0) {
    ctx += `\n### Routes Affected\n`;
    impact.routesAffected.forEach(r => ctx += `- \`${r}\`\n`);
  }

  ctx += `\n### Full Dependency Chain\n`;
  ctx += `${impact.fullChain.length} files total.\n`;

  return ctx;
}