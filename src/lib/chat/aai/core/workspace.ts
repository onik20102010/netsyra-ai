import { AAIMessage, WorkspaceState } from "../types";
import { MAX_SHORT_TERM_MEMORY_LIMIT, MAX_LONG_TERM_MEMORY_LIMIT } from "../constants";

/**
 * Workspace: Manages conversation history and memory state
 */
export class Workspace {
  private state: WorkspaceState;

  constructor(initialState?: Partial<WorkspaceState>) {
    this.state = {
      conversationHistory: initialState?.conversationHistory || [],
      shortTermMemory: initialState?.shortTermMemory || [],
      longTermMemory: initialState?.longTermMemory || [],
      currentGoal: initialState?.currentGoal,
    };
  }

  /**
   * Get current workspace state
   */
  getState(): WorkspaceState {
    return { ...this.state };
  }

  /**
   * Add message to conversation history
   */
  addMessage(message: AAIMessage): void {
    this.state.conversationHistory.push(message);
  }

  /**
   * Get conversation history as simple role/content pairs
   */
  getHistoryForLLM(): { role: string; content: string }[] {
    return this.state.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Add item to short term memory
   */
  addToShortTermMemory(item: string): void {
    this.state.shortTermMemory.push(item);
    if (this.state.shortTermMemory.length > MAX_SHORT_TERM_MEMORY_LIMIT) {
      this.state.shortTermMemory.shift();
    }
  }

  /**
   * Add item to long term memory
   */
  addToLongTermMemory(item: string): void {
    this.state.longTermMemory.push(item);
    if (this.state.longTermMemory.length > MAX_LONG_TERM_MEMORY_LIMIT) {
      this.state.longTermMemory.shift();
    }
  }

  /**
   * Set current goal
   */
  setGoal(goal: string): void {
    this.state.currentGoal = goal;
  }

  /**
   * Clear workspace
   */
  clear(): void {
    this.state = {
      conversationHistory: [],
      shortTermMemory: [],
      longTermMemory: [],
      currentGoal: undefined,
    };
  }
}
