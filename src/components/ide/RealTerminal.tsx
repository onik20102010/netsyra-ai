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

/**
 * A real interactive terminal backed by xterm.js on the client and a
 * persistent shell process on the server (via /api/ide/terminal).
 *
 * Flow:
 *   1. On mount, POST to /api/ide/terminal?action=create to spawn a shell.
 *   2. Open a streaming GET connection to receive stdout/stderr.
 *   3. Pipe xterm user input to POST /api/ide/terminal?action=input.
 */
export function RealTerminal({ sessionId: externalSessionId }: RealTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionRef = useRef<string | null>(externalSessionId || null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Initialize xterm + session ---
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

    // --- Create or attach to a session ---
    const initSession = async () => {
      try {
        let id = sessionRef.current;
        if (!id) {
          const res = await fetch("/api/ide/terminal?action=create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cwd: "D:\\netsyra" }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          id = data.id;
          sessionRef.current = id;
        }

        // --- Pipe user input to the shell ---
        const inputDisposable = term.onData((data) => {
          fetch("/api/ide/terminal?action=input", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, data }),
          }).catch((e) => console.error("terminal input error:", e));
        });

        // --- Stream output from the shell ---
        const controller = new AbortController();
        streamAbortRef.current = controller;
        const streamRes = await fetch(`/api/ide/terminal?id=${id}`, {
          method: "GET",
          signal: controller.signal,
        });
        if (!streamRes.ok || !streamRes.body) throw new Error(`Stream HTTP ${streamRes.status}`);

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const raw of lines) {
              if (!raw.trim()) continue;
              try {
                const msg = JSON.parse(raw);
                if (msg.type === "data") {
                  term.write(msg.data);
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        };
        pump().catch((e) => {
          if (e.name !== "AbortError") console.error("terminal stream error:", e);
        });

        setReady(true);
        term.focus();

        // Cleanup on unmount
        return () => {
          inputDisposable.dispose();
          controller.abort();
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        term.writeln(`\r\n\x1b[31mFailed to initialize terminal: ${message}\x1b[0m`);
      }
    };

    let cleanup: (() => void) | undefined;
    initSession().then((c) => { cleanup = c; });

    // --- Resize handling ---
    const resizeObserver = new ResizeObserver(() => {
      try { fitRef.current?.fit(); } catch {}
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cleanup?.();
      resizeObserver.disconnect();
      streamAbortRef.current?.abort();
      term.dispose();
      // Kill the session on unmount
      const id = sessionRef.current;
      if (id) {
        fetch(`/api/ide/terminal?id=${id}`, { method: "DELETE" }).catch(() => {});
      }
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

  if (error) {
    return (
      <div className="flex flex-col h-full bg-[#0d1117] items-center justify-center text-[13px] text-[#f85149] gap-2 p-4">
        <div>Terminal error: {error}</div>
        <div className="text-[11px] text-[#6e7681]">The server-side shell bridge may not be available.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      <div ref={containerRef} className="flex-1 overflow-hidden min-h-0 px-1 py-1" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#6e7681] pointer-events-none">
          Initializing terminal...
        </div>
      )}
    </div>
  );
}
