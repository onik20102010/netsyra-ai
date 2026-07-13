"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RuntimeStatus, SubsystemStatus, RuntimeEvent } from "@/ide/types";

export interface RuntimeEventMessage {
  type: string;
  subsystem?: string;
  payload?: unknown;
  timestamp?: number;
  sessionId?: string;
}

export interface UseRuntimeReturn {
  status: RuntimeStatus | null;
  error: string | null;
  events: RuntimeEventMessage[];
  connected: boolean;
  agentConnected: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  refresh: () => Promise<void>;
  sendAction: (action: string, payload?: unknown) => Promise<void>;
}

const TOKEN_KEY = "netsyra-agent-token";

function getAgentWs(): string {
  if (process.env.NEXT_PUBLIC_AGENT_WS) return process.env.NEXT_PUBLIC_AGENT_WS;
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "wss://localhost:3001";
  }
  return "ws://localhost:3001";
}

function buildAgentUrl(base: string, token: string | null): string {
  if (!token) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

export function useRuntime(): UseRuntimeReturn {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<RuntimeEventMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY) || null;
  });
  const setToken = useCallback((value: string | null) => {
    setTokenState(value);
    if (typeof window === "undefined") return;
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackStartedRef = useRef(false);
  const hasOpenedRef = useRef(false);
  const pendingRef = useRef<Map<string, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>>(new Map());

  const appendEvent = useCallback((evt: RuntimeEventMessage) => {
    setEvents((prev) => [evt, ...prev].slice(0, 250));
  }, []);

  const sendMessage = useCallback((action: string, payload?: unknown): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !hasOpenedRef.current) {
        reject(new Error("Local agent not connected"));
        return;
      }
      const id = crypto.randomUUID();
      pendingRef.current.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, action, payload }));
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      if (hasOpenedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const result = await sendMessage("get-status");
        setStatus(result as RuntimeStatus);
      } else {
        const res = await fetch("/ide/api/runtime");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus((await res.json()) as RuntimeStatus);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [sendMessage]);

  const sendAction = useCallback(async (action: string, payload?: unknown) => {
    try {
      if (hasOpenedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        await sendMessage(action, payload);
      } else {
        const res = await fetch("/ide/api/runtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, payload }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus((await res.json()) as RuntimeStatus);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [sendMessage]);

  const startFallback = useCallback(() => {
    if (fallbackStartedRef.current) return;
    fallbackStartedRef.current = true;

    void refresh();

    const eventSource = new EventSource("/ide/api/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as RuntimeEventMessage;
        setEvents((prev) => [data, ...prev].slice(0, 250));
      } catch {
        setEvents((prev) => [{ type: "raw", payload: msg.data }, ...prev].slice(0, 250));
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      setError("Stream connection error");
    };
  }, [refresh]);

  useEffect(() => {
    if (typeof WebSocket === "undefined") {
      startFallback();
      return;
    }

    const ws = new WebSocket(buildAgentUrl(getAgentWs(), token));
    wsRef.current = ws;

    ws.onopen = () => {
      hasOpenedRef.current = true;
      setConnected(true);
      setAgentConnected(true);
      setError(null);
      void refresh();
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data as string) as {
          type: string;
          id?: string;
          status?: RuntimeStatus;
          event?: { type: string; payload?: unknown; timestamp?: number };
          payload?: unknown;
          result?: unknown;
          error?: string;
        };

        if (data.id && pendingRef.current.has(data.id)) {
          const pending = pendingRef.current.get(data.id)!;
          pendingRef.current.delete(data.id);
          if (data.type === "error") {
            pending.reject(new Error(data.error || "Agent error"));
          } else {
            pending.resolve(data.result ?? data.status ?? null);
          }
          return;
        }

        if (data.type === "status" && data.status) {
          setStatus(data.status);
          return;
        }

        if (data.type === "event" && data.event) {
          const evt: RuntimeEventMessage = {
            type: data.event.type,
            payload: data.event.payload,
            timestamp: data.event.timestamp,
          };
          appendEvent(evt);
          return;
        }

        if (data.type === "terminal") {
          appendEvent({ type: "terminal", payload: data.payload, timestamp: Date.now() });
          return;
        }

        if (data.type === "error") {
          setError(data.error || "Agent error");
        }
      } catch {
        appendEvent({ type: "raw", payload: msg.data, timestamp: Date.now() });
      }
    };

    ws.onerror = () => {
      setConnected(false);
      setAgentConnected(false);
      if (!hasOpenedRef.current && !fallbackStartedRef.current) {
        startFallback();
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setAgentConnected(false);
      wsRef.current = null;
      if (!hasOpenedRef.current && !fallbackStartedRef.current) {
        startFallback();
      }
    };

    return () => {
      ws.close();
      eventSourceRef.current?.close();
      wsRef.current = null;
      eventSourceRef.current = null;
      hasOpenedRef.current = false;
      fallbackStartedRef.current = false;
    };
  }, [refresh, startFallback, appendEvent, token]);

  return { status, error, events, connected, agentConnected, token, setToken, refresh, sendAction };
}

export function useSubsystems(status: RuntimeStatus | null): SubsystemStatus[] {
  return status?.subsystems ?? [];
}
