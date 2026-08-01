/**
 * Standalone CV Builder API Server
 * Serves the CV builder static files + handles the AI API
 * without needing the full Next.js dev server.
 *
 * Usage: node cv-builder-server.js
 * Then open: http://localhost:3001/cv-builder/
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3001;
const PUBLIC_DIR = path.join(__dirname, "public");
const CV_BUILDER_DIR = path.join(PUBLIC_DIR, "cv-builder");

// Load .env.local manually
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const GROQ_API_KEY = process.env.GROQ_API_KEY_3;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "groq/compound";
const GROQ_MODEL_FALLBACK = "groq/compound-mini";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function serveStatic(req, res) {
  let urlPath = req.url.split("?")[0];

  // Route /cv-builder to /cv-builder/index.html
  if (urlPath === "/cv-builder" || urlPath === "/cv-builder/") {
    urlPath = "/cv-builder/index.html";
  }

  // Only serve files from public directory
  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(urlPath));

  // Security: prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Internal error");
      return;
    }
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });
}

async function handleAIRequest(req, res) {
  if (!GROQ_API_KEY) {
    sendJSON(res, 500, { error: "GROQ_API_KEY_3 is not configured in .env.local" });
    return;
  }

  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", async () => {
    try {
      const { prompt, cvData } = JSON.parse(body);

      if (!prompt || typeof prompt !== "string") {
        sendJSON(res, 400, { error: "Prompt is required." });
        return;
      }

      const systemPrompt = `You are a professional CV writer and career coach. You write in a warm, natural, human tone — never robotic or generic. You create compelling, concise content that sounds like a real person wrote it. You do NOT output any HTML, CSS, or design code. You only output plain text content.

Rules:
- Write in first person for summaries (e.g., "I am a dedicated...") 
- Write in action-oriented language for experience descriptions
- Keep summaries to 2-3 sentences max
- Keep experience descriptions to 1-2 sentences
- Use natural, conversational language — avoid buzzwords and clichés
- Tailor the tone to the person's actual experience level and field
- Do not use phrases like "passionate about", "results-driven", "team player" — use specific, real language
- Output ONLY the requested text content, no preamble or explanation`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${prompt}\n\nCV Data:\n${JSON.stringify(cvData, null, 2)}` },
      ];

      const payload = {
        model: GROQ_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.8,
      };

      // Try compound, fall back to compound-mini
      let groqRes;
      try {
        groqRes = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback to compound-mini
        payload.model = GROQ_MODEL_FALLBACK;
        groqRes = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.error(`Groq API error: ${groqRes.status} - ${errText}`);
        sendJSON(res, groqRes.status, { error: `AI request failed (${groqRes.status}). Please try again.` });
        return;
      }

      const data = await groqRes.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        sendJSON(res, 200, { content });
      } else {
        sendJSON(res, 500, { error: "AI returned an empty response." });
      }
    } catch (err) {
      console.error("AI handler error:", err);
      sendJSON(res, 500, { error: "Internal server error" });
    }
  });
}

const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  // API route
  if (req.url.startsWith("/api/cv-builder/ai") && req.method === "POST") {
    console.log("  → Matched AI route, handling...");
    await handleAIRequest(req, res);
    return;
  }

  // Static files
  console.log("  → Serving static file");
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  CV Builder Server running at:`);
  console.log(`  → http://localhost:${PORT}/cv-builder/`);
  console.log(`  → AI API: http://localhost:${PORT}/api/cv-builder/ai`);
  if (!GROQ_API_KEY) {
    console.log(`\n  ⚠  GROQ_API_KEY_3 not found in .env.local — AI features won't work.`);
  } else {
    console.log(`  ✓  GROQ_API_KEY_3 loaded — AI features ready.`);
  }
  console.log("");
});
