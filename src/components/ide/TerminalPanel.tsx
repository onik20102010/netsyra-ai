"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useIdeStore } from "@/ide";
import type { FileItem } from "@/ide/types";
import { ChevronDown, Terminal as TerminalIcon, Globe } from "lucide-react";
import { RealTerminal } from "./RealTerminal";

interface TerminalLine {
  type: "input" | "output" | "error" | "system" | "success" | "path" | "dim";
  content: string;
}

type TerminalMode = "real" | "mock";

export function TerminalPanel() {
  // "real" = xterm.js + local bridge (user's machine); "mock" = in-browser simulated terminal
  const [mode, setMode] = useState<TerminalMode>("mock");

  const workspace = useIdeStore((s) => s.workspace);
  const openFiles = useIdeStore((s) => s.openFiles);
  const openFile = useIdeStore((s) => s.openFile);

  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "system", content: "Netsyra Web IDE Terminal" },
    { type: "system", content: 'Type "help" to see available commands.' },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState("~/workspace");

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Track scroll position
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 30;
    setIsAtBottom(atBottom);
  };

  // Auto-scroll to bottom on new lines only if user is already at bottom
  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, isAtBottom]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setIsAtBottom(true);
    }
  };

  // Focus input on click anywhere in terminal
  const focusInput = () => inputRef.current?.focus();

  // Update cwd when workspace changes
  useEffect(() => {
    if (workspace) {
      setCwd(`~/${workspace.name}`);
    }
  }, [workspace]);

  // --- Command helpers ---

  const flattenFiles = useCallback((items: FileItem[], prefix = ""): FileItem[] => {
    const result: FileItem[] = [];
    for (const item of items) {
      result.push({ ...item, path: prefix + item.name });
      if (item.isDirectory && item.children) {
        result.push(...flattenFiles(item.children, prefix + item.name + "/"));
      }
    }
    return result;
  }, []);

  const findInWorkspace = useCallback(
    (path: string): FileItem | null => {
      if (!workspace) return null;
      const search = (items: FileItem[]): FileItem | null => {
        for (const item of items) {
          if (item.path === path) return item;
          if (item.isDirectory && item.children) {
            const found = search(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      return search(workspace.files);
    },
    [workspace]
  );

  const getPackageJson = useCallback((): Record<string, any> | null => {
    if (!workspace) return null;
    const pkgFile = findInWorkspace("package.json");
    if (pkgFile?.content) {
      try {
        return JSON.parse(pkgFile.content);
      } catch {
        return null;
      }
    }
    return null;
  }, [workspace, findInWorkspace]);

  // --- Command execution ---

  const executeCommand = useCallback(
    (cmd: string): TerminalLine[] => {
      const trimmed = cmd.trim();
      if (!trimmed) return [];

      const parts = trimmed.split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);
      const output: TerminalLine[] = [];

      switch (command) {
        case "help":
          output.push({ type: "system", content: "Available commands:" });
          output.push({ type: "dim", content: "  ls [path]          List files in directory" });
          output.push({ type: "dim", content: "  pwd                Print working directory" });
          output.push({ type: "dim", content: "  cat <file>         Print file contents" });
          output.push({ type: "dim", content: "  echo <text>        Print text" });
          output.push({ type: "dim", content: "  npm run <script>   Run an npm script" });
          output.push({ type: "dim", content: "  npm install        Install dependencies" });
          output.push({ type: "dim", content: "  grep <pattern> <f> Search in file" });
          output.push({ type: "dim", content: "  find <name>        Find files by name" });
          output.push({ type: "dim", content: "  head <file> [n]    Print first n lines" });
          output.push({ type: "dim", content: "  wc <file>          Count lines/words" });
          output.push({ type: "dim", content: "  tree               Show file tree" });
          output.push({ type: "dim", content: "  mkdir <name>       Create directory" });
          output.push({ type: "dim", content: "  touch <name>       Create empty file" });
          output.push({ type: "dim", content: "  rm <file>          Remove file" });
          output.push({ type: "dim", content: "  clear              Clear terminal" });
          output.push({ type: "dim", content: "  open <file>        Open file in editor" });
          output.push({ type: "dim", content: "  help               Show this help" });
          break;

        case "clear":
          setLines([]);
          return [];

        case "pwd":
          output.push({ type: "output", content: cwd });
          break;

        case "echo":
          output.push({ type: "output", content: args.join(" ") });
          break;

        case "ls":
        case "dir": {
          if (!workspace) {
            output.push({ type: "error", content: "No workspace open." });
            break;
          }
          const targetPath = args[0] || "";
          let items: FileItem[];
          if (targetPath) {
            const target = findInWorkspace(targetPath);
            if (!target) {
              output.push({ type: "error", content: `ls: ${targetPath}: No such file or directory` });
              break;
            }
            if (!target.isDirectory) {
              output.push({ type: "output", content: target.name });
              break;
            }
            items = target.children || [];
          } else {
            items = workspace.files;
          }
          const dirs = items.filter((i) => i.isDirectory).sort((a, b) => a.name.localeCompare(b.name));
          const files = items.filter((i) => !i.isDirectory).sort((a, b) => a.name.localeCompare(b.name));
          if (dirs.length === 0 && files.length === 0) {
            output.push({ type: "dim", content: "" });
          } else {
            // Colored ls: dirs in blue, files in default
            const parts: string[] = [];
            dirs.forEach((d) => parts.push(`${d.name}/`));
            files.forEach((f) => parts.push(f.name));
            // Push each item with appropriate type
            dirs.forEach((d) => output.push({ type: "path", content: `${d.name}/` }));
            files.forEach((f) => {
              const ext = f.name.split(".").pop()?.toLowerCase() || "";
              const isExecutable = ["js", "ts", "sh", "py"].includes(ext);
              output.push({ type: isExecutable ? "success" : "output", content: f.name });
            });
            if (output.length === 0) output.push({ type: "dim", content: "" });
          }
          break;
        }

        case "cat": {
          if (args.length === 0) {
            output.push({ type: "error", content: "cat: missing file operand" });
            break;
          }
          const filePath = args[0];
          const file = findInWorkspace(filePath);
          if (!file) {
            output.push({ type: "error", content: `cat: ${filePath}: No such file or directory` });
            break;
          }
          if (file.isDirectory) {
            output.push({ type: "error", content: `cat: ${filePath}: Is a directory` });
            break;
          }
          if (file.content) {
            const contentLines = file.content.split("\n");
            contentLines.forEach((line) => {
              output.push({ type: "output", content: line });
            });
          } else {
            output.push({ type: "output", content: "" });
          }
          break;
        }

        case "open": {
          if (args.length === 0) {
            output.push({ type: "error", content: "open: missing file operand" });
            break;
          }
          const filePath = args[0];
          const file = findInWorkspace(filePath);
          if (!file) {
            output.push({ type: "error", content: `open: ${filePath}: No such file or directory` });
            break;
          }
          if (file.isDirectory) {
            output.push({ type: "error", content: `open: ${filePath}: Is a directory` });
            break;
          }
          // Find the file in openFiles or open it
          const openFileObj = openFiles.find((f) => f.path === file.path);
          if (openFileObj) {
            openFile(openFileObj.id);
            output.push({ type: "output", content: `Opened ${filePath} in editor.` });
          } else {
            // Try to find the FileItem id and open it
            output.push({ type: "error", content: `open: ${filePath}: File not in open tabs. Open it from the Explorer.` });
          }
          break;
        }

        case "npm": {
          if (args.length === 0) {
            output.push({ type: "output", content: "npm: missing command. Try 'npm run <script>' or 'npm install'." });
            break;
          }

          if (args[0] === "run") {
            if (args.length < 2) {
              const pkg = getPackageJson();
              if (pkg?.scripts) {
                const scripts = Object.keys(pkg.scripts);
                if (scripts.length > 0) {
                  output.push({ type: "system", content: "Available scripts:" });
                  scripts.forEach((s) => output.push({ type: "output", content: `  ${s}` }));
                } else {
                  output.push({ type: "dim", content: "No scripts defined in package.json." });
                }
              } else {
                output.push({ type: "error", content: "No package.json found in workspace." });
              }
              break;
            }
            const scriptName = args[1];
            const pkg = getPackageJson();
            if (!pkg?.scripts?.[scriptName]) {
              output.push({ type: "error", content: `npm: Unknown script: ${scriptName}` });
              break;
            }
            const scriptCmd = pkg.scripts[scriptName];
            output.push({ type: "system", content: `> ${cwd} npm run ${scriptName}` });
            output.push({ type: "dim", content: `` });
            output.push({ type: "system", content: `> ${scriptName}` });
            output.push({ type: "dim", content: `> ${scriptCmd}` });
            output.push({ type: "dim", content: `` });
            // Simulate common script outputs with realistic formatting
            if (scriptName === "dev" || scriptName === "start") {
              output.push({ type: "system", content: "  ▲ Next.js 15.0.0" });
              output.push({ type: "output", content: "  - Local:   http://localhost:3000" });
              output.push({ type: "output", content: "  - Network: http://0.0.0.0:3000" });
              output.push({ type: "dim", content: "" });
              output.push({ type: "success", content: "  ✓ Ready in 1.2s" });
              output.push({ type: "dim", content: "" });
              output.push({ type: "output", content: "  ○ Compiling / ..." });
              output.push({ type: "dim", content: "  ○ Compiled / in 340ms" });
            } else if (scriptName === "build") {
              output.push({ type: "output", content: "  Creating an optimized production build ..." });
              output.push({ type: "success", content: "  ✓ Compiled successfully" });
              output.push({ type: "success", content: "  ✓ Linting and checking validity of types" });
              output.push({ type: "success", content: "  ✓ Collecting page data" });
              output.push({ type: "success", content: "  ✓ Generating static pages" });
              output.push({ type: "success", content: `  ✓ Build completed in 3.4s` });
            } else if (scriptName === "lint") {
              output.push({ type: "success", content: "  ✓ No ESLint warnings or errors" });
            } else {
              output.push({ type: "success", content: `  ✓ Script '${scriptName}' completed.` });
            }
            break;
          }

          if (args[0] === "install" || args[0] === "i") {
            output.push({ type: "dim", content: "  npm warn deprecated: some-package@1.0.0: This package is deprecated." });
            output.push({ type: "success", content: "  added 312 packages in 4.8s" });
            output.push({ type: "dim", content: "" });
            output.push({ type: "dim", content: "  12 packages are looking for funding" });
            output.push({ type: "dim", content: "    run 'npm fund' for details" });
            output.push({ type: "dim", content: "" });
            output.push({ type: "success", content: "  found 0 vulnerabilities" });
            break;
          }

          output.push({ type: "error", content: `npm: Unknown command: ${args[0]}. Try 'npm run <script>' or 'npm install'.` });
          break;
        }

        case "cd": {
          if (args.length === 0) {
            setCwd(`~/${workspace?.name || "workspace"}`);
            break;
          }
          output.push({ type: "output", content: `(simulated) cd: ${args[0]}` });
          break;
        }

        case "whoami":
          output.push({ type: "output", content: "netsyra-user" });
          break;

        case "date":
          output.push({ type: "output", content: new Date().toString() });
          break;

        case "grep": {
          if (args.length < 2) {
            output.push({ type: "error", content: "grep: usage: grep <pattern> <file>" });
            break;
          }
          const pattern = args[0];
          const filePath = args[1];
          const file = findInWorkspace(filePath);
          if (!file) {
            output.push({ type: "error", content: `grep: ${filePath}: No such file or directory` });
            break;
          }
          if (file.isDirectory) {
            output.push({ type: "error", content: `grep: ${filePath}: Is a directory` });
            break;
          }
          if (file.content) {
            const contentLines = file.content.split("\n");
            let matchCount = 0;
            contentLines.forEach((line, i) => {
              if (line.toLowerCase().includes(pattern.toLowerCase())) {
                output.push({ type: "output", content: `${filePath}:${i + 1}: ${line.trim()}` });
                matchCount++;
              }
            });
            if (matchCount === 0) {
              output.push({ type: "dim", content: "" });
            }
          }
          break;
        }

        case "find": {
          if (!workspace) {
            output.push({ type: "error", content: "No workspace open." });
            break;
          }
          const query = args[0] || "";
          if (!query) {
            output.push({ type: "error", content: "find: missing search term" });
            break;
          }
          const allFiles = flattenFiles(workspace.files);
          const matches = allFiles.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
          if (matches.length === 0) {
            output.push({ type: "dim", content: "" });
          } else {
            matches.forEach((m) => output.push({ type: "path", content: `./${m.path}` }));
          }
          break;
        }

        case "head": {
          if (args.length === 0) {
            output.push({ type: "error", content: "head: missing file operand" });
            break;
          }
          const filePath = args[0];
          const numLines = args[1] ? parseInt(args[1]) || 10 : 10;
          const file = findInWorkspace(filePath);
          if (!file) {
            output.push({ type: "error", content: `head: ${filePath}: No such file or directory` });
            break;
          }
          if (file.isDirectory) {
            output.push({ type: "error", content: `head: ${filePath}: Is a directory` });
            break;
          }
          if (file.content) {
            const contentLines = file.content.split("\n").slice(0, numLines);
            contentLines.forEach((line) => output.push({ type: "output", content: line }));
          }
          break;
        }

        case "wc": {
          if (args.length === 0) {
            output.push({ type: "error", content: "wc: missing file operand" });
            break;
          }
          const filePath = args[0];
          const file = findInWorkspace(filePath);
          if (!file) {
            output.push({ type: "error", content: `wc: ${filePath}: No such file or directory` });
            break;
          }
          if (file.isDirectory) {
            output.push({ type: "error", content: `wc: ${filePath}: Is a directory` });
            break;
          }
          if (file.content) {
            const contentLines = file.content.split("\n");
            const words = file.content.split(/\s+/).filter(Boolean).length;
            const chars = file.content.length;
            output.push({ type: "output", content: `  ${contentLines.length}  ${words}  ${chars} ${filePath}` });
          }
          break;
        }

        case "tree": {
          if (!workspace) {
            output.push({ type: "error", content: "No workspace open." });
            break;
          }
          const buildTree = (items: FileItem[], prefix: string): TerminalLine[] => {
            const result: TerminalLine[] = [];
            const sorted = [...items].sort((a, b) => {
              if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
              return a.name.localeCompare(b.name);
            });
            sorted.forEach((item, idx) => {
              const last = idx === sorted.length - 1;
              const connector = last ? "└── " : "├── ";
              const type = item.isDirectory ? "path" : "output";
              result.push({ type, content: `${prefix}${connector}${item.name}${item.isDirectory ? "/" : ""}` });
              if (item.isDirectory && item.children) {
                const newPrefix = prefix + (last ? "    " : "│   ");
                result.push(...buildTree(item.children, newPrefix));
              }
            });
            return result;
          };
          output.push({ type: "path", content: workspace.name + "/" });
          output.push(...buildTree(workspace.files, ""));
          break;
        }

        case "mkdir": {
          if (args.length === 0) {
            output.push({ type: "error", content: "mkdir: missing operand" });
            break;
          }
          output.push({ type: "dim", content: `(simulated) Created directory: ${args[0]}` });
          break;
        }

        case "touch": {
          if (args.length === 0) {
            output.push({ type: "error", content: "touch: missing file operand" });
            break;
          }
          output.push({ type: "dim", content: `(simulated) Created file: ${args[0]}` });
          break;
        }

        case "rm": {
          if (args.length === 0) {
            output.push({ type: "error", content: "rm: missing operand" });
            break;
          }
          const filePath = args[args.length - 1];
          const file = findInWorkspace(filePath);
          if (!file) {
            output.push({ type: "error", content: `rm: ${filePath}: No such file or directory` });
            break;
          }
          output.push({ type: "dim", content: `(simulated) Removed: ${filePath}` });
          break;
        }

        case "git": {
          if (args.length === 0) {
            output.push({ type: "error", content: "git: missing command. Try 'git status', 'git log', 'git branch'." });
            break;
          }
          if (args[0] === "status") {
            output.push({ type: "system", content: "On branch main" });
            output.push({ type: "dim", content: "Your branch is up to date with 'origin/main'." });
            output.push({ type: "dim", content: "" });
            output.push({ type: "success", content: "nothing to commit, working tree clean" });
          } else if (args[0] === "log") {
            output.push({ type: "dim", content: "commit 49927a712 (HEAD -> main, origin/main)" });
            output.push({ type: "output", content: "Author: Netsyra User <user@netsyra.dev>" });
            output.push({ type: "output", content: `Date:   ${new Date().toDateString()}` });
            output.push({ type: "dim", content: "" });
            output.push({ type: "output", content: "    ALL Plans are finally created" });
          } else if (args[0] === "branch") {
            output.push({ type: "success", content: "* main" });
          } else {
            output.push({ type: "error", content: `git: '${args[0]}' is not a recognized command. Try 'status', 'log', 'branch'.` });
          }
          break;
        }

        default:
          output.push({ type: "error", content: `command not found: ${command}. Type 'help' for available commands.` });
          break;
      }

      return output;
    },
    [workspace, openFiles, openFile, findInWorkspace, getPackageJson, cwd]
  );

  const [isExecuting, setIsExecuting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd || isExecuting) return;

    const inputLine: TerminalLine = { type: "input", content: `${cwd} $ ${cmd}` };

    if (cmd.trim() === "clear") {
      setLines([]);
      setHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);
      setInput("");
      return;
    }

    const output = executeCommand(cmd);
    const isNpm = cmd.trim().startsWith("npm");

    if (isNpm && output.length > 2) {
      setIsExecuting(true);
      setLines((prev) => [...prev, inputLine]);
      await new Promise((r) => setTimeout(r, 200));
      for (let i = 0; i < output.length; i++) {
        setLines((prev) => [...prev, output[i]]);
        const content = output[i].content;
        const delay = content.includes("Compiling") ? 400 : content.includes("Ready") ? 300 : content.includes("Compiled") ? 350 : 60;
        await new Promise((r) => setTimeout(r, delay));
      }
      setIsExecuting(false);
    } else {
      setLines((prev) => [...prev, inputLine, ...output]);
    }

    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0 || historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    }
  };

  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input":
        return "text-[#e6edf3]";
      case "output":
        return "text-[#8b949e]";
      case "error":
        return "text-[#f85149]";
      case "system":
        return "text-[#58a6ff]";
      case "success":
        return "text-[#3fb950]";
      case "path":
        return "text-[#34e8bb]";
      case "dim":
        return "text-[#484f58]";
      default:
        return "text-[#8b949e]";
    }
  };

  // --- Real terminal mode: render xterm.js backed terminal ---
  if (mode === "real") {
    const isReal = mode === "real";
    return (
      <div className="flex flex-col h-full bg-[#0d1117] relative">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 px-2 py-0.5 border-b border-[#1f2428] bg-[#161b22] shrink-0">
          <button
            onClick={() => setMode("real")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              isReal ? "bg-[#1f2428] text-[#34e8bb]" : "text-[#6e7681] hover:text-[#e6edf3]"
            }`}
            title="Real terminal (your local machine via bridge)"
          >
            <TerminalIcon size={11} />
            Local
          </button>
          <button
            onClick={() => setMode("mock")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              !isReal ? "bg-[#1f2428] text-[#34e8bb]" : "text-[#6e7681] hover:text-[#e6edf3]"
            }`}
            title="Simulated terminal (in-browser)"
          >
            <Globe size={11} />
            Simulated
          </button>
          <span className="text-[10px] text-[#484f58] ml-2">
            Connects to your machine via local bridge
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <RealTerminal sessionId={null} />
        </div>
      </div>
    );
  }

  // --- Mock terminal mode (original simulated terminal) ---
  const isMock = mode === "mock";
  return (
    <div
      className="flex flex-col h-full bg-[#0d1117] font-mono text-[13px] cursor-text relative"
      onClick={focusInput}
    >
      {/* Mode toggle */}
      <div className="flex items-center gap-1 px-2 py-0.5 border-b border-[#1f2428] bg-[#161b22] shrink-0">
        <button
          onClick={() => setMode("real")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
            !isMock ? "bg-[#1f2428] text-[#34e8bb]" : "text-[#6e7681] hover:text-[#e6edf3]"
          }`}
          title="Real terminal (your local machine via bridge)"
        >
          <TerminalIcon size={11} />
          Local
        </button>
        <button
          onClick={() => setMode("mock")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
            isMock ? "bg-[#1f2428] text-[#34e8bb]" : "text-[#6e7681] hover:text-[#e6edf3]"
          }`}
          title="Simulated terminal (in-browser)"
        >
          <Globe size={11} />
          Simulated
        </button>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0 relative"
      >
        {lines.map((line, idx) => (
          <div key={idx} className={`${lineColor(line.type)} whitespace-pre-wrap break-all leading-[1.4]`}>
            {line.content || "\u00A0"}
          </div>
        ))}

        {/* Active Input Line */}
        {isExecuting ? (
          <div className="flex items-center mt-0.5">
            <span className="text-[#34e8bb] shrink-0">{cwd}</span>
            <span className="text-[#e6edf3] shrink-0 ml-1">$</span>
            <span className="ml-2 text-[#484f58] text-[12px]">running...</span>
            <span className="inline-block w-2 h-4 bg-[#34e8bb] animate-pulse ml-1.5 align-middle" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="flex items-center mt-0.5">
          <span className="text-[#34e8bb] shrink-0">{cwd}</span>
          <span className="text-[#e6edf3] shrink-0 ml-1">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-[#e6edf3] ml-2 font-mono text-[13px] border-none"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </form>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-2 right-3 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-[#161b22] hover:bg-[#1f2428] text-[#34e8bb] border border-[#30363d] shadow-lg transition-colors"
          title="Scroll to bottom"
        >
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
}
