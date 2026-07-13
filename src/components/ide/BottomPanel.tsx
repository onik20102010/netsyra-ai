"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon, List, AlertCircle, Zap, ChevronRight, X, Plus, Search, PanelRight } from "lucide-react";
import { type RuntimeEventMessage } from "@/hooks/useRuntime";
import { ResizableSplit } from "./ResizableSplit";

export type BottomTab = "terminal" | "output" | "problems" | "debug";

interface BottomPanelProps {
  active: BottomTab;
  onSelect: (t: BottomTab) => void;
  events: RuntimeEventMessage[];
  sendAction?: (action: string, payload?: unknown) => Promise<void>;
}

interface Terminal {
  id: string;
  name: string;
  history: string[];
  input: string;
  cmdId?: string;
  isRunning: boolean;
}

const initialTerminals: Terminal[] = [
  {
    id: "1",
    name: "bash",
    history: ["$ netsyra runtime --start", "Runtime kernel booted successfully.", "$"],
    input: "",
    isRunning: false,
  },
];

const terminalResponses: Record<string, string> = {
  help: "Available commands: boot, restart, shutdown, status, clear, help",
  boot: "Booting runtime kernel... done",
  restart: "Restarting runtime kernel... done",
  shutdown: "Shutting down runtime kernel... done",
  status: "Runtime is healthy. 8 subsystems online.",
  clear: "__clear__",
};

function TerminalView({
  terminal,
  onInputChange,
  onRun,
  onStop,
}: {
  terminal: Terminal;
  onInputChange: (value: string) => void;
  onRun: () => void;
  onStop: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [terminal.history]);

  return (
    <div className="flex flex-col h-full p-2 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto ide-scroll space-y-0.5">
        {terminal.history.map((line, i) => (
          <div key={i} className={`${line.startsWith("$") ? "text-ide-foreground-dim" : line.startsWith("Runtime") ? "text-ide-success" : "text-ide-foreground"} whitespace-pre-wrap`}>
            {line}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); onRun(); }}
        className="flex items-center gap-2 mt-1 pt-1 border-t border-ide-border"
      >
        <span className="text-ide-foreground-dim">$</span>
        <input
          value={terminal.input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={terminal.isRunning}
          className="flex-1 bg-transparent text-ide-foreground text-ide-sm focus:outline-none disabled:opacity-50"
          placeholder="Type a command..."
        />
        {terminal.isRunning && (
          <button
            type="button"
            onClick={onStop}
            className="px-2 py-0.5 bg-ide-error text-ide-error-foreground rounded text-ide-xs hover:bg-ide-error/80"
          >
            Stop
          </button>
        )}
      </form>
    </div>
  );
}

function TerminalPanel({ events, sendAction }: { events: RuntimeEventMessage[]; sendAction?: (action: string, payload?: unknown) => Promise<void> }) {
  const [terminals, setTerminals] = useState<Terminal[]>(initialTerminals);
  const [activeId, setActiveId] = useState("1");
  const [nextId, setNextId] = useState(2);
  const [split, setSplit] = useState(false);
  const [secondaryId, setSecondaryId] = useState<string | null>(null);
  const processedKeys = useRef<Set<string>>(new Set());

  const active = terminals.find((t) => t.id === activeId) ?? terminals[0];
  const secondary = terminals.find((t) => t.id === secondaryId) ?? active;

  useEffect(() => {
    for (const evt of events) {
      const key = `${evt.type}-${evt.timestamp}-${JSON.stringify(evt.payload)}`;
      if (processedKeys.current.has(key)) continue;
      processedKeys.current.add(key);

      if (evt.type !== "terminal") continue;
      const p = (evt.payload ?? {}) as { id?: string; output?: string; done?: boolean };
      if (!p.id || p.output === undefined) continue;

      setTerminals((prev) =>
        prev.map((t) => {
          if (t.cmdId !== p.id) return t;
          const newHistory = [...t.history, p.output ?? ""];
          const next: Terminal = { ...t, history: newHistory };
          if (p.done) {
            next.isRunning = false;
            next.cmdId = undefined;
            next.history = [...newHistory, "$"];
          }
          return next;
        })
      );
    }
  }, [events]);

  const run = (id: string) => {
    const terminal = terminals.find((t) => t.id === id);
    if (!terminal || terminal.isRunning) return;
    const cmd = terminal.input.trim();
    if (!cmd) return;

    if (!sendAction) {
      setTerminals((prev) =>
        prev.map((t) => (t.id === id ? { ...t, history: [...t.history, `$ ${cmd}`, "Runtime not connected", "$"], input: "", isRunning: false } : t))
      );
      return;
    }

    const parts = cmd.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    const cmdId = crypto.randomUUID();

    setTerminals((prev) =>
      prev.map((t) => (t.id === id ? { ...t, history: [...t.history, `$ ${cmd}`], input: "", cmdId, isRunning: true } : t))
    );

    void sendAction("run-command", { command, args, cwd: ".", id: cmdId });
  };

  const stop = (id: string) => {
    const terminal = terminals.find((t) => t.id === id);
    if (!terminal?.cmdId || !sendAction) return;
    void sendAction("stop-command", { id: terminal.cmdId });
    setTerminals((prev) => prev.map((t) => (t.id === id ? { ...t, isRunning: false, cmdId: undefined } : t)));
  };

  const addTerminal = () => {
    const id = String(nextId);
    setTerminals((prev) => [...prev, { id, name: `bash ${prev.length + 1}`, history: ["$"], input: "", isRunning: false }]);
    setActiveId(id);
    setNextId((n) => n + 1);
  };

  const closeTerminal = (id: string) => {
    if (terminals.length <= 1) return;
    setTerminals((prev) => {
      const next = prev.filter((t) => t.id !== id);
      const newActive = next[next.length - 1];
      if (activeId === id) {
        setActiveId(newActive.id);
      }
      if (secondaryId === id) {
        setSecondaryId(null);
      }
      return next;
    });
  };

  const toggleSplit = () => {
    setSplit((s) => {
      const next = !s;
      if (next && !secondaryId) {
        setSecondaryId(activeId);
      }
      return next;
    });
  };

  const updateInput = (id: string, value: string) => {
    setTerminals((prev) => prev.map((t) => (t.id === id ? { ...t, input: value } : t)));
  };

  const activeView = (
    <TerminalView
      terminal={active}
      onInputChange={(value) => updateInput(active.id, value)}
      onRun={() => run(active.id)}
      onStop={() => stop(active.id)}
    />
  );

  return (
    <div className="flex flex-col h-full bg-ide-bg font-mono text-ide-sm">
      <div className="flex items-center h-8 bg-ide-surface border-b border-ide-border overflow-x-auto ide-scroll">
        {terminals.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`group flex items-center gap-1.5 px-3 h-full border-r border-ide-border text-ide-xs transition-colors ${
              activeId === t.id
                ? "bg-ide-bg text-ide-foreground border-t-2 border-t-ide-primary"
                : "text-ide-foreground-muted hover:bg-ide-bg hover:text-ide-foreground"
            }`}
          >
            <TerminalIcon size={12} />
            <span className="flex-1 truncate">{t.name}</span>
            {terminals.length > 1 && (
              <X
                size={10}
                onClick={(e) => { e.stopPropagation(); closeTerminal(t.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-ide-error text-ide-foreground-dim transition-opacity"
              />
            )}
          </button>
        ))}
        <button
          onClick={addTerminal}
          className="flex items-center justify-center h-8 w-8 text-ide-foreground-dim hover:text-ide-foreground hover:bg-ide-bg transition-colors"
          title="New terminal"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={toggleSplit}
          className={`flex items-center justify-center h-8 w-8 transition-colors ${
            split ? "text-ide-primary bg-ide-primary/10" : "text-ide-foreground-dim hover:text-ide-foreground hover:bg-ide-bg"
          }`}
          title="Split terminal"
        >
          <PanelRight size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {split ? (
          <ResizableSplit
            direction="horizontal"
            defaultSplit={50}
            minFirst={20}
            minSecond={20}
            firstPanelName="Primary"
            secondPanelName="Secondary"
            first={activeView}
            second={
              <TerminalView
                terminal={secondary}
                onInputChange={(value) => updateInput(secondary.id, value)}
                onRun={() => run(secondary.id)}
                onStop={() => stop(secondary.id)}
              />
            }
          />
        ) : (
          activeView
        )}
      </div>
    </div>
  );
}

function OutputPanel({ events }: { events: RuntimeEventMessage[] }) {
  const [filter, setFilter] = useState("");
  const filtered = events.filter((evt) => evt.type.toLowerCase().includes(filter.toLowerCase()) || JSON.stringify(evt.payload).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-ide-bg p-2 text-ide-foreground overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Search size={12} className="text-ide-foreground-dim" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter output..."
          className="flex-1 bg-ide-surface border border-ide-border rounded px-2 py-0.5 text-ide-xs text-ide-foreground placeholder:text-ide-foreground-dim focus:outline-none focus:border-ide-primary"
        />
      </div>
      <div className="flex-1 overflow-y-auto ide-scroll font-mono text-ide-xs space-y-1">
        {filtered.length === 0 && <span className="text-ide-foreground-dim">No output.</span>}
        {filtered.slice(0, 100).map((evt, i) => (
          <div key={i} className="flex items-start gap-2 py-1 border-b border-ide-border-subtle/50">
            <span className="text-ide-foreground-dim shrink-0">[{new Date(evt.timestamp ?? Date.now()).toLocaleTimeString()}]</span>
            <span className="text-ide-accent shrink-0">{evt.type}</span>
            <span className="text-ide-foreground truncate">{JSON.stringify(evt.payload)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemsPanel({ events }: { events: RuntimeEventMessage[] }) {
  const errors = events.filter((e) => (e.payload as { level?: string })?.level === "error" || e.type.toLowerCase().includes("error"));
  return (
    <div className="flex flex-col h-full bg-ide-bg p-2 text-ide-sm text-ide-foreground-dim overflow-y-auto ide-scroll">
      {errors.length === 0 ? (
        <div className="flex items-center gap-2 text-ide-success">
          <AlertCircle size={14} /> No problems detected.
        </div>
      ) : (
        errors.slice(0, 50).map((e, i) => (
          <div key={i} className="flex items-center gap-2 py-1 text-ide-error border-b border-ide-border-subtle/50">
            <AlertCircle size={14} />
            <span className="truncate">{e.type}: {JSON.stringify(e.payload)}</span>
          </div>
        ))
      )}
    </div>
  );
}

function DebugPanel({ events }: { events: RuntimeEventMessage[] }) {
  return (
    <div className="flex flex-col h-full bg-ide-bg p-2 text-ide-sm text-ide-foreground-dim overflow-y-auto ide-scroll">
      <div className="flex items-center gap-2 text-ide-foreground mb-2">
        <Zap size={14} /> Debug console is ready. {events.length} events received.
      </div>
      <div className="font-mono text-ide-xs space-y-1">
        {events.slice(0, 30).map((evt, i) => (
          <div key={i} className="flex items-center gap-2 text-ide-foreground-dim">
            <ChevronRight size={10} />
            <span>{evt.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const bottomTabs: { id: BottomTab; label: string; icon: React.ReactNode }[] = [
  { id: "terminal", label: "Terminal", icon: <TerminalIcon size={12} /> },
  { id: "output", label: "Output", icon: <List size={12} /> },
  { id: "problems", label: "Problems", icon: <AlertCircle size={12} /> },
  { id: "debug", label: "Debug Console", icon: <Zap size={12} /> },
];

export function BottomPanel({ active, onSelect, events, sendAction }: BottomPanelProps) {
  return (
    <div className="flex flex-col h-full bg-ide-bg border-t border-ide-border">
      <div className="flex items-center h-8 bg-ide-surface border-b border-ide-border">
        {bottomTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex items-center gap-1.5 px-3 h-full text-ide-xs transition-colors border-r border-ide-border ${
              active === tab.id
                ? "bg-ide-bg text-ide-foreground border-t-2 border-t-ide-primary"
                : "text-ide-foreground-muted hover:text-ide-foreground hover:bg-ide-bg"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.12 }}
            className="h-full"
          >
            {active === "terminal" && <TerminalPanel events={events} sendAction={sendAction} />}
            {active === "output" && <OutputPanel events={events} />}
            {active === "problems" && <ProblemsPanel events={events} />}
            {active === "debug" && <DebugPanel events={events} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
