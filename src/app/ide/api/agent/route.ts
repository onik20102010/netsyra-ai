// src/app/ide/api/agent/route.ts
// Agent endpoint: turns a user message + workspace context into an SSE stream
// of code-generation events and a final result with generated file changes.

import { NextRequest } from "next/server";
import { CodeGeneratorEngine, GenerationType } from "@/ide/execution/code-generator";
import type { CodeGenerationRequest, CodeGenerationStreamEvent, CodeGenerationResult } from "@/ide/execution/code-generator/types";
import type { ContextAssemblyResult, ContextItem, ContextSource, ContextValidationResult } from "@/ide/intelligence/context-engine";
import type { Task } from "@/ide/intelligence/planning-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AgentRequestBody {
  message: string;
  openFiles?: { path: string; content: string }[];
  activeFile?: string | null;
  workspaceTree?: string;
  generationType?: string;
  targetFiles?: string[];
  language?: string;
  framework?: string;
}

function inferGenerationType(message: string): GenerationType {
  const lower = message.toLowerCase();
  if (lower.includes("create") || lower.includes("new file") || lower.includes("add a file") || lower.includes("make a")) return "create_file";
  if (lower.includes("fix") || lower.includes("bug") || lower.includes("error") || lower.includes("resolve")) return "fix_bug";
  if (lower.includes("refactor")) return "refactor";
  if (lower.includes("optimize")) return "optimize";
  if (lower.includes("test") || lower.includes("spec")) return "generate_tests";
  if (lower.includes("explain")) return "explain";
  if (lower.includes("review")) return "review";
  if (lower.includes("api") || lower.includes("endpoint")) return "generate_api";
  if (lower.includes("ui") || lower.includes("component")) return "generate_ui";
  return "edit_file";
}

function buildContextItem(file: { path: string; content: string }): ContextItem {
  return {
    id: `${Date.now()}-${file.path}`,
    type: "file",
    name: file.path,
    content: file.content,
    relevanceScore: 1,
    tokenCount: Math.ceil(file.content.length / 4),
    summaryTokenCount: 0,
    source: "user",
    cached: false,
    compressed: false,
    lastUpdated: Date.now(),
  };
}

function buildContext(files: { path: string; content: string }[], objective: string, workspaceTree?: string): ContextAssemblyResult {
  const relevantFiles = files.map(buildContextItem);
  const totalTokens = relevantFiles.reduce((sum, f) => sum + f.tokenCount, 0);
  const validation: ContextValidationResult = {
    valid: true,
    duplicateFiles: [],
    duplicateSummaries: [],
    missingDependencies: [],
    brokenReferences: [],
    unnecessaryFiles: [],
    staleCache: [],
    outdatedSummaries: [],
    errors: [],
    warnings: [],
  };
  const sources: ContextSource[] = [
    { id: "user-open-files", type: "file", priority: 1, isReady: true },
  ];
  return {
    contextId: crypto.randomUUID(),
    version: 1,
    timestamp: Date.now(),
    currentObjective: objective,
    relevantFiles,
    relevantSymbols: [],
    relevantComponents: [],
    relevantApis: [],
    relevantRoutes: [],
    relevantDatabaseModels: [],
    relevantConfigurations: [],
    knowledgeGraphNodes: [],
    memorySummaries: [],
    architectureSummary: undefined,
    workspaceSummary: workspaceTree,
    recentChanges: [],
    diagnostics: [],
    verificationNotes: [],
    allItems: relevantFiles,
    tokenCount: totalTokens,
    originalTokenCount: totalTokens,
    compressionRatio: 0,
    cacheHitRate: 0,
    relevanceScore: 1,
    contextVersion: 1,
    validation,
    sources,
    assembledFor: "code_generation",
  };
}

function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

class RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  }
}

const rateLimiter = new RateLimiter();

async function authGuard(req: NextRequest): Promise<{ userId: string | null; response: Response | null }> {
  if (process.env.REQUIRE_AUTH !== "true") {
    return { userId: null, response: null };
  }
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      return { userId: null, response: new Response("Unauthorized", { status: 401 }) };
    }
    return { userId: data.session.user.id, response: null };
  } catch {
    return { userId: null, response: new Response("Auth unavailable", { status: 503 }) };
  }
}

function validateAgentConfig(): Response | null {
  if (!process.env.GROQ_API_KEY_2 && !process.env.MESH_API_KEY) {
    return new Response("AI provider not configured", { status: 503 });
  }
  return null;
}

function logTelemetry(payload: Record<string, unknown>): void {
  if (process.env.DISABLE_TELEMETRY === "true") return;
  console.log(`[agent:telemetry] ${JSON.stringify(payload)}`);
}

function buildTask(message: string, generationType: GenerationType): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: message.slice(0, 50),
    description: message,
    category: generationType as unknown as Task["category"],
    priority: "high",
    complexity: "medium",
    estimatedDuration: "1m",
    estimatedTokens: 2000,
    dependencies: [],
    requiredContext: {
      files: [],
      folders: [],
      components: [],
      apis: [],
      modules: [],
      symbols: [],
      reason: "User provided open files and workspace context",
    },
    expectedOutput: "Working code changes or explanation",
    possibleRisks: [],
    verification: [],
    rollbackStrategy: "Revert the modified files",
    completionCriteria: ["Changes are syntactically valid", "Changes address the user request"],
    status: "pending",
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: 500,
      retryableErrors: ["timeout"],
    },
    canParallelize: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: AgentRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!body.message || typeof body.message !== "string") {
    return new Response("Missing message", { status: 400 });
  }

  const auth = await authGuard(req);
  if (auth.response) return auth.response;

  const configError = validateAgentConfig();
  if (configError) return configError;

  const clientId = auth.userId ?? getClientId(req);
  const quotaLimit = auth.userId ? 100 : Number(process.env.AGENT_QUOTA_PER_HOUR) || 30;
  const windowMs = 60 * 60 * 1000;
  if (!rateLimiter.check(clientId, quotaLimit, windowMs)) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  const message = body.message;
  const generationType = inferGenerationType(message);
  const openFiles = body.openFiles || [];
  const targetFiles = body.targetFiles || (body.activeFile ? [body.activeFile] : openFiles.map((f) => f.path));
  const language = body.language || "typescript";
  const framework = body.framework || "next";

  const task = buildTask(message, generationType);
  const context = buildContext(openFiles, message, body.workspaceTree);

  const requestId = crypto.randomUUID();
  const request: CodeGenerationRequest = {
    id: requestId,
    taskId: task.id,
    generationType,
    task,
    context,
    userMessage: message,
    targetFiles,
    language,
    framework,
    complexity: "medium",
    subscription: "free",
    streaming: true,
  };

  const startTime = Date.now();
  let errorMessage: string | null = null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const onStreamEvent = (event: CodeGenerationStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch (err) {
          console.error("[Agent] Failed to enqueue stream event:", err);
        }
      };

      const engine = new CodeGeneratorEngine();
      const reqWithCallback: CodeGenerationRequest = { ...request, onStreamEvent };

      onStreamEvent({
        id: requestId,
        requestId,
        type: "analyzing_request",
        stage: "analyzing_request",
        payload: { messageLength: message.length, generationType },
        timestamp: Date.now(),
      });

      onStreamEvent({
        id: requestId,
        requestId,
        type: "context_collected",
        stage: "context_collected",
        payload: { fileCount: context.relevantFiles.length, tokenCount: context.tokenCount, files: context.relevantFiles.map((f) => f.name) },
        timestamp: Date.now(),
      });

      onStreamEvent({
        id: requestId,
        requestId,
        type: "planning",
        stage: "planning",
        payload: { targetFiles },
        timestamp: Date.now(),
      });

      engine
        .generate(reqWithCallback)
        .then((result: CodeGenerationResult) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", result })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            console.error("[Agent] Failed to close stream:", err);
          }
        })
        .catch((error) => {
          errorMessage = error instanceof Error ? error.message : String(error);
          console.error("[Agent] Generation error:", errorMessage);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`));
            controller.close();
          } catch {
            /* ignore */
          }
        })
        .finally(() => {
          logTelemetry({
            requestId,
            clientId,
            userId: auth.userId,
            generationType,
            messageLength: message.length,
            fileCount: openFiles.length,
            durationMs: Date.now() - startTime,
            error: errorMessage,
          });
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
