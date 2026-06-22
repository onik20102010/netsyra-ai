// Central type exports for the Netsyra application

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  model?: string;
}

export interface FileNode {
  path: string;
  name: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
}

export interface IDEState {
  files: Record<string, string>;
  activeFile: string | null;
  openFiles: string[];
  dirtyFiles: Set<string>;
}

export interface AgentStep {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  output?: string;
}
