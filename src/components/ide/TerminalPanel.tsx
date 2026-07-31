"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useIdeStore } from "@/ide";
import type { FileItem } from "@/ide/types";

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  content: string;
}

export function TerminalPanel() {
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

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

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
          output.push({ type: "output", content: "Available commands:" });
          output.push({ type: "output", content: "  ls [path]        List files in directory" });
          output.push({ type: "output", content: "  pwd              Print working directory" });
          output.push({ type: "output", content: "  cat <file>       Print file contents" });
          output.push({ type: "output", content: "  echo <text>      Print text" });
          output.push({ type: "output", content: "  npm run <script> Run an npm script" });
          output.push({ type: "output", content: "  npm install      Simulate npm install" });
          output.push({ type: "output", content: "  clear            Clear the terminal" });
          output.push({ type: "output", content: "  help             Show this help message" });
          output.push({ type: "output", content: "  open <file>      Open a file in the editor" });
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
          const formatted = [
            ...dirs.map((d) => `${d.name}/`),
            ...files.map((f) => f.name),
          ];
          if (formatted.length === 0) {
            output.push({ type: "output", content: "" });
          } else {
            output.push({ type: "output", content: formatted.join("  ") });
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
                  output.push({ type: "output", content: "Available scripts:" });
                  scripts.forEach((s) => output.push({ type: "output", content: `  ${s}` }));
                } else {
                  output.push({ type: "output", content: "No scripts defined in package.json." });
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
            output.push({ type: "output", content: `> ${cwd} npm run ${scriptName}` });
            output.push({ type: "output", content: `` });
            output.push({ type: "output", content: `> ${scriptName}` });
            output.push({ type: "output", content: `> ${scriptCmd}` });
            output.push({ type: "output", content: `` });
            // Simulate common script outputs
            if (scriptName === "dev" || scriptName === "start") {
              output.push({ type: "output", content: "  ▲ Next.js 15.0.0" });
              output.push({ type: "output", content: "  - Local:   http://localhost:3000" });
              output.push({ type: "output", content: "  - Network: http://0.0.0.0:3000" });
              output.push({ type: "output", content: "" });
              output.push({ type: "output", content: "  ✓ Ready in 1.2s" });
              output.push({ type: "output", content: "" });
              output.push({ type: "output", content: "  ○ Compiling / ..." });
            } else if (scriptName === "build") {
              output.push({ type: "output", content: "  Creating an optimized production build ..." });
              output.push({ type: "output", content: "  ✓ Compiled successfully" });
              output.push({ type: "output", content: "  ✓ Linting and checking validity of types" });
              output.push({ type: "output", content: "  ✓ Collecting page data" });
              output.push({ type: "output", content: "  ✓ Generating static pages" });
              output.push({ type: "output", content: `  ✓ Build completed in 3.4s` });
            } else if (scriptName === "lint") {
              output.push({ type: "output", content: "  ✓ No ESLint warnings or errors" });
            } else {
              output.push({ type: "output", content: `  ✓ Script '${scriptName}' completed.` });
            }
            break;
          }

          if (args[0] === "install" || args[0] === "i") {
            output.push({ type: "output", content: "  added 312 packages in 4.8s" });
            output.push({ type: "output", content: "" });
            output.push({ type: "output", content: "  12 packages are looking for funding" });
            output.push({ type: "output", content: "    run 'npm fund' for details" });
            output.push({ type: "output", content: "" });
            output.push({ type: "output", content: "  found 0 vulnerabilities" });
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

        default:
          output.push({ type: "error", content: `command not found: ${command}. Type 'help' for available commands.` });
          break;
      }

      return output;
    },
    [workspace, openFiles, openFile, findInWorkspace, getPackageJson, cwd]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    // Add input line to terminal
    const newLines: TerminalLine[] = [
      ...lines,
      { type: "input", content: `${cwd} $ ${cmd}` },
    ];

    // Execute command
    const output = executeCommand(cmd);

    // Handle clear specially
    if (cmd.trim() === "clear") {
      setLines([]);
    } else {
      setLines([...newLines, ...output]);
    }

    // Add to history
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
        return "text-[#cccccc]";
      case "output":
        return "text-[#cccccc]";
      case "error":
        return "text-[#f48771]";
      case "system":
        return "text-[#569cd6]";
      default:
        return "text-[#cccccc]";
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-[#1e1e1e] font-mono text-[13px] cursor-text"
      onClick={focusInput}
    >
      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0"
      >
        {lines.map((line, idx) => (
          <div key={idx} className={`${lineColor(line.type)} whitespace-pre-wrap break-all leading-[1.4]`}>
            {line.content || "\u00A0"}
          </div>
        ))}

        {/* Active Input Line */}
        <form onSubmit={handleSubmit} className="flex items-center mt-0.5">
          <span className="text-[#89e051] shrink-0">{cwd}</span>
          <span className="text-white shrink-0 ml-1">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-[#cccccc] ml-2 font-mono text-[13px] border-none"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </form>
      </div>
    </div>
  );
}
