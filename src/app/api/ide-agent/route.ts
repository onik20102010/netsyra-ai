import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNextGroqKey } from "@/lib/scale";

const DAILY_TOKEN_LIMIT = 10_000;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // ── Token limit check ──────────────────────────
  let { data: usage } = await supabase
    .from("ide_token_usage")
    .select("tokens_used, reset_at")
    .eq("user_id", user.id)
    .single();

  const now = new Date();

  if (!usage) {
    await supabase.from("ide_token_usage").insert({
      user_id: user.id,
      tokens_used: 0,
      reset_at: now.toISOString(),
    });
    usage = { tokens_used: 0, reset_at: now.toISOString() };
  }

  const resetTime = new Date(usage.reset_at);
  if (now.getTime() - resetTime.getTime() > 24 * 60 * 60 * 1000) {
    // Reset after 24h
    await supabase
      .from("ide_token_usage")
      .update({ tokens_used: 0, reset_at: now.toISOString() })
      .eq("user_id", user.id);
    usage.tokens_used = 0;
    usage.reset_at = now.toISOString();
  }

  if (usage.tokens_used >= DAILY_TOKEN_LIMIT) {
    const timeLeft = 24 * 60 * 60 * 1000 - (now.getTime() - resetTime.getTime());
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    return new Response(
      `Token limit reached. Resets in ${hours}h ${minutes}m.`,
      { status: 429 }
    );
  }

  const body = await req.json();
  const { messages, projectName, drive, directory, fileNames, isProjectEmpty } = body;

  // ── Build diff‑only system prompt ──────────────
  const systemPrompt = buildSystemPrompt(projectName, drive, directory, fileNames || [], isProjectEmpty);

  const trimmedMessages = (messages || []).slice(-4).map((m: any) => ({
    role: m.role,
    content: (m.content || "").slice(0, 150),
  }));

  const apiKey = getNextGroqKey();
  const model = "llama-3.3-70b-versatile"; // updated model

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...trimmedMessages],
      temperature: 0.2,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(err, { status: response.status });
  }

  // Stream back to client, and accumulate tokens for usage tracking
  const reader = response.body?.getReader();
  const encoder = new TextEncoder();
  let tokenCount = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              tokenCount += content.length; // rough token count
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
            // Check for usage info
            if (parsed.x_groq?.usage) {
              tokenCount = parsed.x_groq.usage.total_tokens;
            }
          } catch {}
        }
      }
      controller.close();

      // Update token usage in DB
      await supabase
        .from("ide_token_usage")
        .update({ tokens_used: usage.tokens_used + tokenCount })
        .eq("user_id", user.id);
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

function buildSystemPrompt(
  projectName: string,
  drive: string,
  directory: string,
  fileNames: string[],
  isProjectEmpty: boolean
): string {
  if (isProjectEmpty) {
    return `You are a helpful coding assistant. The user has an empty project "${projectName}" on ${drive}:\\${directory}.
Ask for the project path if missing. Output PowerShell commands inside @" ... "@ blocks.`;
  }

  let folderSummary = "";
  if (fileNames.length > 0) {
    const tree = buildCompactTree(fileNames);
    folderSummary = `\nFiles: ${tree}`;
  }

  return `You are a coding assistant.
Project: ${projectName}
Location: ${drive}:\\${directory}${folderSummary}

**CRITICAL OUTPUT RULES – YOU MUST FOLLOW EXACTLY:**

1. NEVER output the entire file. Only show the CHANGED LINES.
2. For every change, use this EXACT format:

**File: \`path/to/file.ext\`**
Replace lines 10-15 with:
\`\`\`
new code here
\`\`\`

3. Always include the LINE NUMBERS where the change goes.
4. If the user asks to fix something, first show the CURRENT code (with line numbers), then show the REPLACEMENT code.
5. If the user asks to add something, show the EXACT location (e.g., "After line 25, add:").
6. Do NOT output full files. Only the lines that change.
7. Use \`\`\`diff blocks when showing what changed (lines starting with + or -).
8. Provide clear, detailed explanations when needed. You may output longer responses.`;
}

function buildCompactTree(paths: string[]): string {
  const folders = new Set<string>();
  const files: string[] = [];
  for (const p of paths) {
    const parts = p.split("/");
    if (parts.length > 1) folders.add(parts[0]);
    files.push(parts.pop()!);
  }
  let result = `${files.length} files`;
  if (folders.size > 0) result += ` in ${folders.size} folder(s)`;
  if (files.length <= 10) result += `: ${files.join(", ")}`;
  else result += ` (top: ${files.slice(0, 5).join(", ")})`;
  return result;
}