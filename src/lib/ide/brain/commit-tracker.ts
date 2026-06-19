const DB_NAME = "netsyra-commits";
const STORE_NAME = "commits";
const SNAPSHOT_KEY = "last_snapshot";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Store a snapshot of the current project state
export async function storeSnapshot(files: Record<string, string>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const snapshot = {
      id: SNAPSHOT_KEY,
      files: { ...files },
      timestamp: Date.now(),
    };
    store.put(snapshot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get the last stored snapshot
export async function getLastSnapshot(): Promise<Record<string, string> | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(SNAPSHOT_KEY);
    req.onsuccess = () => resolve(req.result?.files || null);
    req.onerror = () => reject(req.error);
  });
}

// Compare current files with last snapshot, return changes
export async function getChanges(
  currentFiles: Record<string, string>
): Promise<{
  added: string[];
  modified: string[];
  deleted: string[];
  diffSummary: string;
}> {
  const lastSnapshot = await getLastSnapshot();
  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];

  if (!lastSnapshot) {
    // No previous snapshot — all files are new
    added.push(...Object.keys(currentFiles));
    return {
      added,
      modified,
      deleted,
      diffSummary: `Initial commit: ${added.length} file(s)`,
    };
  }

  const currentPaths = Object.keys(currentFiles);
  const lastPaths = Object.keys(lastSnapshot);

  for (const path of currentPaths) {
    if (!(path in lastSnapshot)) {
      added.push(path);
    } else if (currentFiles[path] !== lastSnapshot[path]) {
      modified.push(path);
    }
  }

  for (const path of lastPaths) {
    if (!(path in currentFiles)) {
      deleted.push(path);
    }
  }

  let diffSummary = "";
  if (added.length) diffSummary += `Added: ${added.join(", ")}\n`;
  if (modified.length) diffSummary += `Modified: ${modified.join(", ")}\n`;
  if (deleted.length) diffSummary += `Deleted: ${deleted.join(", ")}\n`;

  return { added, modified, deleted, diffSummary: diffSummary.trim() };
}

// Store a commit in history
export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  added: string[];
  modified: string[];
  deleted: string[];
  filesSnapshot: Record<string, string>;
}

export async function storeCommit(commit: Commit): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(commit);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCommits(): Promise<Commit[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      // Filter out snapshot entries
      resolve(all.filter((c: any) => c.id !== SNAPSHOT_KEY).sort((a: any, b: any) => b.timestamp - a.timestamp));
    };
    req.onerror = () => reject(req.error);
  });
}