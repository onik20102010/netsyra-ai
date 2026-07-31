#!/usr/bin/env node
/**
 * Netsyra Local Bridge
 *
 * This script runs a WebSocket server on YOUR machine (localhost:19823).
 * It allows the Netsyra web IDE to display a real terminal that executes
 * commands on YOUR computer — not on the Netsyra server.
 *
 * SECURITY:
 * - Only listens on 127.0.0.1 (localhost) — not accessible from the internet
 * - No commands run on any remote server
 * - You have full control — kill this process anytime to disconnect
 *
 * Prerequisites:
 *   npm install ws
 *
 * Usage:
 *   node netsyra-bridge.js
 *
 * Then open https://www.netsyraai.com/ide and switch to the "Local" terminal tab.
 */

const { WebSocketServer } = require("ws");
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
const https = require("https");

const PORT = 19823;
const HOST = "127.0.0.1";

// Check if user wants HTTPS/WSS (for HTTPS IDE pages)
const USE_HTTPS = process.argv.includes("--https") || process.argv.includes("-s");

let wss;
if (USE_HTTPS) {
  // Generate self-signed certificate if not exists
  const certDir = path.join(__dirname, ".cert");
  const keyPath = path.join(certDir, "key.pem");
  const certPath = path.join(certDir, "cert.pem");

  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log("\n  Generating self-signed certificate for WSS...");
    const { execSync } = require("child_process");
    try {
      execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`, { stdio: "inherit" });
      console.log("  Certificate generated.\n");
    } catch (e) {
      console.error("  Failed to generate certificate. OpenSSL not found or error occurred.");
      console.log("  Falling back to WS (unencrypted)...\n");
      wss = new WebSocketServer({ host: HOST, port: PORT });
    }
  }

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const server = https.createServer({
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    });
    wss = new WebSocketServer({ server });
    server.listen(PORT, HOST, () => {
      console.log(`\n  ╔═══════════════════════════════════════════════╗`);
      console.log(`  ║  Netsyra Local Bridge (WSS/HTTPS)           ║`);
      console.log(`  ║  Listening on wss://${HOST}:${PORT}            ║`);
      console.log(`  ║                                               ║`);
      console.log(`  ║  Open https://www.netsyraai.com/ide            ║`);
      console.log(`  ║  and use the "Local" terminal tab.             ║`);
      console.log(`  ║                                               ║`);
      console.log(`  ║  Note: Your browser may show a security       ║`);
      console.log(`  ║  warning for the self-signed certificate.     ║`);
      console.log(`  ║  This is normal — proceed anyway.              ║`);
      console.log(`  ║                                               ║`);
      console.log(`  ║  Press Ctrl+C to stop.                         ║`);
      console.log(`  ╚═══════════════════════════════════════════════╝\n`);
    });
  }
} else {
  wss = new WebSocketServer({ host: HOST, port: PORT });
  console.log(`\n  ╔═══════════════════════════════════════════════╗`);
  console.log(`  ║  Netsyra Local Bridge (WS)                    ║`);
  console.log(`  ║  Listening on ws://${HOST}:${PORT}              ║`);
  console.log(`  ║                                               ║`);
  console.log(`  ║  IMPORTANT: If the IDE is on HTTPS, run with:  ║`);
  console.log(`  ║  node netsyra-bridge.js --https                ║`);
  console.log(`  ║                                               ║`);
  console.log(`  ║  Or access the IDE via http://localhost        ║`);
  console.log(`  ║  instead of https://www.netsyraai.com          ║`);
  console.log(`  ║                                               ║`);
  console.log(`  ║  Press Ctrl+C to stop.                         ║`);
  console.log(`  ╚═══════════════════════════════════════════════╝\n`);
}

wss.on("connection", (ws) => {
  const isWindows = os.platform() === "win32";
  const shellCmd = isWindows ? "cmd.exe" : process.env.SHELL || "/bin/bash";
  const args = isWindows ? ["/k"] : ["-i"];

  console.log(`[Bridge] Client connected — spawning ${shellCmd}`);

  let shell;
  try {
    shell = spawn(shellCmd, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: "xterm-256color",
        FORCE_COLOR: "1",
        COLORTERM: "truecolor",
      },
      shell: false,
    });
  } catch (err) {
    ws.send(JSON.stringify({ type: "data", data: `\r\nFailed to start shell: ${err.message}\r\n` }));
    ws.close();
    return;
  }

  shell.stdout.on("data", (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "data", data: data.toString() }));
    }
  });

  shell.stderr.on("data", (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "data", data: data.toString() }));
    }
  });

  shell.on("exit", (code) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "exit", code: code ?? 0 }));
      ws.close();
    }
    console.log(`[Bridge] Shell exited with code ${code}`);
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "input" && shell.stdin.writable) {
        shell.stdin.write(msg.data);
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on("close", () => {
    console.log("[Bridge] Client disconnected — killing shell");
    try { shell.kill("SIGTERM"); } catch {}
  });

  ws.on("error", () => {
    try { shell.kill("SIGTERM"); } catch {}
  });
});

wss.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Error: Port ${PORT} is already in use.`);
    console.error(`  Another Netsyra Bridge may already be running.\n`);
  } else {
    console.error(`\n  Bridge error: ${err.message}\n`);
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\n  Shutting down Netsyra Bridge...");
  wss.close();
  process.exit(0);
});
