import { WorkingMemoryItem } from "../memory-types";

export class WorkingMemory {
  private store: Map<string, WorkingMemoryItem> = new Map();
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  set(key: string, value: any, expiresInMs?: number): void {
    const item: WorkingMemoryItem = {
      id: crypto.randomUUID(),
      type: "working",
      userId: this.userId,
      key,
      value,
      createdAt: new Date(),
      updatedAt: new Date(),
      importance: 0.5,
    };

    if (expiresInMs) {
      item.expiresAt = new Date(Date.now() + expiresInMs);
    }

    this.store.set(key, item);
  }

  get<T = any>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt && item.expiresAt < new Date()) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getAll(): WorkingMemoryItem[] {
    return Array.from(this.store.values()).filter(item => {
      if (!item.expiresAt) return true;
      if (item.expiresAt > new Date()) return true;
      this.store.delete(item.key);
      return false;
    });
  }

  getAllForPrompt(): string {
    const items = this.getAll();
    if (items.length === 0) return "";
    return items.map(item => `${item.key}: ${JSON.stringify(item.value)}`).join("\n");
  }
}
