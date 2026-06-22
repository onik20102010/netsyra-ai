export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const MAX_MESSAGES = 8;

export class ContextWindow {
  private messages: Message[] = [];

  addMessage(role: "user" | "assistant", content: string): void {
    const message: Message = {
      role,
      content,
      timestamp: Date.now(),
    };

    this.messages.push(message);

    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getLastMessage(): Message | null {
    return this.messages[this.messages.length - 1] || null;
  }

  clear(): void {
    this.messages = [];
  }

  getCount(): number {
    return this.messages.length;
  }
}
