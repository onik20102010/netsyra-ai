import { Executive } from "./core/executive";
import { Workspace } from "./core/workspace";
import { AAIRequest, AAIResponse, AAIMessage } from "./types";

/**
 * AAI Runtime: Main entry point for interacting with AAI
 */
export class AAIRuntime {
  private static instance: AAIRuntime;
  private executives: Map<string, Executive> = new Map(); // conversationId -> Executive

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AAIRuntime {
    if (!AAIRuntime.instance) {
      AAIRuntime.instance = new AAIRuntime();
    }
    return AAIRuntime.instance;
  }

  /**
   * Process a request with AAI
   */
  public async processRequest(request: AAIRequest): Promise<AAIResponse> {
    const conversationId = request.metadata?.conversationId || crypto.randomUUID();
    const userId = request.metadata?.userId || "anonymous";

    // Get or create an Executive
    let executive = this.executives.get(conversationId);
    if (!executive) {
      const existingMessages = request.conversationHistory || [];
      const workspace = new Workspace({
        conversationHistory: existingMessages.map(m => ({
          ...m,
          id: m.id || Date.now().toString(),
          timestamp: m.timestamp || Date.now(),
        })),
      });

      executive = new Executive(userId, request.modelTier, workspace, conversationId);
      this.executives.set(conversationId, executive);
    }

    // Process request
    try {
      const response = await executive.processRequest(request);
      return { ...response, conversationId };
    } catch (error) {
      console.error("AAI Runtime error:", error);
      throw error;
    }
  }

  /**
   * Clear executive for conversation
   */
  public clearConversation(conversationId: string): void {
    this.executives.delete(conversationId);
  }

  /**
   * Clear all executives
   */
  public clearAll(): void {
    this.executives.clear();
  }
}

// Export singleton instance
export const aaiRuntime = AAIRuntime.getInstance();
