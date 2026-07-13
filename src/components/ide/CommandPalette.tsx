"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  PanelLeft,
  PanelBottom,
  Activity,
  Play,
  RotateCcw,
  Square,
  Zap,
  Sun,
  Moon,
  FileCode,
  FolderOpen,
  Save,
  Cpu,
  X,
} from "lucide-react";

type CommandCategory = "View" | "AI & Runtime" | "Workspace" | "System" | "Recent";

interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  category: CommandCategory;
}

const commands: PaletteCommand[] = [
  { id: "quick-open", label: "Quick Open", shortcut: "⌘P", icon: <Search size={14} />, category: "View" },
  { id: "command-palette", label: "Command Palette", shortcut: "⌘K", icon: <Command size={14} />, category: "View" },
  { id: "toggle-sidebar", label: "Toggle Sidebar", shortcut: "⌘B", icon: <PanelLeft size={14} />, category: "View" },
  { id: "toggle-panel", label: "Toggle Bottom Panel", shortcut: "⌘J", icon: <PanelBottom size={14} />, category: "View" },
  { id: "toggle-runtime", label: "Open Runtime Panel", shortcut: "", icon: <Activity size={14} />, category: "AI & Runtime" },
  { id: "toggle-chat", label: "Open AI Chat", shortcut: "", icon: <Zap size={14} />, category: "AI & Runtime" },
  { id: "boot-runtime", label: "Boot Runtime Kernel", shortcut: "", icon: <Play size={14} />, category: "AI & Runtime" },
  { id: "restart-runtime", label: "Restart Runtime Kernel", shortcut: "", icon: <RotateCcw size={14} />, category: "AI & Runtime" },
  { id: "shutdown-runtime", label: "Shutdown Runtime Kernel", shortcut: "", icon: <Square size={14} />, category: "AI & Runtime" },
  { id: "open-file", label: "Open File", shortcut: "", icon: <FileCode size={14} />, category: "Workspace" },
  { id: "open-folder", label: "Open Folder", shortcut: "", icon: <FolderOpen size={14} />, category: "Workspace" },
  { id: "save", label: "Save", shortcut: "⌘S", icon: <Save size={14} />, category: "Workspace" },
  { id: "theme-light", label: "Switch to Light Theme", shortcut: "", icon: <Sun size={14} />, category: "System" },
  { id: "theme-dark", label: "Switch to Dark Theme", shortcut: "", icon: <Moon size={14} />, category: "System" },
  { id: "reload-window", label: "Reload Window", shortcut: "", icon: <Cpu size={14} />, category: "System" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q === "" ? commands : commands.filter((c) => c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    const recentCmds = recent
      .map((id) => commands.find((c) => c.id === id))
      .filter((c): c is PaletteCommand => Boolean(c))
      .map((c) => ({ ...c, category: "Recent" as CommandCategory }));
    const rest = base.filter((c) => !recent.includes(c.id));
    return q === "" ? [...recentCmds, ...rest] : [...recentCmds, ...rest];
  }, [query, recent]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filtered.length);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const cmd = filtered[selectedIndex];
          if (cmd) execute(cmd);
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open, onClose, filtered, selectedIndex]);

  const execute = (cmd: PaletteCommand) => {
    setRecent((prev) => [cmd.id, ...prev.filter((id) => id !== cmd.id)].slice(0, 5));
    onSelect(cmd.id);
    onClose();
  };

  const grouped = useMemo(() => {
    const map = new Map<CommandCategory, PaletteCommand[]>();
    filtered.forEach((c) => {
      if (!map.has(c.category)) map.set(c.category, []);
      map.get(c.category)!.push(c);
    });
    return map;
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-ide-command-palette flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="w-full max-w-2xl bg-ide-bg-elevated border border-ide-border rounded-lg shadow-ide-xl overflow-hidden flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 h-12 border-b border-ide-border shrink-0">
              <Command size={16} className="text-ide-foreground-dim" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Type a command or search files..."
                className="flex-1 bg-transparent text-ide-foreground text-ide-md placeholder:text-ide-foreground-dim focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-ide-foreground-dim hover:text-ide-foreground transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto ide-scroll py-1">
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-ide-sm text-ide-foreground-dim text-center">No matching commands</div>
              )}
              {Array.from(grouped.entries()).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-3 py-1 text-ide-xs font-medium uppercase tracking-wide text-ide-foreground-dim">{category}</div>
                  {cmds.map((cmd, idx) => {
                    const absoluteIndex = filtered.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => execute(cmd)}
                        onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-ide-sm text-ide-foreground transition-colors ${
                          absoluteIndex === selectedIndex ? "bg-ide-surface-active" : "hover:bg-ide-surface-hover"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-ide-foreground-dim">{cmd.icon}</span>
                          <span>{cmd.label}</span>
                        </div>
                        {cmd.shortcut && <span className="text-ide-foreground-dim text-ide-xs px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border">{cmd.shortcut}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-3 h-8 border-t border-ide-border bg-ide-surface text-ide-xs text-ide-foreground-dim shrink-0">
              <div className="flex items-center gap-3">
                <span>↑↓ to navigate</span>
                <span>↵ to run</span>
                <span>esc to close</span>
              </div>
              <span>{filtered.length} commands</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
