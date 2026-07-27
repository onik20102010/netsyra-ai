// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createChatServerClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { aaiRuntime } from "@/lib/chat/aai";
import { tiers } from "@/lib/chat/model-registry";
import { classifyIntent } from "@/lib/intent-classifier";
import { getWeatherData, getCurrentTimeAndLocation } from "@/lib/time-utils";
import { getCurrentTimeCard, getCurrentCalendarCard, fetchTimeData } from "@/lib/chat/services/real-time";
import { performDeepSearch, performMultiDeepSearch, performNLiveSearch, performTavilySearch, performWikipediaSearch, performSerperSearch } from "@/lib/chat/services/live-data";
import { canUseModel, getAllowedTiers } from "@/lib/plan-access";
import { getRouterConfig } from "@/lib/routers/router-factory";
import { checkTokenLimits, incrementTokenUsage } from "@/lib/chat/token-usage";
import { selectAvailablePlusProModel } from "@/lib/chat/model-selector-fallback";
import FirecrawlApp from "@mendable/firecrawl-js";
import { cleanSearchQueries } from "@/lib/chat/services/query-cleaner";
import { planSearch, type SearchPlan } from "@/lib/chat/services/search-planner";
import { safeFetch } from "@/lib/safe-fetch";
import { checkAndUpdateUsage, MODEL_LIMITS } from "@/lib/chat/usage";
import { getUserMemorySummary, generateMemorySummary } from "@/lib/chat/memory";
import { buildMessageContext, generateConversationSummary } from "@/lib/chat/conversation-summary";
import { getUserSummary, generateUserSummary, shouldUseUserSummary } from "@/lib/chat/user-summary";
import { getProUserSummary, generateProUserSummary, shouldUseProUserSummary } from "@/lib/chat/pro-user-summary";
import { buildProMessageContext, updateProConversationSummary, getProConversationSummary } from "@/lib/chat/pro-conversation-summary";
import { routeModel } from "@/lib/chat/router";
// ── New unified systems ──
// import { unifiedClassify, quickClassify } from "@/lib/chat/unified-classifier";
import { checkCache, storeInCache } from "@/lib/chat/semantic-cache";
// import { queueMessage, shouldProcessQueue, processQueue, getDynamicWindowSize, detectQueryComplexity, detectTopicSwitch } from "@/lib/chat/unified-memory";
import { getSystemPrompt } from "@/lib/chat/model-registry";
// import { countTokensSync, calculateTokenBudget, selectEfficientModel } from "@/lib/chat/token-counter";
import { AVAILABLE_TOOLS } from "@/lib/chat/tools/web-search";
import { executeWebSearch } from "@/lib/chat/tools/execute-web-search";
import { compressHistory } from "@/lib/chat/context-compression";
import { getCachedReply, setCachedReply } from "@/lib/scale";
import { verifyAnswer } from "@/lib/verifier";
import { analyzeTask, routeTask, estimateClaudeCredits, getRoutingExplanation, checkAndDeductTokens, checkAllLimitsExhausted, getTotalNiRemaining, estimateTokensNeeded, checkGPT5LimitsExhausted, getTotalGPT5Remaining } from "@/lib/chat/ni-router";

// ── DB helpers ──────────────────────────────
async function createConversation(supabase: any, userId: string, id: string, title?: string) {
  console.log(`Creating conversation: id=${id}, userId=${userId}, title=${title}`);
  const { error } = await supabase.from("conversations").insert({
    id,
    user_id: userId,
    title: title?.slice(0, 100) || "New conversation",
  });
  if (error) {
    console.error("Failed to create conversation:", error);
    throw new Error(`Failed to create conversation: ${error.message}`);
  }
  console.log(`Conversation created successfully: ${id}`);
}

async function saveMessage(supabase: any, userId: string, conversationId: string, role: string, content: string) {
  console.log(`Saving message: conversationId=${conversationId}, userId=${userId}, role=${role}`);
  
  // Verify conversation exists, create if not (handles race conditions / RLS timing on Vercel)
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  
  if (!conv) {
    console.log(`Conversation ${conversationId} not found, creating it now...`);
    const { error: createError } = await supabase.from("conversations").insert({
      id: conversationId,
      user_id: userId,
      title: content?.slice(0, 100) || "New conversation",
    });
    if (createError) {
      console.error("Failed to auto-create conversation:", createError);
      throw new Error(`Failed to create conversation: ${createError.message}`);
    }
    console.log(`Conversation ${conversationId} auto-created in saveMessage`);
  }
  
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
  });
  if (error) {
    console.error("Failed to save message:", error);
    throw new Error(`Failed to save message: ${error.message}`);
  }
  console.log(`Message saved successfully`);
}

async function getUserTotalMessageCount(supabase: any, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return error ? 0 : (count || 0);
}

// ── Tool execution helpers ──────────────────────────────
async function executeToolCall(toolCall: any): Promise<string> {
  const { name, arguments: args } = toolCall;
  
  switch (name) {
    case "web_search":
      return await executeWebSearch(args);
    default:
      return `Unknown tool: ${name}`;
  }
}

function hasToolCalls(response: any): boolean {
  if (response.choices && response.choices[0]?.message?.tool_calls) {
    return response.choices[0].message.tool_calls.length > 0;
  }
  return false;
}

function extractToolCalls(response: any): any[] {
  return response.choices?.[0]?.message?.tool_calls || [];
}

// ── Updated scrapePage with Firecrawl → direct fetch → Groq scraper fallback ──
async function scrapePage(url: string): Promise<string> {
  // 1. Try Firecrawl
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (apiKey) {
    try {
      const fc = new FirecrawlApp({ apiKey });
      const doc = await fc.scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 12000,
      });
      const md = (doc as any).markdown || "";
      if (md.trim().length > 200) return md.slice(0, 5000);
    } catch {
      console.log("⚡ Firecrawl failed, trying direct fetch...");
    }
  }

  // 2. Fallback: direct fetch with browser‑like headers
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await safeFetch(url, 5, controller.signal);
    clearTimeout(timeout);
    if (!res.ok) return "";
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
    return text;
  } catch {
    // 3. Final fallback: Groq‑based scraper
    console.log("⚡ Direct fetch failed, trying Groq scraper...");
    const { groqScrape } = await import("@/lib/chat/services/groq-scraper");
    return await groqScrape(url);
  }
}

// ── Dynamic Rich Content Engine ──────────────────────────────
const DYNAMIC_RICH_CONTENT_ENGINE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DYNAMIC RICH CONTENT ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the user asks for a plan, guide, tutorial, learning path, or any multi‑step
process that spans days/weeks/steps, automatically apply the following rules.
Do NOT wait for the user to request "detail" – provide it proactively.

1. STRUCTURE EVERY DAY / STEP
   - Use a table with columns: Day/Step, Topic, Detailed Activities, Resources, Time.
   - Each row must contain specific actions (e.g., "Read Chapter 2 and build the login form"),
     not vague instructions (e.g., "Study HTML forms").
   - Include real, searchable resource titles (e.g., "MDN Web Docs: HTML Forms").
   - Add a ⏱️ Time column with realistic estimates.

2. VISUAL BREAKDOWN
   - Add a progress tracker using text-based bars:
     \`\`\`
     Week 1  [████░░░░] Foundation
     Week 2  [██████░░] Core Skills
     \`\`\`
   - Mark milestone achievements with 🎯 (e.g., "🎯 Day 10 – Build your first responsive page").
   - Use emojis (📋, ⚠️, ✅, 💡, 📅, 🚀) as visual anchors, but never more than one per paragraph.

3. AVOID BOOK‑LIKE TEXT
   - Never output a plain paragraph when a table, list, or code block would be clearer.
   - Use blockquotes (>) for key takeaways or important notes.
   - Use --- dividers to separate major phases (Foundation, Intermediate, Advanced).
   - Keep paragraphs short (max 3 sentences). Prefer bullet points.

4. MAKE IT ACTIONABLE
   - Every day/step must end with a concrete deliverable (e.g., "✅ Done: A working contact form").
   - Include a final checklist so the user can verify their progress.

5. ADAPT TO THE REQUEST’S SCALE
   - For short tasks (≤5 steps), use a numbered list with bold actions.
   - For medium tasks (6–20 steps), use a detailed table as described.
   - For long plans (>20 days), split into phases with separate tables for each phase.

This engine activates automatically for any request that involves:
- multi‑day/week plans
- learning paths
- step‑by‑step tutorials
- project roadmaps
- habit‑building schedules
- any query where the user expects a structured, long‑form guide.

FORMATTING RULES FOR RICH CONTENT:
- Use bullet points (•) for feature lists and option summaries within each day/step.
- Use numbered lists for sequential actions within each step.
- Use bold for key terms, deliverables, and milestone names.
- Use blockquotes (>) for key takeaways or important tips per section.
- Use horizontal rules (---) to separate major phases (Foundation, Intermediate, Advanced).
- Use headings (##) for phase titles, (###) for day/step titles.
- Use tables for comparing options, resources, or schedules within a phase.
- Use italic for new terminology or foreign words introduced in the guide.
- Use emojis (📋, ⚠️, ✅, 💡, 📅, 🚀) as visual anchors — max 1 per paragraph, 3–8 total.
- Keep paragraphs short (2–4 sentences). Prefer bullets over prose.
- End each phase with a brief summary or checklist.
- Match response length to the scope: short tasks (≤5 steps) stay concise, long plans (>20 days) split into phases.
`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Detect user timezone from request headers
    const userTimezone = req.headers.get('x-user-timezone') || 
                        req.headers.get('timezone') || 
                        Intl.DateTimeFormat().resolvedOptions().timeZone;

    const body = await req.json();
    const {
      messages,
      modelTier: requestedTier = "fast",
      conversationId,
      newConversation,
      diveDeep,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });
    }

    for (const msg of messages) {
      const lines = (msg.content || "").split("\n");
      if (lines.length > 80) {
        return NextResponse.json(
          { error: "Message exceeds 80 lines. Please shorten it." },
          { status: 400 }
        );
      }
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;
    const convId = conversationId || crypto.randomUUID();

    // ── Auto-router: resolve "auto" to a concrete tier (manual tiers pass through) ──
    let modelTier: string = requestedTier;
    if (requestedTier === "auto") {
      const routed = routeModel(userMessage, { historyLength: messages.length });
      modelTier = routed.tier;
      console.log(`🧭 Auto-router: "${userMessage.slice(0, 60)}" → N ${modelTier} (${routed.reason})`);

      // Low-confidence fallback: use tiny model to re-classify on ambiguous cases
      if (routed.confidence && routed.confidence < 0.6) {
        console.log(`⚠️ Low router confidence (${routed.confidence}), using tiny-model fallback`);
        try {
          const lastTwoMessages = messages.slice(-2).map((m: any) => `${m.role}: ${m.content}`).join("\n");
          const fallbackPrompt = `You are a tier classifier. Given this conversation context, classify the last user message into one of: fast, plus, pro, code, aai. Return ONLY the tier name.\n\nConversation:\n${lastTwoMessages}\n\nTier:`;
          
          const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [{ role: "user", content: fallbackPrompt }],
              temperature: 0.1,
              max_tokens: 10,
            }),
          });

          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const fallbackTier = fallbackData.choices?.[0]?.message?.content?.trim().toLowerCase();
            if (fallbackTier && ["fast", "plus", "pro", "code", "aai"].includes(fallbackTier)) {
              console.log(`🔄 Tiny-model override: ${modelTier} → ${fallbackTier}`);
              modelTier = fallbackTier;
            }
          }
        } catch (err) {
          console.warn("Tiny-model fallback failed, using original tier:", err);
        }
      }
    }

    // N Live activation conditions
    const isGreeting = /^(hi|hello|hey|sup|yo|ok|okay|thanks|thank you|bye|goodbye)[\s!.]*$/i.test(userMessage.trim());
    const shouldUseNLive = diveDeep && !isGreeting;

    // Detect if query needs web search (latest/current information)
    function needsWebSearch(query: string): boolean {
      const lowerQuery = query.toLowerCase();

      // 0. Time/weather/date queries - use API, not web search
      const timeWeatherDateKeywords = [
        'what\'s the time', 'what is the time', 'current time', 'what time', 'time now',
        'what\'s the date', 'what is the date', 'today\'s date', 'current date', 'what date',
        'what\'s the weather', 'what is the weather', 'weather in', 'temperature in',
        'forecast', 'clock', 'what is it time', 'what time is it', 'tell me the time',
        'show me the time', 'tell me the date', 'show me the date', 'what day is it',
        'what day today', 'what\'s today', 'what is today', 'current weather',
        'weather today', 'temperature today', 'weather forecast', 'time in', 'date in',
      ];
      if (timeWeatherDateKeywords.some(kw => lowerQuery.includes(kw))) {
        return false;
      }

      // 1. Current Information (time-sensitive data)
      const currentInfoKeywords = [
        'latest', 'new', 'recent', 'current', 'today', 'now', 'yesterday', 'tomorrow',
        'news', 'breaking', 'headline', 'trending', 'viral', 'announcement',
        'stock prices', 'crypto prices', 'exchange rates', 'market value',
        'sports scores', 'live standings', 'rankings', 'election results',
        'current president', 'current prime minister', 'current ceo', 'current statistics', 'current population',
      ];
      
      // 2. Recent Events
      const recentEventsKeywords = [
        'this morning', 'this afternoon', 'tonight', 'this week', 'last week', 'this month',
        'just announced', 'just released', 'new update', 'new feature', 'new version',
        'what happened today', 'what changed', 'what\'s new',
      ];
      
      // 3. Live Data
      const liveDataKeywords = [
        'flight status', 'train status', 'bus status', 'live traffic', 'road closures',
        'internet outage', 'server status', 'website status', 'api status', 'cloud service status',
        'electricity outage', 'gas prices', 'fuel prices', 'live rankings', 'live leaderboard',
        'live score', 'shipping tracking', 'delivery tracking',
      ];
      
      // 4. Product Research
      const productResearchKeywords = [
        'best laptop', 'best gaming pc', 'best smartphone', 'best monitor', 'best keyboard', 'best mouse',
        'compare products', 'vs', 'versus', 'iphone vs samsung', 'macbook vs windows',
        'reviews', 'ratings', 'customer opinions', 'specifications', 'benchmarks',
        'battery life', 'price comparison', 'discounts', 'deals', 'availability', 'where to buy',
      ];
      
      // 5. Company Information
      const companyInfoKeywords = [
        'company pricing', 'subscription plans', 'api pricing', 'company features', 'latest features',
        'roadmap', 'careers', 'hiring', 'founders', 'ceo', 'investors', 'funding', 'acquisitions',
        'official website', 'support page', 'documentation', 'security policy', 'privacy policy',
      ];
      
      // 6. Official Documentation
      const docsKeywords = [
        'react docs', 'next.js docs', 'vue docs', 'angular docs', 'openai docs', 'anthropic docs',
        'gemini docs', 'supabase docs', 'firebase docs', 'aws docs', 'azure docs', 'cloudflare docs',
        'python docs', 'java docs', 'c# docs', 'rust docs', 'docker docs', 'kubernetes docs',
        'linux documentation', 'official docs', 'documentation',
      ];
      
      // 7. Programming Error Lookup
      const errorKeywords = [
        'stack trace', 'build error', 'compiler error', 'runtime error', 'package issue',
        'npm error', 'pnpm error', 'yarn error', 'pip error', 'dependency conflict',
        'api changed', 'deprecated feature', 'framework bug', 'github issue', 'known bug',
        'error code lookup', 'unexpected behavior', 'fix error', 'solve error',
      ];
      
      // 8. Package & Library Information
      const packageKeywords = [
        'npm package', 'pypi package', 'cargo crate', 'nuget package', 'maven package', 'gradle dependency',
        'github repository', 'gitlab project', 'latest release', 'release notes', 'changelog',
        'latest version', 'download link', 'installation guide', 'compatibility', 'maintenance status',
      ];
      
      // 9. Location-Based Requests
      const locationKeywords = [
        'near me', 'around me', 'closest', 'nearest', 'restaurants', 'hotels', 'hospitals',
        'pharmacies', 'coffee shops', 'shopping malls', 'grocery stores', 'banks', 'atms',
        'gas stations', 'schools', 'universities', 'gyms', 'parks', 'museums', 'tourist attractions',
        'opening hours', 'directions', 'nearby services',
      ];
      
      // 10. Academic Research
      const academicKeywords = [
        'research papers', 'journal articles', 'ieee', 'acm', 'nature', 'science', 'pubmed',
        'arxiv', 'google scholar', 'systematic review', 'meta-analysis', 'latest research',
        'conference papers', 'citations', 'academic references',
      ];
      
      // 11. Legal & Government Information
      const legalKeywords = [
        'visa rules', 'immigration', 'passport requirements', 'customs regulations', 'tax laws',
        'labor laws', 'employment law', 'copyright law', 'privacy law', 'gdpr',
        'government forms', 'official regulations', 'legal requirements', 'licensing', 'permits', 'court decisions',
      ];
      
      // 12. Medical & Health Information
      const medicalKeywords = [
        'symptoms', 'disease', 'treatment', 'medications', 'side effects', 'dosage',
        'drug recalls', 'vaccine guidance', 'cdc recommendations', 'who recommendations',
        'fda announcements', 'public health alerts', 'medical research', 'clinical trials',
      ];
      
      // 13. Financial Information
      const financialKeywords = [
        'stock market', 'company earnings', 'quarterly reports', 'annual reports', 'inflation',
        'interest rates', 'exchange rates', 'investment performance', 'cryptocurrency',
        'gold price', 'silver price', 'oil prices', 'market analysis', 'financial news',
      ];
      
      // 14. Entertainment
      const entertainmentKeywords = [
        'movie release date', 'tv show schedule', 'streaming platforms', 'netflix', 'disney+',
        'spotify', 'music release', 'celebrity news', 'actor information', 'game release',
        'esports tournaments', 'awards', 'trailers',
      ];
      
      // 15. Tutorials & Learning Resources
      const tutorialKeywords = [
        'official tutorial', 'getting started', 'beginner guide', 'advanced guide',
        'examples', 'sample project', 'walkthrough', 'best practices', 'learning resources',
        'certification guide', 'video tutorial', 'how to', 'learn',
      ];
      
      // 16. User Explicitly Requests Web Search
      const explicitSearchKeywords = [
        'search the web', 'search online', 'browse the internet', 'browse the web',
        'use the internet', 'look it up', 'google it', 'bing it', 'find online',
        'check online', 'verify online', 'search for me',
      ];
      
      // 17. Verification Required
      const verificationKeywords = [
        'verify this', 'fact check', 'confirm this', 'validate this', 'is this true',
        'check this claim', 'confirm the source', 'verify the statistics', 'authenticate information',
      ];
      
      // 18. Downloads & Resources
      const downloadKeywords = [
        'download software', 'official installer', 'latest iso', 'latest apk', 'latest release',
        'drivers', 'firmware', 'manuals', 'pdf', 'templates', 'datasets',
      ];
      
      // 19. Images, Videos & Media
      const mediaKeywords = [
        'images', 'photos', 'wallpapers', 'diagrams', 'screenshots', 'videos',
        'youtube tutorial', 'livestream', 'infographics', 'illustrations',
      ];
      
      // 20. Comparisons
      const comparisonKeywords = [
        'compare', 'versus', 'vs', 'difference between', 'pros and cons', 'which is better',
        'alternatives', 'replacement', 'competitor comparison', 'benchmark comparison',
      ];
      
      // 21. Reviews & Community Opinions
      const reviewKeywords = [
        'reddit opinions', 'user reviews', 'customer reviews', 'community feedback',
        'experiences', 'testimonials', 'ratings', 'discussions', 'recommendations',
      ];
      
      // 22. Events & Conferences
      const eventKeywords = [
        'conference', 'event schedule', 'keynote', 'meetup', 'webinar', 'workshop',
        'hackathon', 'seminar', 'summit', 'registration',
      ];
      
      // 23. Security & Vulnerabilities
      const securityKeywords = [
        'cve', 'security advisory', 'vulnerability', 'exploit', 'malware', 'ransomware',
        'security update', 'patch', 'zero-day', 'threat intelligence',
      ];
      
      // 24. APIs & Services
      const apiKeywords = [
        'api documentation', 'api pricing', 'api limits', 'authentication', 'sdk',
        'webhook', 'endpoint', 'rate limits', 'service status', 'integration guide',
      ];
      
      // Combine all keyword arrays
      const allKeywords = [
        ...currentInfoKeywords, ...recentEventsKeywords, ...liveDataKeywords,
        ...productResearchKeywords, ...companyInfoKeywords, ...docsKeywords,
        ...errorKeywords, ...packageKeywords, ...locationKeywords,
        ...academicKeywords, ...legalKeywords, ...medicalKeywords,
        ...financialKeywords, ...entertainmentKeywords, ...tutorialKeywords,
        ...explicitSearchKeywords, ...verificationKeywords, ...downloadKeywords,
        ...mediaKeywords, ...comparisonKeywords, ...reviewKeywords,
        ...eventKeywords, ...securityKeywords, ...apiKeywords,
      ];
      
      // Check for any keyword match
      if (allKeywords.some(keyword => lowerQuery.includes(keyword))) {
        return true;
      }
      
      // Check for specific patterns
      const patterns = [
        /\d{4}/, // Years (2024, 2025, etc.)
        /\$\d+/, // Prices
        /how many/i,
        /how much/i,
        /where to buy/i,
        /is it safe/i,
        /is it legit/i,
        /scam/i,
        /easygetstore/i, // Specific example from user
        /\.gov/i, // Government websites
        /\.edu/i, // Educational websites
        /\.org/i, // Organization websites
      ];
      
      if (patterns.some(pattern => pattern.test(query))) {
        return true;
      }
      
      return false;
    }

    // Query needs current information — use intelligent search planner
    // First check obvious keywords (fast path), then AI planner for entity understanding
    const keywordSearchNeeded = needsWebSearch(userMessage);
    let searchPlan: SearchPlan = { shouldSearch: keywordSearchNeeded, searchQuery: userMessage, reason: "Keyword match" };
    
    if (!keywordSearchNeeded) {
      // No obvious keyword match — use AI planner for entity-based queries
      searchPlan = await planSearch(userMessage);
    }

    const needsSearch = searchPlan.shouldSearch;
    const enrichedQuery = searchPlan.searchQuery || userMessage;
    
    // Clean the query using multi‑query extraction for N Live
    const queries = needsSearch ? await cleanSearchQueries(enrichedQuery) : [userMessage];
    if (needsSearch && queries.length > 0) {
      console.log(`🔍 Search plan: "${userMessage.slice(0, 50)}" → search=${needsSearch}, reason=${searchPlan.reason}`);
      console.log(`🧹 Cleaned queries: "${enrichedQuery.slice(0, 50)}" → [${queries.join(", ")}]`);
    }

    const shouldSearch = needsSearch;

    // ── Check if user has active subscription ──
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const isPaidUser = !!sub;
    const userPlan = sub?.plan || "free";
    const routerConfig = getRouterConfig(userPlan);

    // ── For Plus Pro, select model based on complexity and token availability ──
    let selectedModelKey = modelTier;
    if (userPlan === 'plus_pro' && routerConfig.perModelTokenLimits) {
      console.log(`🎯 Using Plus Pro model selection fallback logic`);
      try {
        const modelSelection = await selectAvailablePlusProModel(
          supabase,
          user.id,
          userMessage,
          modelTier,
          routerConfig.perModelTokenLimits
        );
        selectedModelKey = modelSelection.modelKey;
        console.log(`🎯 Selected model: ${selectedModelKey}, Reason: ${modelSelection.reason}`);
      } catch (error) {
        console.error(`🔴 Model selection failed, using default:`, error);
        selectedModelKey = 'plus_pro_deepseek'; // Fallback to DeepSeek
      }
    }

    // ── Check if user's plan allows the requested model tier ──
    if (!routerConfig.allowedModelKeys.includes(modelTier)) {
      return NextResponse.json(
        { error: `The ${modelTier} tier is not available on your plan. Upgrade to access it.` },
        { status: 403 }
      );
    }

    // ── Intent classification ─────────────────
    const intent = await classifyIntent(userMessage);

    // ── Time/Weather/Date Query Detection (independent of search decision) ──
    const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
    const isTimeQuery = /^(what( i|')?s the )?time|clock|what is it time/i.test(userMessage.trim());
    const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());
    const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

    // ── USAGE CHECK (CRITICAL - this must work) ──
    console.log(`🔴 CRITICAL: About to check usage for user ${user.id}, tier ${modelTier}`);

    // Check token limits for all plans
    let tokenCheck;
    try {
      // For Plus Pro, check per-model token limits
      if (userPlan === 'plus_pro' && routerConfig.perModelTokenLimits && selectedModelKey) {
        const modelLimits = routerConfig.perModelTokenLimits[selectedModelKey];
        if (modelLimits) {
          tokenCheck = await checkTokenLimits(
            supabase,
            user.id,
            modelTier,
            modelLimits.daily,
            modelLimits.monthly,
            selectedModelKey
          );
        } else {
          // Fallback to tier-level limits if model not found
          tokenCheck = await checkTokenLimits(
            supabase,
            user.id,
            modelTier,
            routerConfig.dailyTokenLimit,
            routerConfig.monthlyTokenLimit
          );
        }
      } else {
        // For all other plans, use tier-level token limits
        tokenCheck = await checkTokenLimits(
          supabase,
          user.id,
          modelTier,
          routerConfig.dailyTokenLimit,
          routerConfig.monthlyTokenLimit
        );
      }
      console.log(`🟢 Token check result:`, tokenCheck);
    } catch (error) {
      console.error(`🔴 TOKEN CHECK FAILED:`, error);
      return NextResponse.json(
        { error: "Token usage tracking failed. Please try again." },
        { status: 500 }
      );
    }

    // Block if token limit is reached
    if (!tokenCheck || !tokenCheck.allowed) {
      const dailyResetTime = new Date(tokenCheck?.dailyResetAt || new Date(Date.now() + 24 * 60 * 60 * 1000));
      const monthlyResetTime = new Date(tokenCheck?.monthlyResetAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      const dailyTimeLeftMs = dailyResetTime.getTime() - Date.now();
      const monthlyTimeLeftMs = monthlyResetTime.getTime() - Date.now();

      const dailyHours = Math.floor(dailyTimeLeftMs / (1000 * 60 * 60));
      const dailyMinutes = Math.floor((dailyTimeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      const monthlyDays = Math.floor(monthlyTimeLeftMs / (1000 * 60 * 60 * 24));

      console.log(`🚫🚫🚫 TOKEN LIMIT BLOCKED for user ${user.id}, tier ${modelTier}. Token check:`, tokenCheck);

      return NextResponse.json(
        {
          error: `You've used all your tokens. Daily limit resets in ${dailyHours}h ${dailyMinutes}m. Monthly limit resets in ${monthlyDays} days.`,
          remaining: 0,
          dailyResetAt: tokenCheck?.dailyResetAt,
          monthlyResetAt: tokenCheck?.monthlyResetAt,
          tier: modelTier,
          dailyLimit: routerConfig.dailyTokenLimit,
          monthlyLimit: routerConfig.monthlyTokenLimit
        },
        { status: 429 }
      );
    }

    console.log(`✅ Token check PASSED. Daily tokens remaining: ${tokenCheck.dailyRemaining}, Monthly tokens remaining: ${tokenCheck.monthlyRemaining}`);

    // ── Ensure conversation exists BEFORE cache check (so cache hits work on new conversations) ──
    if (newConversation || !conversationId) {
      console.log(`Creating conversation: newConversation=${newConversation}, conversationId=${conversationId}, convId=${convId}`);
      await createConversation(supabase, user.id, convId, userMessage);
      console.log(`Conversation creation completed for ${convId}`);
    }

    // ── Cache check: deterministic + semantic ──
    if (!diveDeep && !isWidgetQuery && modelTier !== "aai" && modelTier !== "live") {
      const cached = await checkCache(userMessage);
      if (cached) {
        console.log(`💾 Cache hit (${cached.source}): "${userMessage.slice(0, 50)}..."`);
        await saveMessage(supabase, user.id, convId, "user", userMessage);
        await saveMessage(supabase, user.id, convId, "assistant", cached.response);
        const encoder = new TextEncoder();
        const words = cached.response.split(" ");
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
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
    }

    await saveMessage(supabase, user.id, convId, "user", userMessage);

    // ── Dynamic window sizing (GPT-style) ──
    const { count: conversationMessageCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", convId);

    // Use router config for max history length
    const dynamicWindow = routerConfig.maxHistoryLength;

    let messagesForContext = messages.slice(-dynamicWindow);

    // For Pro users, use enhanced conversation summary when chat exceeds threshold
    if (isPaidUser && conversationMessageCount && conversationMessageCount > dynamicWindow) {
      messagesForContext = await buildProMessageContext(
        convId,
        messages.slice(-dynamicWindow),
        conversationMessageCount
      );
    }

    // ── Fetch appropriate user summary based on subscription ──
    let userSummary = null;
    let shouldUseSummary = false;
    
    if (isPaidUser) {
      userSummary = await getProUserSummary(user.id);
      shouldUseSummary = userSummary ? await shouldUseProUserSummary(userMessage) : false;
    } else {
      userSummary = await getUserSummary(user.id);
      shouldUseSummary = userSummary ? await shouldUseUserSummary(userMessage) : false;
    }

    // ── NI tier requires active subscription ──
    if (modelTier === "ni" && !isPaidUser) {
      return NextResponse.json(
        { error: "The NI model requires an active subscription. Please upgrade to Pro." },
        { status: 402 }
      );
    }

    // ── NI Router: Determine actual model for NI tier ──
    let niModelRoute: any = null;
    if (modelTier === "ni") {
      const allLimitsExhausted = await checkAllLimitsExhausted(user.id, supabase);
      if (allLimitsExhausted) {
        return NextResponse.json(
          { error: "Your daily NI token limits have been exhausted. Please wait 24 hours for reset." },
          { status: 429 }
        );
      }

      const tokenRemaining = await getTotalNiRemaining(user.id, supabase);
      const gpt5TokenRemaining = await getTotalGPT5Remaining(user.id, supabase);
      const tokenLimits = {
        opusRemaining: tokenRemaining.opus,
        sonnetRemaining: tokenRemaining.sonnet,
        deepseekRemaining: tokenRemaining.deepseek,
        gpt5Remaining: gpt5TokenRemaining.gpt5,
        gpt5MiniRemaining: gpt5TokenRemaining.mini,
      };

      // TODO: Use unified classifier when integrated
      // const classification = await unifiedClassify(userMessage, {
      //   historyLength: messages.length,
      //   forceAI: false,
      // });
      
      const taskAnalysis = await analyzeTask(userMessage, {
        codeLength: messages.length * 50,
        fileCount: 1,
        conversationHistoryLength: messages.length,
      });

      niModelRoute = routeTask(taskAnalysis, tokenLimits);
      console.log(`🧠 NI Router: ${getRoutingExplanation(niModelRoute)} (confidence: ${taskAnalysis.confidence})`);

      if (niModelRoute.error) {
        console.log(`⚠️ ${niModelRoute.error}`);
      }

      // TODO: Use accurate token counting when integrated
      // const tokensNeeded = countTokensSync(userMessage) + countTokensSync(tiers.ni.systemPrompt) + 500;
      const tokensNeeded = estimateTokensNeeded(taskAnalysis);
      let modelType: 'claude-opus-4.6' | 'claude-sonnet-4.6' | 'deepseek-v4-pro' | 'gpt-5' | 'gpt-5-mini' = 'deepseek-v4-pro';
      
      if (niModelRoute.model === 'claude-opus-4.6') modelType = 'claude-opus-4.6';
      else if (niModelRoute.model === 'claude-sonnet-4.6') modelType = 'claude-sonnet-4.6';
      else if (niModelRoute.model === 'deepseek-v4-pro') modelType = 'deepseek-v4-pro';
      else if (niModelRoute.model === 'gpt-5') modelType = 'gpt-5';
      else if (niModelRoute.model === 'gpt-5-mini') modelType = 'gpt-5-mini';

      if (niModelRoute.noTokenLimit) {
        console.log(`🔄 Using ${niModelRoute.model} with no token limit tracking`);
      } else {
        const tokenResult = await checkAndDeductTokens(user.id, modelType, tokensNeeded, supabase);
        if (!tokenResult.success) {
          if (niModelRoute.fallback) {
            niModelRoute = niModelRoute.fallback;
            let fallbackModelType: 'claude-opus-4.6' | 'claude-sonnet-4.6' | 'deepseek-v4-pro' | 'gpt-5' | 'gpt-5-mini' = 'deepseek-v4-pro';
            if (niModelRoute.model === 'claude-sonnet-4.6') fallbackModelType = 'claude-sonnet-4.6';
            else if (niModelRoute.model === 'gpt-5-mini') fallbackModelType = 'gpt-5-mini';
            else if (niModelRoute.model === 'deepseek-v4-pro') fallbackModelType = 'deepseek-v4-pro';
            
            const fallbackResult = await checkAndDeductTokens(user.id, fallbackModelType, tokensNeeded, supabase);
            if (!fallbackResult.success) {
              return NextResponse.json(
                { error: "Your daily token limits have been exhausted. Please wait 24 hours for reset." },
                { status: 429 }
              );
            }
          } else {
            return NextResponse.json(
              { error: "Your daily token limits have been exhausted. Please wait 24 hours for reset." },
              { status: 429 }
            );
          }
        }
      }
    }

    // ── Check Tavily usage before allowing Tavily search ──
    const { data: tavilyUsage } = await supabase
      .rpc('get_or_reset_tavily_usage', { p_user_id: user.id });

    const tavilyDailyLimit = tavilyUsage?.[0]?.daily_limit;
    const currentTavilyCount = tavilyUsage?.[0]?.search_count || 0;
    const remainingTavilySearches = tavilyDailyLimit !== null ? tavilyDailyLimit - currentTavilyCount : Infinity;

    // Flag for response header
    let searchAttempted = false;

    // ── NI Pro Web Search: Serper (paid) → Tavily (fallback) → Wikipedia (unlimited) → pass to model ──
    let niSearchResults = "";
    let niSearchSources: { title: string; url: string }[] = [];
    if (modelTier === "ni" && shouldSearch) {
      searchAttempted = true;

      console.log(`🔍 NI Pro: Performing web search for query "${userMessage}"`);
      console.log(`📊 User is paid: ${isPaidUser}`);

      // Paid users: Try Serper first, then Tavily, then Wikipedia
      // Free users: Try Tavily (limited), then Wikipedia (unlimited)
      if (isPaidUser) {
        console.log(`🔍 NI Pro (Paid): Using Serper search`);
        // Try Serper first for paid users
        if (queries.length > 1) {
          console.log(`🔬 NI Pro Multi-query detected: ${queries.join(", ")}`);
          const results = await Promise.all(queries.map(q => performSerperSearch(q)));
          const validResults = results.filter(r => r.trim().length > 0);
          if (validResults.length > 0) {
            niSearchResults = validResults.join("\n\n");
          }
        } else {
          const cleanQ = queries[0] || userMessage;
          niSearchResults = await performSerperSearch(cleanQ);
        }

        // Fall back to Tavily if Serper fails
        if (!niSearchResults || niSearchResults.trim().length === 0) {
          console.log(`🔄 Serper failed, falling back to Tavily`);
          if (queries.length > 1) {
            const results = await Promise.all(queries.map(q => performTavilySearch(q)));
            const validResults = results.filter(r => r.trim().length > 0);
            if (validResults.length > 0) {
              niSearchResults = validResults.join("\n\n");
            }
          } else {
            const cleanQ = queries[0] || userMessage;
            niSearchResults = await performTavilySearch(cleanQ);
          }
        }

        // Fall back to Wikipedia if Tavily also fails
        if (!niSearchResults || niSearchResults.trim().length === 0) {
          console.log(`🔄 Tavily failed, falling back to Wikipedia`);
          if (queries.length > 1) {
            const results = await Promise.all(queries.map(q => performWikipediaSearch(q)));
            const validResults = results.filter(r => r.trim().length > 0);
            if (validResults.length > 0) {
              niSearchResults = validResults.join("\n\n");
            }
          } else {
            const cleanQ = queries[0] || userMessage;
            niSearchResults = await performWikipediaSearch(cleanQ);
          }
        }

        console.log(`✅ NI Pro search results obtained (${niSearchResults.length} chars)`);
      } else {
        // Free users: Tavily (limited) → Wikipedia (unlimited)
        console.log(`📊 Tavily usage: ${currentTavilyCount}/${tavilyDailyLimit || 'unlimited'}`);

        let usedTavily = false;
        if (remainingTavilySearches > 0) {
          if (queries.length > 1) {
            console.log(`🔬 NI Pro Multi-query detected: ${queries.join(", ")}`);
            const results = await Promise.all(queries.map(q => performTavilySearch(q)));
            const validResults = results.filter(r => r.trim().length > 0);
            if (validResults.length > 0) {
              niSearchResults = validResults.join("\n\n");
              usedTavily = true;
            }
          } else {
            const cleanQ = queries[0] || userMessage;
            niSearchResults = await performTavilySearch(cleanQ);
            if (niSearchResults && niSearchResults.trim().length > 0) {
              usedTavily = true;
            }
          }

          // Increment Tavily usage if successful
          if (usedTavily) {
            const { data: incrementResult } = await supabase
              .rpc('increment_tavily_usage', { p_user_id: user.id });

            if (incrementResult === -1) {
              console.warn("Tavily limit reached during increment");
            }

            console.log(`✅ NI Pro Tavily search results obtained (${niSearchResults.length} chars)`);
          }
        }

        // Fall back to Wikipedia if Tavily failed or limit reached
        if (!niSearchResults || niSearchResults.trim().length === 0) {
          console.log(`🔄 Falling back to Wikipedia search`);
          if (queries.length > 1) {
            const results = await Promise.all(queries.map(q => performWikipediaSearch(q)));
            const validResults = results.filter(r => r.trim().length > 0);
            if (validResults.length > 0) {
              niSearchResults = validResults.join("\n\n");
            }
          } else {
            const cleanQ = queries[0] || userMessage;
            niSearchResults = await performWikipediaSearch(cleanQ);
          }
          console.log(`✅ NI Pro Wikipedia search results obtained (${niSearchResults.length} chars)`);
        }
      }

      // Extract sources from search results for display
      if (niSearchResults && niSearchResults.trim().length > 0) {
        const sourceMatches = niSearchResults.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const match of sourceMatches) {
          niSearchSources.push({ title: match[1], url: match[2] });
        }
      } else {
        niSearchResults = "";
      }
    }

    // ── Fetch user profile (used by both branches) ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, goal, custom_instructions")
      .eq("user_id", user.id)
      .single();

    let profileNote = "";
    if (profile && !newConversation) {
      // Only use profile in ongoing conversations, not at start
      const parts = [];
      if (profile.goal) {
        // Extract meaningful words from goal
        const goalWords = profile.goal.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
        if (goalWords.length > 0) {
          parts.push(`As your goal involves ${goalWords.join(", ")}, keep this context in mind for better responses.`);
        }
      }
      if (profile.custom_instructions) {
        // Extract key instructions
        const instructionWords = profile.custom_instructions.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
        if (instructionWords.length > 0) {
          parts.push(`Following your preference for ${instructionWords.join(", ")}, tailor responses accordingly.`);
        }
      }
      if (parts.length > 0) {
        profileNote = parts.join(" ");
      }
    }

    // Add user summary to profile note when contextually appropriate
    if (userSummary && shouldUseSummary && !newConversation) {
      profileNote += ` ${userSummary}`;
    }

    // ── Cache check: skip for personalized, live, or AAI queries ──
    const canUseCache = !diveDeep && !profileNote && !userSummary && modelTier !== "aai" && modelTier !== "live" && !isWidgetQuery;
    if (canUseCache) {
      const cached = getCachedReply(userMessage);
      if (cached) {
        console.log(`💾 Cache hit for query: "${userMessage.slice(0, 50)}..."`);
        await saveMessage(supabase, user.id, convId, "assistant", cached);
        const encoder = new TextEncoder();
        const words = cached.split(" ");
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-conversation-id": convId,
            "x-model-used": modelTier,
            "x-cached": "true",
          },
        });
      }
    }

    // ── Time/Weather/Date Handler (bypasses search for all tiers) ──
    if (isWidgetQuery) {
      console.log(`🕐 Time/Weather/Date query detected - using API instead of search`);
      const canUseWidgets = modelTier === "pro";
      let responseData = "";

      if (isWeatherQuery) {
        const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
        const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
        if (weatherData) {
          if (canUseWidgets) {
            responseData = `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
          } else {
            responseData = `🌡️ ${weatherData.temp}°C, ${weatherData.condition}, 💧 ${weatherData.humidity}%, 🌬️ ${weatherData.windSpeed} m/s, 👁️ ${weatherData.visibility} km, 📊 ${weatherData.pressure} hPa, ☁️ ${weatherData.cloudiness}%`;
          }
        }
      } else if (isTimeQuery) {
        // Use the same time API (fetchTimeData) for all tiers to ensure consistency
        const timeData = await fetchTimeData(undefined, userTimezone);
        if (timeData) {
          if (canUseWidgets) {
            // N Pro: Format as widget
            const clockData = {
              utcDatetime: timeData.utcDatetime,
              timezone: timeData.timezone,
              label: timeData.label,
            };
            responseData = `<!--WIDGET:CLOCK:${JSON.stringify(clockData)}-->`;
          } else {
            // N Fast/Plus: Use pre-formatted strings from the API to avoid server-side timezone conversion
            const timeStr = timeData.formattedTime || "";
            const dateStr = timeData.formattedDate || "";
            if (timeStr && dateStr) {
              responseData = `🕐 ${timeStr} ${dateStr} (${timeData.timezone})`;
            }
          }
        }
      } else if (isDateQuery) {
        // Use the same time API (fetchTimeData) for all tiers to ensure consistency
        const timeData = await fetchTimeData(undefined, userTimezone);
        if (timeData) {
          if (canUseWidgets) {
            // N Pro: Format as widget
            const calData = {
              utcDatetime: timeData.utcDatetime,
              timezone: timeData.timezone,
              label: timeData.label,
            };
            responseData = `<!--WIDGET:CALENDAR:${JSON.stringify(calData)}-->`;
          } else {
            // N Fast/Plus: Format as plain text using the same data
            const dt = new Date(timeData.utcDatetime);
            const dateStr = new Intl.DateTimeFormat("en-US", {
              timeZone: timeData.timezone,
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(dt);

            responseData = `📅 ${dateStr}`;
          }
        }
      }

      if (responseData) {
        await saveMessage(supabase, user.id, convId, "assistant", responseData);
        const encoder = new TextEncoder();
        const words = responseData.split(" ");
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-conversation-id": convId,
            "x-model-used": modelTier,
          },
        });
      }
    }

    // Fetch persona notes once (used by both branches)
    const { data: personaNotes } = await supabase
      .from("bot_persona_notes")
      .select("note")
      .eq("user_id", user.id);
    let personaNoteText = "";
    if (personaNotes && personaNotes.length > 0) {
      personaNoteText = personaNotes.map((n: any) => `- ${n.note}`).join("\n");
    }

    // ── AAI branch: gate with explicit signals ─────────────────────────────
    if (modelTier === "aai") {
      // Tighten AAI entry: only use full planner for explicit complex signals
      const lowerMessage = userMessage.toLowerCase();
      const hasExplicitSignals = 
        /\b(plan|planning|step by step|multi-day|multi day|agent|workflow|architecture|system design|build a|create a|implement)\b/i.test(lowerMessage) ||
        userMessage.length > 300 ||
        (userMessage.includes("code") && userMessage.length > 150);

      if (!hasExplicitSignals) {
        console.log(`🔄 AAI short-circuit: no explicit signals, using normal tier instead`);
        // Fall back to Pro tier for simple AAI requests
        // Override modelTier to 'pro' and continue to regular tier logic
        modelTier = "pro";
      } else {
        // Only proceed with AAI branch if explicit signals are present
        const history = messages.slice(0, -1).map((m: any) => ({
          role: m.role,
          content: m.content,
          id: m.id,
          timestamp: Date.now(),
        }));

        // Only N Pro can generate widgets
        const canUseWidgets = false; // AAI doesn't support widgets

        let liveData = "";
        if (shouldSearch) {
          searchAttempted = true;

          // Widget queries – use exact whole-question patterns to avoid false positives (N Pro only)
          const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
          const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
          const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());

          const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

          if (isWidgetQuery && canUseWidgets) {
            if (isWeatherQuery) {
              const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
              const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
              if (weatherData) {
                liveData = `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
              }
            } else if (isTimeQuery) {
              liveData = await getCurrentTimeCard(undefined, userTimezone);
            } else if (isDateQuery) {
              liveData = await getCurrentCalendarCard(undefined, userTimezone);
            }
          } else if (isWidgetQuery && !canUseWidgets) {
            // For non-Pro tiers, use API-based responses without widgets (no Tavily/Wikipedia for time/weather/date)
            if (isWeatherQuery) {
              const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
              const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
              if (weatherData) {
                liveData = `🌡️ ${weatherData.temp}°C, ${weatherData.condition}, 💧 ${weatherData.humidity}%, 🌬️ ${weatherData.windSpeed} m/s, 👁️ ${weatherData.visibility} km, 📊 ${weatherData.pressure} hPa, ☁️ ${weatherData.cloudiness}%`;
              }
            } else if (isTimeQuery) {
              const timeData = await getCurrentTimeAndLocation(null, userTimezone);
              if (timeData) {
                liveData = `🕐 ${timeData.time} ${timeData.date} (${timeData.timezone})`;
              }
            } else if (isDateQuery) {
              const now = new Date();
              const dateStr = now.toLocaleDateString("en-US", {
                timeZone: userTimezone || "UTC",
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              liveData = `📅 ${dateStr}`;
            }
            if (!liveData) {
              liveData = `\n\n--- DATA RESULT ---\nCould not fetch time/weather/date data. Please try again later.`;
            }
            console.log(`✅ API data obtained for non-Pro widget query (${liveData.length} chars)`);
          } else {
            // Universal web search – Tavily (limited) → Wikipedia (unlimited)
            console.log(`📊 Tavily usage: ${currentTavilyCount}/${tavilyDailyLimit || 'unlimited'}`);

            // Try Tavily first if within limits
            let usedTavily = false;
            if (remainingTavilySearches > 0) {
              if (queries.length > 1) {
                console.log(`🔬 Multi‑query detected: ${queries.join(", ")}`);
                const results = await Promise.all(queries.map(q => performTavilySearch(q)));
                const validResults = results.filter(r => r.trim().length > 0);
                if (validResults.length > 0) {
                  liveData = validResults.join("\n\n");
                  usedTavily = true;
                }
              } else {
                const cleanQ = queries[0] || userMessage;
                liveData = await performTavilySearch(cleanQ);
                if (liveData && liveData.trim().length > 0) {
                  usedTavily = true;
                }
              }

              // Increment Tavily usage if successful
              if (usedTavily) {
                const { data: incrementResult } = await supabase
                  .rpc('increment_tavily_usage', { p_user_id: user.id });

                if (incrementResult === -1) {
                  console.warn("Tavily limit reached during increment");
                }

                console.log(`✅ Tavily search results obtained (${liveData.length} chars)`);
              }
            }

            // Fall back to Wikipedia if Tavily failed or limit reached
            if (!liveData || liveData.trim().length === 0) {
              console.log(`🔄 Falling back to Wikipedia search`);
              if (queries.length > 1) {
                const results = await Promise.all(queries.map(q => performWikipediaSearch(q)));
                const validResults = results.filter(r => r.trim().length > 0);
                if (validResults.length > 0) {
                  liveData = validResults.join("\n\n");
                }
              } else {
                const cleanQ = queries[0] || userMessage;
                liveData = await performWikipediaSearch(cleanQ);
              }
              console.log(`✅ Wikipedia search results obtained (${liveData.length} chars)`);
            }

            if (!liveData) {
              liveData = `\n\n--- SEARCH RESULT ---\nNo reliable information found. Please try again later.`;
            }
          }
        }

        const widgetInstruction = canUseWidgets ? `\n\n[SYSTEM NOTE: When the user asks for time, weather, or date, search the web and output ONLY a widget marker. Do NOT output the data in plain text.
Weather marker: <!--WIDGET:WEATHER:{"city":"...","temp":34,"condition":"scattered clouds","humidity":36,"windSpeed":3.1,"icon":"cloud"}-->
Time marker:   <!--WIDGET:CLOCK:{"hours":14,"minutes":6,"seconds":0,"timezone":"Asia/Karachi","label":"Lahore, PK"}-->
Calendar:      <!--WIDGET:CALENDAR:{"year":2026,"month":7,"day":3,"timezone":"Asia/Karachi","label":"Today"}-->]\n\n` : "";

        let extendedMessage = "";
        if (profileNote) {
          extendedMessage += `--- USER PROFILE ---\n${profileNote}\n\n`;
        }
        if (personaNoteText) {
          extendedMessage += `--- BOT PERSONA NOTES ---\nYou must follow these behavioral instructions with every response:\n${personaNoteText}\nThese are permanent preferences from the user.\n\n`;
        }
        if (liveData) {
          extendedMessage += `--- REAL-TIME SEARCH (use this data) ---\n${liveData}\n\n`;
          extendedMessage += `IMPORTANT: After your answer, add a "## Sources" section with one bullet point per source, like this:\n- [Title](URL)\n- [Title](URL)\nDo NOT skip this section.\n\n`;
        }
        extendedMessage += `[SYSTEM: Target response length is ${tiers.aai.maxTokens} tokens. Stop before that. End with a complete sentence. If you need more room, summarise and suggest upgrading to a higher tier.]`;

        // Prepend widget instruction
        extendedMessage = widgetInstruction + extendedMessage + `\n\nUser: ${userMessage}`;
        console.log(`📝 AAI extendedMessage now has ${extendedMessage.length} chars`);

        const aaiResult = await aaiRuntime.processRequest({
          userMessage: extendedMessage,
          conversationHistory: history,
          modelTier,
          metadata: {
            conversationId: convId,
            userId: user.id,
          },
        });

        let replyText = aaiResult.response || "";
        // Hard fallback for empty response
        if (!replyText.trim()) {
          replyText = "I searched the web but couldn't retrieve the full information. Please try again.";
        }
        await saveMessage(supabase, user.id, convId, "assistant", replyText);

        // Trigger user summary generation (async, non-blocking)
        const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
        if (isPaidUser) {
          generateProUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        } else {
          generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        }

        const encoder = new TextEncoder();
        const words = replyText.split(" ");
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
          "x-model-used": modelTier,
        };
        if (searchAttempted) {
          headers["x-search-performed"] = "true";
        }
        return new Response(stream, { headers });
      }
    }

    // ── Regular tier with fallback ────────────
    const tier = tiers[modelTier as keyof typeof tiers] || tiers.fast;

    // ── Inject user preferences (warmth, enthusiasm, etc.) ──
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("warmth, enthusiasm, formatting, conciseness")
      .eq("user_id", user.id)
      .single();

    let toneInjection = "";
    if (prefs) {
      toneInjection = `\n\n--- USER PERSONALIZATION ---\n`;
      if (prefs.warmth > 0) toneInjection += `- Be warm and empathetic. Use phrases like "I understand" where appropriate.\n`;
      if (prefs.warmth < 0) toneInjection += `- Be objective and direct. Avoid emotional language.\n`;
      if (prefs.enthusiasm > 0) toneInjection += `- Use positive, energetic language with occasional exclamation marks.\n`;
      if (prefs.enthusiasm < 0) toneInjection += `- Keep a neutral, measured tone.\n`;
      if (prefs.formatting > 0) toneInjection += `- Use headers, lists, and structured formatting extensively.\n`;
      if (prefs.formatting < 0) toneInjection += `- Prefer paragraphs over heavy Markdown formatting.\n`;
      if (prefs.conciseness > 0) toneInjection += `- Be extremely concise. Short sentences, minimal fluff.\n`;
      if (prefs.conciseness < 0) toneInjection += `- Be thorough and detailed, even if responses become longer.\n`;
    }

    // ── Context compression: summarize older turns, keep recent verbatim ──
    const { recent: recentMessages, summary: rollingSummary } = await compressHistory(
      messagesForContext.map((m: any) => ({ role: m.role, content: m.content }))
    );

    // Build messages array with dynamic tiered system prompt (reduces token usage by 50-70%)
    const dynamicSystemPrompt = getSystemPrompt(modelTier, userMessage);
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: dynamicSystemPrompt },
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // ── Inject rolling summary of earlier turns (context compression) ──
    if (rollingSummary) {
      apiMessages[0].content += `\n\n--- EARLIER CONVERSATION SUMMARY ---\n${rollingSummary}\n(The messages below are the most recent turns; use the summary above for earlier context.)`;
    }

    // ── Inject user profile ──────────────────────
    if (profileNote) {
      apiMessages[0].content += `\n\n--- USER PROFILE ---\n${profileNote}`;
    }

    // ── Inject user preferences ──
    apiMessages[0].content += toneInjection;

    // ── Inject intent label ──
    apiMessages[0].content += `\n\nIntent: ${intent}`;

    // ── Dynamic Rich Content Engine (conditional — saves ~600 tokens on simple queries) ──
    const richContentIntents = new Set([
      "planning",
      "step_by_step_guide",
      "how_to_tutorial",
      "learning_path",
      "project_management",
      "deep_explanation",
      "system_design",
      "architecture_design",
    ]);
    const needsRichContent = modelTier === "pro" || richContentIntents.has(intent);
    if (needsRichContent) {
      apiMessages[0].content += DYNAMIC_RICH_CONTENT_ENGINE;
    }

    // ── Inject bot persona notes ──
    if (personaNoteText) {
      apiMessages[0].content += `\n\n--- BOT PERSONA NOTES ---\nYou must follow these behavioral instructions with every response:\n${personaNoteText}\nThese are permanent preferences from the user.`;
    }

    // ── Inject NI Pro web search results ──
    if (modelTier === "ni" && niSearchResults) {
      apiMessages[0].content += `\n\n--- WEB SEARCH RESULTS ---\n${niSearchResults}\n\nIMPORTANT: You have been provided with web search results above. Your job is to:\n1. Acknowledge the search results\n2. Explain and expand on the information\n3. Add your own insights and context\n4. Cover related aspects the user might find useful\n5. Make it comprehensive and helpful\nDo NOT repeat the search results verbatim. Instead, build upon them.`;
    }

    // ── AI‑routed live‑data injection ──
    let liveData = "";
    let searchSources: { title: string; url: string }[] = [];
    let searchPlatform = "";
    // Only N Pro can generate widgets
    const canUseWidgets = modelTier === "pro";
    
    // Non-N-Live search path: inject results into LLM prompt (N Live has its own pipeline below)
    if (shouldSearch && !shouldUseNLive) {
      searchAttempted = true;

      // Widget queries – use exact whole-question patterns to avoid false positives (N Pro only)
      const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
      const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
      const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());

      const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

      if (isWidgetQuery && canUseWidgets) {
        // N Pro: Use widgets for time/weather/date, NO web search for pure widget queries
        if (isWeatherQuery) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
          if (weatherData) {
            liveData = `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
          }
        } else if (isTimeQuery) {
          liveData = await getCurrentTimeCard(undefined, userTimezone);
        } else if (isDateQuery) {
          liveData = await getCurrentCalendarCard(undefined, userTimezone);
        }
        // Skip web search for pure widget queries in N Pro - return early
        if (liveData) {
          console.log(`✅ N Pro widget data obtained (${liveData.length} chars)`);
          return;
        }
      } else if (isWidgetQuery && !canUseWidgets) {
        // For non-Pro tiers, use API-based responses without widgets (no Tavily/Wikipedia for time/weather/date)
        if (isWeatherQuery) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
          if (weatherData) {
            liveData = `🌡️ ${weatherData.temp}°C, ${weatherData.condition}, 💧 ${weatherData.humidity}%, 🌬️ ${weatherData.windSpeed} m/s, 👁️ ${weatherData.visibility} km, 📊 ${weatherData.pressure} hPa, ☁️ ${weatherData.cloudiness}%`;
          }
        } else if (isTimeQuery) {
          const timeData = await getCurrentTimeAndLocation(null, userTimezone);
          if (timeData) {
            liveData = `🕐 ${timeData.time} ${timeData.date} (${timeData.timezone})`;
          }
        } else if (isDateQuery) {
          const now = new Date();
          const dateStr = now.toLocaleDateString("en-US", {
            timeZone: userTimezone || "UTC",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          liveData = `📅 ${dateStr}`;
        }
        if (!liveData) {
          liveData = `\n\n--- DATA RESULT ---\nCould not fetch time/weather/date data. Please try again later.`;
        }
        console.log(`✅ API data obtained for non-Pro widget query (${liveData.length} chars)`);
      } else {
        // Universal web search – multi‑query or single
        if (queries.length > 1) {
          console.log(`🔬 Multi‑query detected: ${queries.join(", ")}`);
          const results = await Promise.all(queries.map(q => performNLiveSearch(q)));
          const validResults = results.filter(r => r.answer);
          if (validResults.length > 0) {
            liveData = validResults.map((r, i) => r.answer).join("\n\n");
            searchSources = validResults.flatMap(r => r.sources);
            searchPlatform = validResults[0].platform;
          }
        } else {
          const cleanQ = queries[0] || userMessage;
          const searchResult = await performNLiveSearch(cleanQ);
          if (searchResult.answer) {
            liveData = searchResult.answer;
            searchSources = searchResult.sources;
            searchPlatform = searchResult.platform;
          }
        }
        if (!liveData) {
          liveData = `No reliable information found. Please try again later.`;
        }
        console.log(`✅ Search results obtained (${liveData.length} chars) from ${searchPlatform}`);
      }

      if (liveData) {
        // For regular models, format search results as italic block and instruct LLM to expand
        const italicSearch = `*${liveData}*`;
        apiMessages[0].content += `\n\n--- WEB SEARCH RESULTS (italic block below) ---\n${italicSearch}\n\nIMPORTANT: You have been provided with web search results above in an italic block. Your job is to:\n1. Acknowledge the search results\n2. Explain and expand on the information\n3. Add your own insights and context\n4. Cover related aspects the user might find useful\n5. Make it comprehensive and helpful\nDo NOT repeat the search results verbatim. Instead, build upon them.`;
      }
    }

    // ── N Live Pipeline: Direct streaming without LLM ──
    let wikiSources: { title: string; url: string }[] = [];
    if (shouldSearch && shouldUseNLive) {
      searchAttempted = true;

      // Check for widget queries (N Pro only)
      const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
      const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
      const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());
      const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;
      const canUseWidgets = modelTier === "pro";

      let widgetData = "";
      let searchQuery = queries[0] || userMessage;

      // Handle mixed queries: extract non-widget part for search
      if (isWidgetQuery && canUseWidgets) {
        // N Pro: Use widgets for time/weather/date, NO web search for pure widget queries
        if (isWeatherQuery) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
          if (weatherData) {
            widgetData = `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
          }
          // Only search if there's additional content beyond the weather query
          const remainingQuery = userMessage.replace(/weather|temperature|rain|forecast|in\s+[A-Za-z\s]+/gi, "").trim();
          searchQuery = remainingQuery.length > 3 ? remainingQuery : "";
        } else if (isTimeQuery) {
          widgetData = await getCurrentTimeCard(undefined, userTimezone);
          // Only search if there's additional content beyond the time query
          const remainingQuery = userMessage.replace(/what( i|')?s the \)?time|clock/gi, "").trim();
          searchQuery = remainingQuery.length > 3 ? remainingQuery : "";
        } else if (isDateQuery) {
          widgetData = await getCurrentCalendarCard(undefined, userTimezone);
          // Only search if there's additional content beyond the date query
          const remainingQuery = userMessage.replace(/what( i|')?s (the )?date|today'?s date|what day/gi, "").trim();
          searchQuery = remainingQuery.length > 3 ? remainingQuery : "";
        }
      } else if (isWidgetQuery && !canUseWidgets) {
        // For non-Pro tiers, use API-based responses without widgets (no Tavily/Wikipedia for time/weather/date)
        if (isWeatherQuery) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
          if (weatherData) {
            widgetData = `🌡️ ${weatherData.temp}°C, ${weatherData.condition}, 💧 ${weatherData.humidity}%, 🌬️ ${weatherData.windSpeed} m/s, 👁️ ${weatherData.visibility} km, 📊 ${weatherData.pressure} hPa, ☁️ ${weatherData.cloudiness}%`;
          }
        } else if (isTimeQuery) {
          const timeData = await getCurrentTimeAndLocation(null, userTimezone);
          if (timeData) {
            widgetData = `🕐 ${timeData.time} ${timeData.date} (${timeData.timezone})`;
          }
        } else if (isDateQuery) {
          const now = new Date();
          const dateStr = now.toLocaleDateString("en-US", {
            timeZone: userTimezone || "UTC",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          widgetData = `📅 ${dateStr}`;
        }
        // Don't perform web search for time/weather/date in non-Pro tiers
        searchQuery = "";
      }

      // Perform N Live search
      const cleanQ = searchQuery.length > 3 ? searchQuery : queries[0] || userMessage;
      const searchResult = await performNLiveSearch(cleanQ);

      if (searchResult.answer && !searchResult.useLLM) {
        // Tavily succeeded - stream directly in italic (sources passed via header)
        const italicAnswer = `*${searchResult.answer}*`;
        const fullResponse = widgetData ? `${widgetData}\n\n${italicAnswer}` : italicAnswer;

        // Stream the response
        const words = fullResponse.split(/\s+/);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        await saveMessage(supabase, user.id, convId, "assistant", fullResponse);

        const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
        if (isPaidUser) {
          generateProUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        } else {
          generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        }

        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
          "x-search-performed": "true",
          "x-sources": encodeURIComponent(JSON.stringify(searchResult.sources)),
        };

        return new Response(stream, { headers });
      } else if (searchResult.answer && searchResult.useLLM) {
        // Wikipedia fallback - pass to LLM for formatting (sources passed via header)
        liveData = searchResult.answer;
        // Store sources to pass via header later
        wikiSources = searchResult.sources;
        // Continue to normal LLM flow below
      } else {
        // No results - show error message
        const errorMessage = "I couldn't find information on that topic. Please try again later or rephrase your question.";
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const words = errorMessage.split(/\s+/);
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        await saveMessage(supabase, user.id, convId, "assistant", errorMessage);

        const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
        if (isPaidUser) {
          generateProUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        } else {
          generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        }

        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
          "x-search-performed": "true",
        };

        return new Response(stream, { headers });
      }
    }

    // ── Soft token target + upgrade hint (skip for live tier) ──
    if (modelTier !== "live") {
      const tierUpgrade: Record<string, string | null> = {
        fast: "Plus",
        plus: "Pro",
        pro: "AAI",
        live: "Pro",
        code: "Pro",
        aai: null,
      };
      const nextTier = tierUpgrade[modelTier];
      apiMessages[0].content += `\n\n--- OUTPUT SIZE CONTROL ---
Your **target** response length is exactly ${tier.maxTokens} tokens.
- Stop generating **before** you reach this limit.
- End with a complete sentence, a brief summary, or a period.
- Never leave a word unfinished.
- If the answer requires more space, give a short summary and add:
  "→ For a longer explanation, switch to N ${nextTier || 'Pro'}."
The system will cut you off if you exceed twice this limit, so plan ahead.`;
    }

    // ── Force minimum token allocation for reply (all tiers except live) ──
    if (modelTier !== "live") {
      const HARD_RESPONSE_TOKENS = 300;
      const systemTokens = Math.ceil(apiMessages[0].content.length / 4);
      const availableTokens = tier.maxTokens - systemTokens;
      if (availableTokens < HARD_RESPONSE_TOKENS) {
        apiMessages[0].content = apiMessages[0].content.slice(0, (tier.maxTokens - HARD_RESPONSE_TOKENS) * 4);
        console.log(`✂️ System prompt trimmed to ${apiMessages[0].content.length} chars (${tier.maxTokens - HARD_RESPONSE_TOKENS} tokens for reply)`);
      }
    }

    let lastError: string | null = null;

    for (const modelConfig of tier.models) {
      console.log(`🤖 Using model: ${modelConfig.modelName} (${modelConfig.modelKey})`);
      let apiKey = process.env[modelConfig.apiKeyEnv];

      // Use different API key for paid users
      const MESH_API_KEY = process.env.MESH_API_KEY;    // paid tier key
      const GROQ_API_KEY = process.env.GROQ_API_KEY;    // free tier key

      // Override the apiKey based on subscription
      if (isPaidUser && MESH_API_KEY) {
        // Paid users get Mesh API for Pro/Plus, still use Groq for fallback
        if (modelTier === "pro" || modelTier === "plus") {
          // Use Mesh endpoint and key
          modelConfig.endpoint = "https://api.mesh.ai/v1/chat/completions";
          apiKey = MESH_API_KEY;
          modelConfig.modelName = "gpt-4o"; // Update with your actual Mesh model name
        }
      }

      // Use fallback key if primary is missing or we're on the fallback model
      if (!apiKey || modelConfig.modelKey === "live_fallback" || modelConfig.modelKey === "aai_fallback") {
        apiKey = process.env.GROQ_API_KEY_4 || process.env[modelConfig.apiKeyEnv];
      }
      if (!apiKey) {
        lastError = `Missing API key for ${modelConfig.modelKey}`;
        continue;
      }

      // Modest headroom above the target so replies finish cleanly without
      // allowing a full 2× budget overrun.
      const hardCap = Math.max(Math.ceil(tier.maxTokens * 1.3), 512);

      // Token budget log only for non‑live tiers
      if (modelTier !== "live") {
        const remainingTokens = tier.maxTokens - Math.ceil(apiMessages[0].content.length / 4);
        console.log(`📊 Token budget: ${tier.maxTokens} total, ~${Math.ceil(apiMessages[0].content.length / 4)} for system, ${remainingTokens} remaining for reply`);
      }

      try {
        // ── Gemini branch (true SSE streaming) ────
        if (modelConfig.provider === "gemini") {
          const streamEndpoint = modelConfig.endpoint.replace(":generateContent", ":streamGenerateContent");
          const geminiUrl = `${streamEndpoint}?alt=sse&key=${apiKey}`;
          const systemMessages = apiMessages.filter(m => m.role === "system");
          const otherMessages = apiMessages.filter(m => m.role !== "system");

          const geminiBody: any = {
            contents: otherMessages.map(m => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              temperature: tier.temperature,
              maxOutputTokens: hardCap,
            },
          };
          if (systemMessages.length > 0) {
            geminiBody.system_instruction = {
              parts: [{ text: systemMessages.map(m => m.content).join("\n") }],
            };
          }

          const aiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiBody),
          });

          if (!aiRes.ok || !aiRes.body) {
            const errorText = aiRes.body ? await aiRes.text() : `HTTP ${aiRes.status}`;
            console.warn(`Gemini model ${modelConfig.modelName} failed:`, errorText);
            lastError = errorText;
            continue;
          }

          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          let fullContent = "";

          const stream = new ReadableStream({
            async start(controller) {
              try {
                const reader = aiRes.body!.getReader();
                let buffer = "";
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6).trim();
                    if (!data || data === "[DONE]") continue;

                    try {
                      const parsed = JSON.parse(data);
                      const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        fullContent += text;
                        // Re-emit in OpenAI delta format the frontend expects.
                        const chunk = { choices: [{ delta: { content: text } }] };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                      }
                    } catch {
                      // skip invalid JSON
                    }
                  }
                }

                // Hard fallback – never send empty response
                if (!fullContent.trim()) {
                  fullContent = "I searched the web but couldn't retrieve the full information. Please try again.";
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fullContent } }] })}\n\n`));
                }

                // Verify answer if search was used (non-NLive path)
                let finalContent = fullContent;
                if (searchAttempted && !shouldUseNLive && searchSources.length > 0) {
                  const sourceUrls = searchSources.map(s => s.url);
                  try {
                    finalContent = await verifyAnswer(fullContent, sourceUrls, userMessage);
                    console.log(`✅ Answer verified (${finalContent.length} chars)`);
                  } catch (err) {
                    console.warn("Verification failed, using original answer:", err);
                  }
                }

                saveMessage(supabase, user.id, convId, "assistant", finalContent).catch(console.error);
                getUserTotalMessageCount(supabase, user.id).then(totalMessageCount => {
                  if (isPaidUser) {
                    generateProUserSummary(user.id, messages, totalMessageCount).catch(console.error);
                  } else {
                    generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
                  }
                }).catch(console.error);

                // Cache the response if cacheable
                if (canUseCache && finalContent.length > 20) {
                  setCachedReply(userMessage, finalContent);
                }

                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              } catch (error) {
                console.error("Gemini stream error:", error);
                controller.error(error);
              }
            },
          });

          console.log(`✅ Model succeeded: ${modelConfig.modelName} (${modelConfig.modelKey})`);
          const headers: Record<string, string> = {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-conversation-id": convId,
            "x-model-used": modelTier,
          };
          if (searchAttempted) {
            headers["x-search-performed"] = "true";
          }
          const geminiSources = searchSources.length > 0 ? searchSources : wikiSources;
          const niSources = modelTier === "ni" ? niSearchSources : geminiSources;
          if (niSources.length > 0) {
            headers["x-sources"] = encodeURIComponent(JSON.stringify(niSources));
          }

          return new Response(stream, { headers });
        }

        // ── Default (OpenAI‑style) branch ──────────
        const aiRes = await fetch(modelConfig.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelConfig.modelName,
            messages: apiMessages,
            temperature: tier.temperature,
            max_tokens: hardCap,
            stream: true,
            tools: AVAILABLE_TOOLS,
            tool_choice: "auto",
          }),
        });

        if (!aiRes.ok) {
          const errorText = await aiRes.text();
          console.warn(`Model ${modelConfig.modelName} failed:`, errorText);
          lastError = errorText;
          continue;
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullContent = "";
        let toolCallsBuffer: any[] = [];
        let pendingToolCall = false;

        const stream = new ReadableStream({
          async start(controller) {
            try {
              const reader = aiRes.body?.getReader();
              if (!reader) {
                controller.close();
                return;
              }

              let buffer = "";
              while (true) {
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
                    const delta = parsed.choices?.[0]?.delta;
                    
                    // Check for tool calls
                    if (delta?.tool_calls) {
                      toolCallsBuffer.push(...delta.tool_calls);
                      pendingToolCall = true;
                      // Don't stream tool calls to client
                      continue;
                    }
                    
                    const content = delta?.content;
                    if (content) {
                      fullContent += content;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                    }
                  } catch (e) {
                    // skip invalid JSON
                  }
                }
              }

              // Handle tool calls if present
              if (pendingToolCall && toolCallsBuffer.length > 0) {
                console.log("🔧 Tool calls detected, executing...");
                
                for (const toolCall of toolCallsBuffer) {
                  const toolResult = await executeToolCall(toolCall);
                  console.log(`🔧 Tool result: ${toolResult.slice(0, 100)}...`);
                  
                  // Add tool result to messages and call model again
                  const toolMessage = {
                    role: "tool" as const,
                    tool_call_id: toolCall.id,
                    content: toolResult,
                  };
                  
                  const followUpMessages = [...apiMessages, {
                    role: "assistant" as const,
                    tool_calls: toolCallsBuffer,
                  }, toolMessage];
                  
                  // Get final response from model
                  const followUpRes = await fetch(modelConfig.endpoint, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                      model: modelConfig.modelName,
                      messages: followUpMessages,
                      temperature: tier.temperature,
                      max_tokens: hardCap,
                      stream: true,
                    }),
                  });
                  
                  if (followUpRes.ok) {
                    const followUpReader = followUpRes.body?.getReader();
                    if (followUpReader) {
                      let followUpBuffer = "";
                      while (true) {
                        const { done, value } = await followUpReader.read();
                        if (done) break;
                        
                        followUpBuffer += decoder.decode(value, { stream: true });
                        const followUpLines = followUpBuffer.split("\n");
                        followUpBuffer = followUpLines.pop() || "";
                        
                        for (const followUpLine of followUpLines) {
                          if (!followUpLine.startsWith("data: ")) continue;
                          const followUpData = followUpLine.slice(6).trim();
                          if (followUpData === "[DONE]") continue;
                          
                          try {
                            const followUpParsed = JSON.parse(followUpData);
                            const followUpContent = followUpParsed.choices?.[0]?.delta?.content;
                            if (followUpContent) {
                              fullContent += followUpContent;
                              controller.enqueue(encoder.encode(`data: ${JSON.stringify(followUpParsed)}\n\n`));
                            }
                          } catch (e) {
                            // skip invalid JSON
                          }
                        }
                      }
                    }
                  }
                }
              }

              // Hard fallback – never send empty response
              if (!fullContent.trim()) {
                const fallbackMsg = "I searched the web but couldn't retrieve the full information. Please try again.";
                fullContent = fallbackMsg;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackMsg } }] })}\n\n`));
              }

              // Verify answer if search was used (non-NLive path)
              let finalContent = fullContent;
              if (searchAttempted && !shouldUseNLive && searchSources.length > 0) {
                const sourceUrls = searchSources.map(s => s.url);
                try {
                  finalContent = await verifyAnswer(fullContent, sourceUrls, userMessage);
                  console.log(`✅ Answer verified (${finalContent.length} chars)`);
                } catch (err) {
                  console.warn("Verification failed, using original answer:", err);
                }
              }

              saveMessage(supabase, user.id, convId, "assistant", finalContent).catch(console.error);

              // Trigger user summary generation (async, non-blocking)
              getUserTotalMessageCount(supabase, user.id).then(totalMessageCount => {
                if (isPaidUser) {
                  generateProUserSummary(user.id, messages, totalMessageCount).catch(console.error);
                } else {
                  generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
                }
              }).catch(console.error);

              // Cache the response if cacheable
              if (canUseCache && finalContent.length > 20) {
                setCachedReply(userMessage, finalContent);
              }

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (error) {
              console.error("Stream error:", error);
              controller.error(error);
            }
          },
        });

        console.log(`✅ Model succeeded: ${modelConfig.modelName} (${modelConfig.modelKey})`);
        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
          "x-model-used": modelTier,
        };
        if (searchAttempted) {
          headers["x-search-performed"] = "true";
        }
        // Add sources header if available from search (regular or Wikipedia fallback)
        const openaiSources = searchSources.length > 0 ? searchSources : wikiSources;
        const finalSources = modelTier === "ni" ? niSearchSources : openaiSources;
        if (finalSources.length > 0) {
          headers["x-sources"] = encodeURIComponent(JSON.stringify(finalSources));
        }

        return new Response(stream, { headers });
      } catch (fetchError: any) {
        console.warn(`Model ${modelConfig.modelName} threw an error:`, fetchError);
        lastError = fetchError.message || "Unknown fetch error";
      }
    }

    console.error("All models failed. Last error:", lastError);
    return NextResponse.json(
      { error: `All models failed. Last error: ${lastError}` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}