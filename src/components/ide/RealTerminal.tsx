// d:\netsyra\src\components\ide\RealTerminal.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface RealTerminalProps {
  sessionId: string | null;
  onReady?: () => void;
}

const BRIDGE_PORT = 19823;
const BRIDGE_URL = `ws://localhost:${BRIDGE_PORT}`;

/**
 * A real interactive terminal backed by xterm.js on the client.
 *
 * SECURITY: This terminal connects to a LOCAL WebSocket bridge running on
 * the USER'S OWN MACHINE (ws://localhost:19823). No shell processes run on
 * the Netsyra server. The user must run the `netsyra-bridge` script locally
 * to enable this terminal.
 *
 * Flow:
 *   1. On mount, try to connect to ws://localhost:19823
 *   2. If connected, pipe xterm input → WebSocket → user's shell
 *   3. Pipe user's shell output → WebSocket → xterm display
 *   4. If connection fails, show instructions to start the bridge
 */
export function RealTerminal({ sessionId: externalSessionId }: RealTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: "bar",
      allowProposedApi: true,
      theme: {
        background: "#0d1117",
        foreground: "#e6edf3",
        cursor: "#34e8bb",
        cursorAccent: "#0d1117",
        selectionBackground: "#264f78",
        black: "#484f58",
        red: "#f85149",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#b1bac4",
        brightBlack: "#6e7681",
        brightRed: "#ff7b72",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    try { fit.fit(); } catch {}

    termRef.current = term;
    fitRef.current = fit;

    // --- Try to connect to the local bridge ---
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      let ws: WebSocket;
      try {
        ws = new WebSocket(BRIDGE_URL);
      } catch {
        setError("Cannot connect to local bridge");
        setShowInstructions(true);
        term.writeln("\x1b[33mNetsyra Local Bridge not detected.\x1b[0m");
        term.writeln("");
        term.writeln("To use a real terminal connected to YOUR machine:");
        term.writeln("");
        term.writeln("  1. Download netsyra-bridge.js from the settings panel");
        term.writeln("  2. Run it in your terminal:  \x1b[32mnode netsyra-bridge.js\x1b[0m");
        term.writeln("  3. Click the terminal area to reconnect");
        term.writeln("");
        term.writeln("Or use \x1b[36mSimulated\x1b[0m mode for in-browser commands.");
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setError(null);
        setShowInstructions(false);
        setReady(true);
        term.clear();
        term.writeln("\x1b[32m✓ Connected to your local machine via Netsyra Bridge\x1b[0m");
        term.writeln("");
        term.focus();
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "data") {
            term.write(msg.data);
          } else if (msg.type === "exit") {
            term.writeln(`\r\n\x1b[33m[Process exited with code ${msg.code}]\x1b[0m`);
          }
        } catch {
          // If not JSON, write raw data
          term.write(event.data);
        }
      };

      ws.onerror = () => {
        if (disposed) return;
        setError("Local bridge connection failed");
        setShowInstructions(true);
        setReady(false);
      };

      ws.onclose = () => {
        if (disposed) return;
        setReady(false);
        // Try to reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    // --- Pipe user input to the local bridge ---
    const inputDisposable = term.onData((data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "input", data }));
      }
    });

    connect();

    // --- Resize handling ---
    const resizeObserver = new ResizeObserver(() => {
      try { fitRef.current?.fit(); } catch {}
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      disposed = true;
      inputDisposable.dispose();
      resizeObserver.disconnect();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      term.dispose();
    };
  }, []);

  // --- Handle window resize ---
  useEffect(() => {
    const onResize = () => {
      try { fitRef.current?.fit(); } catch {}
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- Reconnect button ---
  const handleReconnect = () => {
    setError(null);
    setShowInstructions(false);
    if (termRef.current) {
      termRef.current.clear();
      termRef.current.writeln("\x1b[36mReconnecting to local bridge...\x1b[0m");
    }
    // Trigger reconnect by reloading
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  if (showInstructions) {
    return (
      <div className="flex flex-col h-full bg-[#0d1117] items-center justify-center text-[13px] gap-3 p-6">
        <div className="text-[#d29922] font-medium">Local Bridge Required</div>
        <div className="text-[#8b949e] text-center max-w-md text-[12px] leading-relaxed">
          The real terminal connects to <span className="text-[#34e8bb]">your own machine</span> via a local bridge.
          <br />
          No commands run on the Netsyra server — everything runs locally on your computer.
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded p-3 text-[12px] text-[#8b949e] font-mono max-w-md">
          <div className="text-[#6e7681] mb-1"># Download and run the bridge:</div>
          <div className="text-[#34e8bb]">npx netsyra-bridge</div>
          <div className="text-[#6e7681] mt-1"># or</div>
          <div className="text-[#34e8bb]">node netsyra-bridge.js</div>
        </div>
        <button
          onClick={handleReconnect}
          className="px-3 py-1.5 bg-[#34e8bb]/10 text-[#34e8bb] hover:bg-[#34e8bb]/20 border border-[#34e8bb]/30 rounded text-[12px] transition-colors"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      <div ref={containerRef} className="flex-1 overflow-hidden min-h-0 px-1 py-1" />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#6e7681] pointer-events-none">
          Connecting to local bridge...
        </div>
      )}
    </div>
  );
}
