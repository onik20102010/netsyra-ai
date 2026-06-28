import {
  BaseMemoryItem,
  MemoryQuery,
  MemoryResult,
  MemoryType,
  ShortTermMemoryItem,
  LongTermMemoryItem,
} from "./memory-types";
import { WorkingMemory } from "./working/working-memory";

export class MemoryManager {
  private workingMemory: WorkingMemory;
  private userId: string;
  private conversationId?: string;

  // Temporary in-memory stores (will integrate with Supabase/Redis later)
  private shortTermStore: Map<string, ShortTermMemoryItem[]> = new Map();
  private longTermStore: Map<string, LongTermMemoryItem[]> = new Map();

  constructor(userId: string, conversationId?: string) {
    this.userId = userId;
    this.conversationId = conversationId;
    this.workingMemory = new WorkingMemory(userId);
  }

  // ============ Working Memory ============
  getWorking(): WorkingMemory {
    return this.workingMemory;
  }

  // ============ Retrieval Pipeline ============
  async retrieveRelevantContext(
    userMessage: string,
    options?: Partial<MemoryQuery>
  ): Promise<string> {
    const query: MemoryQuery = {
      userId: this.userId,
      query: userMessage,
      types: ["short-term", "long-term", "user", "project"],
      limit: 20,
      conversationId: this.conversationId,
      minImportance: 0.2,
      ...options,
    };

    const results: BaseMemoryItem[] = [];

    // 1. Get short-term memory
    const shortTermResults = await this.getShortTerm(query);
    results.push(...shortTermResults.items);

    // 2. Get long-term memory (keyword matching)
    const longTermResults = await this.getLongTerm(query);
    results.push(...longTermResults.items);

    // 3. Get user memory
    const userResults = await this.getUserMemory(query);
    results.push(...userResults.items);

    // 4. Get project memory
    const projectResults = await this.getProjectMemory(query);
    results.push(...projectResults.items);

    // Sort by importance
    results.sort((a, b) => (b.importance || 0) - (a.importance || 0));

    // Format for LLM prompt
    return this.formatContextForLLM(results);
  }

  // ============ Short-Term Memory ============
  async saveShortTerm(item: Omit<ShortTermMemoryItem, "id" | "type" | "createdAt" | "updatedAt" | "userId">): Promise<void> {
    const memory: ShortTermMemoryItem = {
      id: crypto.randomUUID(),
      type: "short-term",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: this.userId,
      importance: 0.5,
      ...item,
    };

    const convMemories = this.shortTermStore.get(item.conversationId) || [];
    convMemories.push(memory);

    // Keep only last 50 messages
    if (convMemories.length > 50) {
      convMemories.shift();
    }

    this.shortTermStore.set(item.conversationId, convMemories);
  }

  private async getShortTerm(query: MemoryQuery): Promise<MemoryResult> {
    const convId = query.conversationId || this.conversationId;
    if (!convId) return { items: [] };

    const items = this.shortTermStore.get(convId) || [];
    // Simple filtering by query keywords
    const searchQuery = query.query || "";
    const filtered = searchQuery
      ? items.filter(item => item.content?.toLowerCase().includes(searchQuery.toLowerCase()))
      : items;

    return {
      items: filtered.slice(-(query.limit || 20)),
      score: 1,
    };
  }

  // ============ Long-Term Memory ============
  async saveLongTerm(item: Omit<LongTermMemoryItem, "id" | "type" | "createdAt" | "updatedAt" | "userId">): Promise<void> {
    const memory: LongTermMemoryItem = {
      id: crypto.randomUUID(),
      type: "long-term",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: this.userId,
      importance: 0.8,
      lastAccessed: new Date(),
      ...item,
    };

    const userMemories = this.longTermStore.get(this.userId) || [];
    userMemories.push(memory);
    this.longTermStore.set(this.userId, userMemories);
  }

  private async getLongTerm(query: MemoryQuery): Promise<MemoryResult> {
    const items = this.longTermStore.get(query.userId) || [];
    // Simple keyword filtering
    const searchQuery = query.query || "";
    const filtered = searchQuery
      ? items.filter(item => item.content?.toLowerCase().includes(searchQuery.toLowerCase()))
      : items;

    // Update last accessed
    for (const item of filtered) {
      item.lastAccessed = new Date();
      item.updatedAt = new Date();
    }

    return {
      items: filtered.slice(0, query.limit || 10),
      score: 1,
    };
  }

  // ============ User Memory ============
  private async getUserMemory(query: MemoryQuery): Promise<MemoryResult> {
    return { items: [] };
  }

  // ============ Project Memory ============
  private async getProjectMemory(query: MemoryQuery): Promise<MemoryResult> {
    return { items: [] };
  }

  // ============ Helper Methods ============
  private formatContextForLLM(items: BaseMemoryItem[]): string {
    if (items.length === 0) return "";

    const sections: string[] = [];

    // Group by type
    const grouped: Partial<Record<MemoryType, BaseMemoryItem[]>> = {};
    for (const item of items) {
      const type = item.type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    }

    if (grouped["short-term"] && grouped["short-term"].length > 0) {
      sections.push(
        "Recent Conversation:\n" +
          grouped["short-term"]
            .slice(-15)
            .map(i => i.content)
            .join("\n")
      );
    }

    if (grouped["long-term"] && grouped["long-term"].length > 0) {
      sections.push(
        "Known Information:\n" +
          grouped["long-term"]
            .map(i => `• ${i.content}`)
            .join("\n")
      );
    }

    return sections.join("\n\n");
  }

  // ============ Cleanup ============
  clearAllWorking(): void {
    this.workingMemory.clear();
  }
}
