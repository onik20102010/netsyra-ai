// src/app/api/ide-agent/route.ts
import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AgentMode, classifyIntentWithConfidence } from "@/lib/ide/agent-router";
import { buildSystemContext } from "@/lib/ide/context-builder";
import { executeAgent } from "@/lib/ide/agents";
import { IDE_MODEL_CHAIN, selectModelForComplexity } from "@/lib/ide/model-selector";
import { getCachedResponse, setCachedResponse } from "@/lib/ide/response-cache";
import { generateWorkspaceSummary, setWorkspaceSummary, getWorkspaceSummary } from "@/lib/ide/workspace-cache";
import { storeDecision } from "@/lib/ide/brain/project-brain";
import {
  buildAskPrompt,
  buildPlanPrompt,
  buildCodingPrompt,
  buildDebugPrompt,
  buildRefactorPrompt,
  buildReviewPrompt,
  buildProjectPrompt,
  buildTerminalPrompt,
  buildMasterSystemPrompt,
  buildMasterSwarmPrompt,
  buildBuilderPrompt,
  buildPatchPrompt,
  buildFeaturePrompt,
} from "@/lib/ide/brain/all-prompts";
import { generateEmbedding } from "@/lib/embeddings";
import { analyzeProjectWithAI } from "@/lib/ide/brain/ai-project-analyzer";
import { analyzeWorkspace } from "@/lib/ide/brain/workspace-analyzer";
import {
  buildProjectGraph,
  getProjectGraph,
  formatGraphContext,
  getRelatedFiles,
  getImpactAnalysis,
  formatImpactContext,
} from "@/lib/ide/brain/project-graph";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { messages, activeFile, fileContent, mode, projectFiles, files } = body;
  const userMessage = messages[messages.length - 1]?.content || "";

  // ── Admin bypass (unlimited usage) ─────────────
  if (user.email === "onik20102010@gmail.com") {
    // skip limits
  } else {
    const REQUEST_LIMIT = 20;
    const TOKEN_LIMIT = 15_000;

    let { data: usage } = await supabase
      .from("ide_token_usage")
      .select("requests_count, tokens_used, reset_at")
      .eq("user_id", user.id)
      .single();

    if (!usage) {
      await supabase.from("ide_token_usage").insert({
        user_id: user.id,
        requests_count: 0,
        tokens_used: 0,
        reset_at: new Date().toISOString(),
      });
      usage = { requests_count: 0, tokens_used: 0, reset_at: new Date().toISOString() };
    }

    const now = new Date();
    const resetTime = new Date(usage.reset_at);
    if (now.getTime() - resetTime.getTime() > 24 * 60 * 60 * 1000) {
      await supabase
        .from("ide_token_usage")
        .update({ requests_count: 0, tokens_used: 0, reset_at: now.toISOString() })
        .eq("user_id", user.id);
      usage.requests_count = 0;
      usage.tokens_used = 0;
    }

    if (usage.requests_count >= REQUEST_LIMIT) {
      return new Response("Daily request limit reached (20). Try again later.", { status: 429 });
    }
    if (usage.tokens_used >= TOKEN_LIMIT) {
      return new Response("Daily token limit reached (15,000). Try again later.", { status: 429 });
    }

    const requestTokens = Math.ceil(
      (JSON.stringify(messages).length + JSON.stringify(activeFile).length + (fileContent?.length || 0)) / 4
    );

    if (usage.tokens_used + requestTokens > TOKEN_LIMIT) {
      return new Response("This request would exceed your daily token limit. Try again later or use a smaller request.", { status: 429 });
    }

    await supabase
      .from("ide_token_usage")
      .update({
        requests_count: usage.requests_count + 1,
        tokens_used: usage.tokens_used + requestTokens,
      })
      .eq("user_id", user.id);
  }

  // ── Build / update project graph ─────────────────
  if (files && Object.keys(files).length > 0) {
    const existingGraph = getProjectGraph();
    if (!existingGraph || existingGraph.builtAt < Date.now() - 60000) {
      buildProjectGraph(files);
    }
  }

  // Workspace summary
  if (!getWorkspaceSummary() && files) {
    const summary = generateWorkspaceSummary(files);
    setWorkspaceSummary(summary);
  }

  // Deduplication cache
  const cacheKey = userMessage + (activeFile || "");
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return new Response(cached, {
      status: 200,
      headers: { "Content-Type": "text/plain", "x-cached": "true" },
    });
  }

  // Context building
  const context = buildSystemContext({
    activeFile,
    fileContent,
    projectFiles,
    messages,
    files,
  });

  // AI project scan
  let projectScan = "";
  if (files && Object.keys(files).length > 0) {
    try {
      projectScan = await analyzeProjectWithAI(files);
    } catch (e) {
      console.error("AI project scan failed:", e);
    }
  }

  // RAG (semantic‑aware)
  let ragContext = "";
  try {
    const queryEmbedding = await generateEmbedding(userMessage);
    if (queryEmbedding) {
      const { data: chunks, error: chunkError } = await supabase.rpc("match_ide_chunks", {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 8,
        p_user_id: user.id,
      });
      if (chunks && !chunkError) {
        ragContext = chunks
          .map((c: any) => {
            const meta = c.metadata || {};
            const label = meta.name ? `**${meta.name}** (${meta.type || "code"})` : c.path;
            return `### ${label} — \`${c.path}\`\n\`\`\`\n${c.content}\n\`\`\``;
          })
          .join("\n\n");
      }
    }
  } catch (e) {
    console.error("RAG search failed:", e);
  }

  // Graph context
  const graphContext = formatGraphContext();

  // Merge base context
  const baseFullContext = [projectScan, graphContext, context, ragContext ? "\n\n## Relevant Code Snippets\n" + ragContext : ""]
    .filter(Boolean)
    .join("\n");

  // ── Workspace analysis ───────────────────────────
  const workspace = analyzeWorkspace(files || {});

  // ── Confidence‑based classification ──────────────
  const conversationHistory = messages?.slice(-4).map((m: any) => m.content).join("\n");
  const classification = await classifyIntentWithConfidence(userMessage, conversationHistory);

  let finalMode: AgentMode;

  // Explicit build requests override everything
  if (classification.mode === "builder") {
    finalMode = "builder";
  }
  // Empty workspace -> builder
  else if (workspace.isEmpty) {
    finalMode = "builder";
  }
  // Coding intent on existing project -> patch mode
  else if (classification.mode === "coding" && !workspace.isEmpty) {
    finalMode = "patch";
  }
  // For other modes, use the classified mode unless confidence is very low
  else {
    if (classification.confidence < 0.4 && classification.mode !== "ask") {
      finalMode = "ask";
    } else {
      finalMode = classification.mode;
    }
  }

  // UI override
  if (mode === "ask" || mode === "plan" || mode === "agent") {
    finalMode = mode === "agent" ? "patch" : mode;
  }

  // ── Impact analysis for file modifications ─────────
  let impactContext = "";
  if (activeFile && ["coding", "debug", "refactor", "patch", "feature"].includes(finalMode)) {
    const impact = getImpactAnalysis(activeFile);
    impactContext = formatImpactContext(impact);
  }

  // Final context with impact
  const fullContext = baseFullContext + impactContext;

  // Build system prompt
  let systemPrompt = "";
  switch (finalMode) {
    case "builder":
      systemPrompt = buildBuilderPrompt(fullContext);
      break;
    case "patch":
      systemPrompt = buildPatchPrompt(fullContext);
      break;
    case "plan":
      systemPrompt = buildPlanPrompt(fullContext);
      break;
    case "ask":
      systemPrompt = buildAskPrompt(fullContext);
      break;
    case "debug":
      systemPrompt = buildDebugPrompt(fullContext);
      break;
    case "refactor":
      systemPrompt = buildRefactorPrompt(fullContext);
      break;
    case "terminal":
      systemPrompt = buildTerminalPrompt(fullContext);
      break;
    case "feature":
      systemPrompt = buildFeaturePrompt(fullContext);
      break;
    default:
      systemPrompt = buildAskPrompt(fullContext);
  }

  // Model selection based on confidence/complexity
  const complexity = classification.scores && classification.confidence < 0.7 ? "low" : "medium";
  const overrideModel = selectModelForComplexity(complexity);
  const chain = overrideModel ? [overrideModel] : IDE_MODEL_CHAIN;

  const stream = await executeAgent(
    {
      agentType: finalMode,
      context: fullContext,
      messages,
      mode: finalMode,
      systemPromptOverride: systemPrompt,
    },
    chain
  );

  // Store decision
  storeDecision({
    route: finalMode,
    normalized: userMessage,
    constraints: {},
    timestamp: new Date().toISOString(),
  }).catch(console.error);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}