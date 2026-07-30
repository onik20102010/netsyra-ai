import type { NetsyraDB, FileRecord, SymbolRecord, RelationRecord } from './db';

export interface SymbolContext {
  targetFile: string;
  targetSymbol?: SymbolRecord;
  relatedFiles: FileRecord[];
  callers: RelationRecord[];
  dependents: RelationRecord[];
  allRelatedPaths: string[];
}

export async function getSymbolContext(
  db: NetsyraDB,
  symbolName: string
): Promise<SymbolContext | null> {
  // 1. Find the definition (where is this symbol declared?)
  const definitions = await db.symbols.where('name').equals(symbolName).toArray();

  if (definitions.length === 0) return null;

  const targetSymbol = definitions[0];
  const targetFilePath = targetSymbol.filePath;

  // 2. Find all callers (who calls/uses this symbol?)
  const callers = await db.relations
    .where('calleeSymbolName')
    .equals(symbolName)
    .toArray();
  const callerPaths = [...new Set(callers.map((r) => r.callerFilePath))];

  // 3. Find all dependents (who imports the file containing this symbol?)
  const dependents = await db.relations
    .where('calleeFilePath')
    .equals(targetFilePath)
    .toArray();
  const dependentPaths = [...new Set(dependents.map((r) => r.callerFilePath))];

  // 4. Collect unique set of files to load for the AI
  const allRelatedPaths = [...new Set([targetFilePath, ...callerPaths, ...dependentPaths])];

  // 5. Fetch actual file records from IndexedDB
  const relatedFiles = await db.files.where('path').anyOf(allRelatedPaths).toArray();

  return {
    targetFile: targetFilePath,
    targetSymbol,
    relatedFiles,
    callers,
    dependents,
    allRelatedPaths,
  };
}

export async function getDependentsOfFile(
  db: NetsyraDB,
  filePath: string
): Promise<string[]> {
  const dependents = await db.relations
    .where('calleeFilePath')
    .equals(filePath)
    .toArray();
  return [...new Set(dependents.map((r) => r.callerFilePath))];
}

export async function getDependenciesOfFile(
  db: NetsyraDB,
  filePath: string
): Promise<string[]> {
  const dependencies = await db.relations
    .where('callerFilePath')
    .equals(filePath)
    .toArray();
  return [...new Set(dependencies.map((r) => r.calleeFilePath))];
}

export async function searchSymbols(
  db: NetsyraDB,
  query: string,
  limit: number = 20
): Promise<SymbolRecord[]> {
  const lowerQuery = query.toLowerCase();
  const allSymbols = await db.symbols.toArray();
  return allSymbols
    .filter((s) => s.name.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}

export async function getCallGraph(
  db: NetsyraDB,
  filePath: string,
  depth: number = 2
): Promise<RelationRecord[]> {
  const visited = new Set<string>();
  const result: RelationRecord[] = [];

  async function traverse(currentPath: string, currentDepth: number) {
    if (currentDepth > depth || visited.has(currentPath)) return;
    visited.add(currentPath);

    const relations = await db.relations
      .where('callerFilePath')
      .equals(currentPath)
      .toArray();

    result.push(...relations);

    for (const rel of relations) {
      if (rel.calleeFilePath && rel.calleeFilePath !== currentPath) {
        await traverse(rel.calleeFilePath, currentDepth + 1);
      }
    }
  }

  await traverse(filePath, 0);
  return result;
}
