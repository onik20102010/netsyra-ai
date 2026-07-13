import type { SessionSnapshot, RuntimeEvent } from "@/ide/types";
import { BaseSubsystem } from "./subsystem";

export class Session extends BaseSubsystem {
  id: string;
  workspace: string | null = null;
  user: string | null = null;
  project: string | null = null;
  runtimeId: string = "";
  openFiles: string[] = [];
  executionState: string = "idle";
  plannerState: string = "idle";
  currentTask: string | null = null;
  streamingState: string = "idle";
  currentModel: string | null = null;
  temporaryCache: Record<string, unknown> = {};

  constructor(id: string, runtimeId: string) {
    super({
      id: `session:${id}`,
      name: "Runtime Session",
      version: "1.0.0",
      capabilities: ["session"],
    });
    this.id = id;
    this.runtimeId = runtimeId;
  }

  getSnapshot(): SessionSnapshot {
    return {
      id: this.id,
      workspace: this.workspace,
      user: this.user,
      project: this.project,
      runtimeId: this.runtimeId,
      openFiles: [...this.openFiles],
      currentTask: this.currentTask,
      currentModel: this.currentModel,
      state: this.executionState,
    };
  }

  onEvent(event: RuntimeEvent): void {
    if (event.type === "ui:open-file" && typeof event.payload === "string") {
      if (!this.openFiles.includes(event.payload)) {
        this.openFiles.push(event.payload);
      }
    }
    if (event.type === "ui:close-file" && typeof event.payload === "string") {
      this.openFiles = this.openFiles.filter((f) => f !== event.payload);
    }
  }
}

export class SessionManager extends BaseSubsystem {
  private sessions = new Map<string, Session>();
  private activeSession: Session | null = null;

  constructor() {
    super({
      id: "session-manager",
      name: "Session Manager",
      version: "1.0.0",
      capabilities: ["session", "state"],
    });
  }

  async createSession(id: string, runtimeId: string): Promise<Session> {
    const session = new Session(id, runtimeId);
    this.sessions.set(id, session);
    this.activeSession = session;
    return session;
  }

  async loadSession(id: string): Promise<Session | null> {
    const session = this.sessions.get(id) ?? null;
    if (session) {
      this.activeSession = session;
    }
    return session;
  }

  getActiveSession(): Session | null {
    return this.activeSession;
  }

  getActiveSessionSnapshot(): SessionSnapshot | null {
    return this.activeSession?.getSnapshot() ?? null;
  }

  async saveSession(_id: string): Promise<void> {
    // Persist to Supabase in a later phase.
  }

  async destroySession(id: string): Promise<void> {
    this.sessions.delete(id);
    if (this.activeSession?.id === id) {
      this.activeSession = null;
    }
  }

  async initialize(config?: Record<string, unknown>): Promise<void> {
    await super.initialize(config);
    const runtimeId = (config?.runtimeId as string) ?? "";
    const sessionId = (config?.sessionId as string) ?? `${Date.now()}`;
    await this.createSession(sessionId, runtimeId);
  }

  getDiagnostics(): Record<string, unknown> {
    return {
      activeSession: this.activeSession?.id ?? null,
      totalSessions: this.sessions.size,
    };
  }
}
