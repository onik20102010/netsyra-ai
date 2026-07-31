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
 *   npm install ws selfsigned
 *
 * Usage (for HTTP IDE pages):
 *   node netsyra-bridge.js
 *
 * Usage (for HTTPS IDE pages — e.g. https://www.netsyraai.com):
 *   node netsyra-bridge.js --https
 *
 * Then open the Netsyra IDE and switch to the "Local" terminal tab.
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

async function startWSS() {
  const certDir = path.join(__dirname, ".cert");
  const keyPath = path.join(certDir, "key.pem");
  const certPath = path.join(certDir, "cert.pem");

  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  // Generate self-signed cert if not exists (pure JS, works on all platforms)
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log("\n  Generating self-signed certificate for WSS...");
    try {
      const selfsigned = require("selfsigned");
      const pems = await selfsigned.generate(
        [{ name: "commonName", value: "localhost" }],
        {
          keySize: 2048,
          algorithm: "sha256",
          extensions: [
            { name: "basicConstraints", cA: false },
            { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
            { name: "extKeyUsage", serverAuth: true },
            {
              name: "subjectAltName",
              altNames: [
                { type: 2, value: "localhost" },
                { type: 7, ip: "127.0.0.1" },
              ],
            },
          ],
        }
      );
      fs.writeFileSync(keyPath, pems.private);
      fs.writeFileSync(certPath, pems.cert);
      console.log("  Certificate generated.\n");
    } catch (e) {
      console.error("  Failed to generate certificate: " + e.message);
      console.log("  Make sure you ran: npm install selfsigned");
      console.log("  Falling back to WS (unencrypted)...\n");
      return false;
    }
  }

  const server = https.createServer({
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  });
  wss = new WebSocketServer({ server });
  server.listen(PORT, HOST, () => {
    console.log(`\n  +-----------------------------------------------+`);
    console.log(`  |  Netsyra Local Bridge (WSS / Secure)         |`);
    console.log(`  |  Listening on wss://${HOST}:${PORT}            |`);
    console.log(`  |                                               |`);
    console.log(`  |  Open the Netsyra IDE and use the             |`);
    console.log(`  |  "Local" terminal tab.                        |`);
    console.log(`  |                                               |`);
    console.log(`  |  NOTE: First time? Open this URL in your      |`);
    console.log(`  |  browser and accept the certificate:          |`);
    console.log(`  |  https://localhost:19823                      |`);
    console.log(`  |                                               |`);
    console.log(`  |  Press Ctrl+C to stop.                        |`);
    console.log(`  +-----------------------------------------------+\n`);
  });
  return true;
}

function startWS() {
  wss = new WebSocketServer({ host: HOST, port: PORT });
  console.log(`\n  +-----------------------------------------------+`);
  console.log(`  |  Netsyra Local Bridge (WS)                    |`);
  console.log(`  |  Listening on ws://${HOST}:${PORT}              |`);
  console.log(`  |                                               |`);
  console.log(`  |  If the IDE is on HTTPS, stop and run:        |`);
  console.log(`  |  node netsyra-bridge.js --https               |`);
  console.log(`  |                                               |`);
  console.log(`  |  Press Ctrl+C to stop.                        |`);
  console.log(`  +-----------------------------------------------+\n`);
}

if (USE_HTTPS) {
  startWSS().then((ok) => {
    if (!ok) {
      startWS();
      setupConnectionHandler();
    } else {
      setupConnectionHandler();
    }
  });
} else {
  startWS();
  setupConnectionHandler();
}

function setupConnectionHandler() {
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
}

process.on("SIGINT", () => {
  console.log("\n  Shutting down Netsyra Bridge...");
  wss.close();
  process.exit(0);
});
