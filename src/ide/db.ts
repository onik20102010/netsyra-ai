import Dexie, { type Table } from 'dexie';

export interface FileRecord {
  id: string;
  path: string;
  content?: string;
  hash: string;
  lastModified: number;
}

export interface SymbolRecord {
  id?: number;
  name: string;
  kind: string;
  filePath: string;
  line: number;
  column: number;
}

export interface ImportRecord {
  id?: number;
  filePath: string;
  importedPaths: string[];
}

export interface MetadataRecord {
  id: string;
  lastIndexed?: number;
  fileCount?: number;
}

export interface RelationRecord {
  id?: number;
  symbolName: string;
  callerFilePath: string;
  calleeFilePath: string;
  calleeSymbolName?: string;
  calleeKind: string;
}

export class NetsyraDB extends Dexie {
  files!: Table<FileRecord, string>;
  symbols!: Table<SymbolRecord, number>;
  imports!: Table<ImportRecord, number>;
  metadata!: Table<MetadataRecord, string>;
  relations!: Table<RelationRecord, number>;

  constructor(dbName: string) {
    super(dbName);
    this.version(1).stores({
      files: 'id, path, hash, lastModified',
      symbols: '++, name, kind, filePath',
      imports: '++, filePath',
      embeddings: '++, filePath',
      metadata: 'id',
    });
    this.version(2).stores({
      files: 'id, path, hash, lastModified',
      symbols: '++, name, kind, filePath',
      imports: '++, filePath',
      embeddings: '++, filePath',
      metadata: 'id',
      relations: '++, symbolName, callerFilePath, calleeFilePath, calleeSymbolName',
    });
    // v3: Remove embeddings table (no longer used)
    this.version(3).stores({
      files: 'id, path, hash, lastModified',
      symbols: '++, name, kind, filePath',
      imports: '++, filePath',
      metadata: 'id',
      relations: '++, symbolName, callerFilePath, calleeFilePath, calleeSymbolName',
    });
  }
}

// Per-user database instances — each user gets their own isolated IndexedDB
const dbInstances = new Map<string, NetsyraDB>();

export function getDB(userId: string): NetsyraDB {
  const dbName = `NetsyraAI_${userId}`;
  if (!dbInstances.has(dbName)) {
    dbInstances.set(dbName, new NetsyraDB(dbName));
  }
  return dbInstances.get(dbName)!;
}

// Clear a user's database (on sign-out or user switch)
export async function clearUserDB(userId: string): Promise<void> {
  const dbName = `NetsyraAI_${userId}`;
  const instance = dbInstances.get(dbName);
  if (instance) {
    await instance.delete();
    dbInstances.delete(dbName);
  }
}

// Fallback for anonymous/local-only usage (not recommended for multi-user)
export const db = new NetsyraDB('NetsyraAI_local');
