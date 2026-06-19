const BRAIN_DB = "netsyra-brain-v2";
const STORE = "decisions";

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  if (!isBrowser()) throw new Error("IndexedDB not available");
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BRAIN_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "timestamp" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeDecision(decision: any) {
  if (!isBrowser()) return;   // ← silently skip on server
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ ...decision, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDecisions(): Promise<any[]> {
  if (!isBrowser()) return [];   // ← return empty array on server
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function createArchitectureGraph(files: Record<string, string>): any {
  const graph: any = {};
  for (const path of Object.keys(files)) {
    const name = path.split("/").pop()?.replace(/\.\w+$/, "");
    if (name) graph[name] = [];
  }
  return graph;
}