import type { NetsyraDB } from '@/ide/db';
import { useIdeStore } from '@/ide/store';
import { getSymbolContext, searchSymbols } from '@/ide/graph-query';
import { getActiveFileContext, getWorkspaceStructure, searchFiles, findFileByPath } from '@/ide/agent';

// --- Types ---

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentAction {
  tool: 'read_file' | 'edit_file' | 'create_file' | 'search_code' | 'list_files' | 'get_problems' | 'answer';
  args: Record<string, any>;
  content?: string;
}

export interface PendingEdit {
  id: string;
  filePath: string;
  fileId: string | null;
  action: 'edit_file' | 'create_file';
  startLine?: number;
  endLine?: number;
  oldContent: string;
  newContent: string;
  description: string;
}

export interface AgentResult {
  message: string;
  filesChanged: string[];
  filesRead: string[];
  actions: AgentAction[];
  pendingEdits: PendingEdit[];
  canUndo: boolean;
  success: boolean;
}

export type AgentStatusCallback = (status: string) => void;
export type StreamTokenCallback = (token: string, fullText: string) => void;
export type AgentThoughtCallback = (thought: AgentThought) => void;

export interface AgentThought {
  type: 'plan' | 'action' | 'observation' | 'thinking' | 'result';
  title: string;
  detail?: string;
  tool?: string;
  toolArgs?: Record<string, any>;
  timestamp: number;
}

const MAX_TOOL_ROUNDS = 6;

// --- Agent System Prompt with Tool Definitions ---

const AGENT_SYSTEM_PROMPT = `You are Netsyra, an AI coding assistant embedded in a web IDE. You can BOTH converse with the user AND take actions on their codebase.

## Your Capabilities
You have access to tools. In each response, you can either:
1. **Answer** the user directly (for questions, explanations, advice)
2. **Use a tool** to read, edit, create, or search files
3. **Use multiple tools in one response** — wrap each in its own <tool> tag

## Tool Format
To use a tool, respond with a JSON object wrapped in <tool> tags:
<tool>{"tool": "read_file", "args": {"path": "src/App.tsx"}}</tool>

You can use multiple tools in a single response:
<tool>{"tool": "read_file", "args": {"path": "src/App.tsx"}}</tool>
<tool>{"tool": "read_file", "args": {"path": "src/utils.ts"}}</tool>

Available tools:
- read_file: Read a file's content. Args: { "path": "src/path/File.ts" }
- edit_file: Replace lines in a file. Args: { "path": "src/path/File.ts", "startLine": 10, "endLine": 15, "newText": "replacement code" }
- create_file: Create a new file. Args: { "path": "src/path/NewFile.ts", "content": "file content" }
- search_code: Search for symbols/files by name. Args: { "query": "fetchUsers" }
- list_files: List all open files and workspace structure. Args: {}
- get_problems: Get all IDE diagnostics (errors, warnings) with file name, line number, and message. Use this to find bugs without reading entire files. Args: { "severity": "error" } (optional: "error", "warning", "info", or omit for all)
- answer: Respond to the user with text. Args: { "content": "your response text" }

## Rules
- Line numbers in edit_file are 1-indexed (first line = 1, NOT 0)
- You can use multiple tools across multiple rounds. After each tool call, you'll receive the result and can decide the next action.
- You can call multiple read_file/search_code tools in parallel in a single response for efficiency.
- If the user asks a question (not a code change), use the "answer" tool.
- If the user asks to fix/edit/create code, use the appropriate file tools.
- Always read a file before editing it to get accurate line numbers.
- After making edits, use "answer" to summarize what you did.
- Edits are queued for user approval — tell the user you've prepared changes and they will be applied after review.
- Keep explanations concise. Show code only when necessary.

## When to Answer vs Act
- "What does this function do?" → answer
- "Explain how X works" → answer
- "Fix the bug in login" → get_problems → read_file (only relevant lines) → edit_file → answer
- "Create a new component called Header" → create_file → answer
- "Add a logout button" → read_file → edit_file → answer
- "Fix all errors" → get_problems → read_file (only error lines) → edit_file → answer

## Using get_problems for Efficiency
The get_problems tool returns a compact list of all diagnostics with file path, line number, severity, and message. This is MUCH cheaper than reading entire files. Use it to:
- Quickly identify which files have errors and on which lines
- Read only the specific line ranges that have problems (use read_file with line numbers)
- Fix multiple errors across files efficiently without reading hundreds of lines

## Thinking Workflow
When working on a task, follow this structured approach:
1. **Assess**: If the workspace context shows problems, note them. If the user asks to fix something, start with get_problems to see what's wrong.
2. **Plan**: Decide which files to read and in what order. Prefer reading only relevant line ranges over entire files.
3. **Act**: Execute tools one step at a time. After each tool result, evaluate whether you need more information or are ready to make changes.
4. **Verify**: After making edits, consider calling get_problems again to check if your changes introduced new issues.
5. **Summarize**: Use the answer tool to explain what you did, what changed, and any remaining issues.

## Proactive Problem Solving
- If the workspace context shows errors/warnings, mention them in your answer even if the user didn't ask about them specifically.
- When editing code, always check if there might be related problems in the same file.
- If a user asks to "fix" something vague, use get_problems first to identify concrete issues.
- After edits, suggest the user check the Problems panel for any new diagnostics.

## Response Style
- Be concise but informative. Show that you understand the codebase.
- When explaining changes, reference specific file names and line numbers.
- If you're unsure about something, say so rather than guessing.
- Celebrate fixes: "Fixed 3 errors in App.tsx" not just "Done."`;

// --- File Snapshot for Undo ---

interface FileSnapshot {
  fileId: string;
  path: string;
  content: string;
}

// --- Agent Orchestrator ---

export class AgentOrchestrator {
  private db: NetsyraDB;
  private onStatus: AgentStatusCallback;
  private onToken: StreamTokenCallback | null;
  private onThought: AgentThoughtCallback | null;
  private conversationHistory: ChatMessage[] = [];
  private filesChanged: Set<string> = new Set();
  private filesRead: Set<string> = new Set();
  private actions: AgentAction[] = [];
  private pendingEdits: PendingEdit[] = [];
  private snapshots: Map<string, FileSnapshot> = new Map();
  private editIdCounter = 0;

  constructor(db: NetsyraDB, onStatus?: AgentStatusCallback, onToken?: StreamTokenCallback, onThought?: AgentThoughtCallback) {
    this.db = db;
    this.onStatus = onStatus || (() => {});
    this.onToken = onToken || null;
    this.onThought = onThought || null;
  }

  private emitThought(thought: Omit<AgentThought, 'timestamp'>) {
    if (this.onThought) {
      this.onThought({ ...thought, timestamp: Date.now() });
    }
  }

  // --- Snapshot files for undo ---
  private snapshotFiles(): void {
    const store = useIdeStore.getState();
    this.snapshots.clear();
    for (const file of store.openFiles) {
      this.snapshots.set(file.id, {
        fileId: file.id,
        path: file.path,
        content: file.content,
      });
    }
  }

  // --- Undo: restore all files to their pre-agent state ---
  undo(): void {
    const store = useIdeStore.getState();
    for (const [fileId, snapshot] of this.snapshots) {
      const file = store.openFiles.find(f => f.id === fileId);
      if (file) {
        store.setFileContent(fileId, snapshot.content);
        store.saveFile(fileId);
      }
    }
    this.pendingEdits = [];
    this.filesChanged.clear();
  }

  // --- Apply pending edits (called by UI after user approves) ---
  applyPendingEdits(): void {
    const store = useIdeStore.getState();
    for (const edit of this.pendingEdits) {
      if (edit.action === 'create_file' && !edit.fileId) {
        const dirPath = edit.filePath.includes('/')
          ? edit.filePath.substring(0, edit.filePath.lastIndexOf('/'))
          : '/';
        const fileName = edit.filePath.includes('/')
          ? edit.filePath.substring(edit.filePath.lastIndexOf('/') + 1)
          : edit.filePath;
        store.createFile(dirPath, fileName, false);

        setTimeout(() => {
          const state = useIdeStore.getState();
          const newFile = state.openFiles.find(f => f.path === edit.filePath);
          if (newFile) {
            store.setFileContent(newFile.id, edit.newContent);
            store.saveFile(newFile.id);
          }
        }, 100);
      } else if (edit.fileId) {
        store.setFileContent(edit.fileId, edit.newContent);
        store.saveFile(edit.fileId);
      }
      this.filesChanged.add(edit.filePath);
    }
    this.pendingEdits = [];
  }

  // --- Dismiss pending edits ---
  dismissPendingEdits(): void {
    this.pendingEdits = [];
  }

  async run(
    userPrompt: string,
    chatHistory: ChatMessage[] = []
  ): Promise<AgentResult> {
    // Snapshot files before running (for undo)
    this.snapshotFiles();

    // Build initial context
    this.emitThought({ type: 'thinking', title: 'Analyzing your request', detail: userPrompt });
    const workspaceCtx = this.buildWorkspaceContext();
    const graphCtx = await this.buildGraphContext(userPrompt);

    // Build messages: system prompt + context + chat history + user prompt
    const systemContent = `${AGENT_SYSTEM_PROMPT}\n\n## Current Workspace Context\n${workspaceCtx}\n${graphCtx}`;

    this.conversationHistory = [
      { role: 'system', content: systemContent },
      ...chatHistory.slice(-10),
      { role: 'user', content: userPrompt },
    ];

    // Tool-use loop
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      this.onStatus(this.getStatusMessage(round));
      if (round === 0) {
        this.emitThought({ type: 'plan', title: 'Planning my approach', detail: 'Understanding the workspace and deciding what tools to use first.' });
      }

      const response = await this.callLLMStream(this.conversationHistory);

      if (!response) {
        return this.makeResult(
          'I encountered an error communicating with the AI. Please try again.',
          false
        );
      }

      // Parse the response for tool calls (supports multiple)
      const toolCalls = this.parseToolCalls(response);

      if (toolCalls.length === 0) {
        // No tool call found — treat the raw response as an answer
        this.conversationHistory.push({ role: 'assistant', content: response });
        return this.makeResult(response, true);
      }

      // Record the assistant's tool call in conversation
      this.conversationHistory.push({ role: 'assistant', content: response });

      // Check if any tool is "answer"
      const answerAction = toolCalls.find(a => a.tool === 'answer');
      const nonAnswerActions = toolCalls.filter(a => a.tool !== 'answer');

      // Execute non-answer tools in parallel
      if (nonAnswerActions.length > 0) {
        for (const action of nonAnswerActions) {
          this.actions.push(action);
          this.emitThought({
            type: 'action',
            title: this.getToolStatus(action),
            tool: action.tool,
            toolArgs: action.args,
          });
        }

        if (nonAnswerActions.length === 1) {
          this.onStatus(this.getToolStatus(nonAnswerActions[0]));
        } else {
          this.onStatus(`Executing ${nonAnswerActions.length} tools in parallel...`);
        }

        const results = await Promise.all(
          nonAnswerActions.map(action => this.executeTool(action))
        );

        // Emit observations from tool results
        nonAnswerActions.forEach((action, i) => {
          const result = results[i];
          const summary = result.length > 120 ? result.substring(0, 120) + '...' : result;
          this.emitThought({
            type: 'observation',
            title: `Result from ${action.tool}`,
            detail: summary,
            tool: action.tool,
          });
        });

        // Feed all tool results back to the LLM
        const resultSummary = nonAnswerActions
          .map((action, i) => `[${action.tool}${action.args.path ? ': ' + action.args.path : action.args.query ? ': ' + action.args.query : ''}]: ${results[i]}`)
          .join('\n');

        this.conversationHistory.push({
          role: 'user',
          content: `Tool results:\n${resultSummary}`,
        });
      }

      // If there was an answer action, we're done
      if (answerAction) {
        const answerText = answerAction.args.content || response;
        this.emitThought({ type: 'result', title: 'Response ready', detail: answerText.substring(0, 100) + (answerText.length > 100 ? '...' : '') });
        return this.makeResult(answerText, true);
      }
    }

    // Max rounds reached — ask LLM for final summary
    this.onStatus('Summarizing...');
    this.conversationHistory.push({
      role: 'user',
      content: 'You have reached the maximum number of tool calls. Please summarize what you have done so far using the answer tool.',
    });

    const finalResponse = await this.callLLMStream(this.conversationHistory);
    const finalActions = finalResponse ? this.parseToolCalls(finalResponse) : [];
    const finalAnswer = finalActions.find(a => a.tool === 'answer');

    if (finalAnswer) {
      return this.makeResult(finalAnswer.args.content || finalResponse!, true);
    }

    return this.makeResult(
      finalResponse || 'I reached the maximum number of actions. Here is what I accomplished so far.',
      true
    );
  }

  // --- Streaming LLM Call ---
  private async callLLMStream(messages: ChatMessage[]): Promise<string | null> {
    try {
      const res = await fetch('/api/groq/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: 0.3,
          stream: true,
          messages,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Agent LLM error:', errorData);
        return null;
      }

      if (!res.body) {
        const data = await res.json();
        return data.content || null;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]' || !data) continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                console.error('Agent stream error:', parsed.error);
                return null;
              }
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                if (this.onToken) {
                  this.onToken(delta, fullText);
                }
              }
            } catch {
              // partial JSON — skip
            }
          }
        }
      }

      return fullText || null;
    } catch (err) {
      console.error('Agent LLM stream failed:', err);
      return null;
    }
  }

  // --- Parse Multiple Tool Calls from LLM Response ---
  private parseToolCalls(response: string): AgentAction[] {
    const actions: AgentAction[] = [];

    // Find all <tool>{...}</tool> patterns
    const toolRegex = /<tool>\s*(\{[\s\S]*?\})\s*<\/tool>/gi;
    let match;
    while ((match = toolRegex.exec(response)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.tool && typeof parsed.tool === 'string') {
          actions.push({
            tool: parsed.tool,
            args: parsed.args || {},
            content: response,
          });
        }
      } catch {
        // JSON parse failed — skip this tool
      }
    }

    if (actions.length > 0) return actions;

    // Fallback: try bare JSON (single tool, no tags)
    const jsonMatch = response.match(/^\s*(\{[\s\S]*?"tool"\s*:\s*"[^"]+"[\s\S]*?\})\s*$/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.tool && typeof parsed.tool === 'string') {
          actions.push({
            tool: parsed.tool,
            args: parsed.args || {},
            content: response,
          });
        }
      } catch {
        // fall through
      }
    }

    return actions;
  }

  // --- Execute a Tool ---
  private async executeTool(action: AgentAction): Promise<string> {
    switch (action.tool) {
      case 'read_file':
        return this.toolReadFile(action.args.path);
      case 'edit_file':
        return this.toolEditFile(
          action.args.path,
          action.args.startLine,
          action.args.endLine,
          action.args.newText
        );
      case 'create_file':
        return this.toolCreateFile(action.args.path, action.args.content);
      case 'search_code':
        return this.toolSearchCode(action.args.query);
      case 'list_files':
        return this.toolListFiles();
      case 'get_problems':
        return this.toolGetProblems(action.args.severity);
      case 'answer':
        return action.args.content || 'OK';
      default:
        return `Unknown tool: ${action.tool}`;
    }
  }

  // --- Tool: Read File ---
  private toolReadFile(path: string): string {
    const store = useIdeStore.getState();

    // Try open files first
    let file = store.openFiles.find(f => f.path === path);
    if (!file) {
      file = store.openFiles.find(f => f.path.endsWith(path) || path.endsWith(f.path));
    }

    if (file) {
      this.filesRead.add(file.path);
      const lines = file.content.split('\n');
      const numbered = lines.map((line, i) => `${i + 1}: ${line}`).join('\n');
      return `File: ${file.path} (${lines.length} lines)\n${numbered}`;
    }

    // Try workspace file tree
    const treeFile = findFileByPath(path);
    if (treeFile?.content) {
      this.filesRead.add(treeFile.path);
      const lines = treeFile.content.split('\n');
      const numbered = lines.map((line, i) => `${i + 1}: ${line}`).join('\n');
      return `File: ${treeFile.path} (${lines.length} lines)\n${numbered}`;
    }

    // Try IndexedDB
    return `File not found: ${path}. Use list_files to see available files, or search_code to find relevant files.`;
  }

  // --- Tool: Edit File (stores as pending, does NOT apply immediately) ---
  private toolEditFile(
    path: string,
    startLine: number,
    endLine: number,
    newText: string
  ): string {
    const store = useIdeStore.getState();

    let file = store.openFiles.find(f => f.path === path);
    if (!file) {
      file = store.openFiles.find(f => f.path.endsWith(path) || path.endsWith(f.path));
    }

    if (!file) {
      return `Error: File not open: ${path}. Ask the user to open it first, or use create_file for new files.`;
    }

    const start = Math.max(1, Math.floor(startLine) || 1);
    const end = Math.max(start, Math.floor(endLine) || start);

    const lines = file.content.split('\n');
    const startIdx = start - 1;
    const endIdx = end - 1;

    if (startIdx < 0 || endIdx >= lines.length) {
      return `Error: Line range ${start}-${end} is out of bounds. File has ${lines.length} lines. Please read the file again for accurate line numbers.`;
    }

    const newLines = newText.split('\n');
    const newContentArr = [...lines];
    newContentArr.splice(startIdx, endIdx - startIdx + 1, ...newLines);
    const newContent = newContentArr.join('\n');

    // Store as pending edit — do NOT apply to store
    const editId = `edit-${++this.editIdCounter}`;
    const description = `Replace lines ${start}-${end} with ${newLines.length} line(s)`;
    this.pendingEdits.push({
      id: editId,
      filePath: file.path,
      fileId: file.id,
      action: 'edit_file',
      startLine: start,
      endLine: end,
      oldContent: file.content,
      newContent,
      description,
    });

    return `Edit queued for ${file.path}: ${description}. The user will review and apply this change.`;
  }

  // --- Tool: Create File (stores as pending, does NOT apply immediately) ---
  private toolCreateFile(path: string, content: string): string {
    const store = useIdeStore.getState();

    if (!store.workspace) {
      return 'Error: No workspace open. Cannot create files without a workspace.';
    }

    const existing = store.openFiles.find(f => f.path === path);
    if (existing) {
      return `Error: File already exists: ${path}. Use edit_file to modify it instead.`;
    }

    const editId = `create-${++this.editIdCounter}`;
    this.pendingEdits.push({
      id: editId,
      filePath: path,
      fileId: null,
      action: 'create_file',
      oldContent: '',
      newContent: content,
      description: `Create new file with ${content.split('\n').length} lines`,
    });

    return `File creation queued for ${path}: ${content.split('\n').length} lines. The user will review and apply this change.`;
  }

  // --- Tool: Search Code ---
  private async toolSearchCode(query: string): Promise<string> {
    if (!query || typeof query !== 'string') {
      return 'Error: search_code requires a "query" argument.';
    }

    const results: string[] = [];

    // 1. Search workspace files by name
    const fileResults = searchFiles(query);
    if (fileResults.length > 0) {
      results.push('Files matching:');
      fileResults.slice(0, 10).forEach(f => {
        results.push(`  - ${f.path}`);
      });
    }

    // 2. Search symbol graph in IndexedDB
    try {
      const symbolResults = await searchSymbols(this.db, query, 10);
      if (symbolResults.length > 0) {
        results.push('Symbols matching:');
        symbolResults.forEach(s => {
          results.push(`  - ${s.name} (${s.kind}) in ${s.filePath}:${s.line}`);
        });
      }
    } catch {
      // skip
    }

    // 3. Search open file contents
    const store = useIdeStore.getState();
    const contentMatches: string[] = [];
    for (const f of store.openFiles) {
      if (!f.content) continue;
      const lines = f.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query.toLowerCase())) {
          contentMatches.push(`  ${f.path}:${i + 1}: ${lines[i].trim()}`);
          if (contentMatches.length >= 15) break;
        }
      }
      if (contentMatches.length >= 15) break;
    }
    if (contentMatches.length > 0) {
      results.push('Content matches:');
      results.push(...contentMatches);
    }

    if (results.length === 0) {
      return `No results found for "${query}".`;
    }

    return results.join('\n');
  }

  // --- Tool: List Files ---
  private toolListFiles(): string {
    const store = useIdeStore.getState();
    const structure = getWorkspaceStructure();

    const openFilesList = store.openFiles.length > 0
      ? `\nOpen files:\n${store.openFiles.map(f => `  - ${f.path} (${f.content.split('\n').length} lines)`).join('\n')}`
      : '\nNo files currently open.';

    return `${structure}${openFilesList}`;
  }

  // --- Tool: Get Problems (IDE diagnostics) ---
  private toolGetProblems(severityFilter?: string): string {
    const store = useIdeStore.getState();
    const problems = store.problems;
    const openFiles = store.openFiles;

    const allProblems = Object.values(problems).flat();

    if (allProblems.length === 0) {
      return 'No problems detected in the workspace.';
    }

    // Filter by severity if specified
    const filtered = severityFilter
      ? allProblems.filter(p => p.severity === severityFilter)
      : allProblems;

    if (filtered.length === 0) {
      return `No ${severityFilter || 'problems'} detected in the workspace.`;
    }

    // Build a compact summary: file:line - [severity] message
    const lines: string[] = [];
    const errorCount = filtered.filter(p => p.severity === 'error').length;
    const warningCount = filtered.filter(p => p.severity === 'warning').length;
    const infoCount = filtered.filter(p => p.severity === 'info').length;

    lines.push(`Problems: ${errorCount} error(s), ${warningCount} warning(s), ${infoCount} info`);
    lines.push('');

    // Group by file for compact output
    const byFile = new Map<string, { path: string; problems: typeof filtered }>();
    for (const p of filtered) {
      const file = openFiles.find(f => f.id === p.fileId);
      const path = file?.path || 'unknown';
      if (!byFile.has(p.fileId)) {
        byFile.set(p.fileId, { path, problems: [] });
      }
      byFile.get(p.fileId)!.problems.push(p);
    }

    for (const [, group] of byFile) {
      lines.push(`${group.path}:`);
      for (const p of group.problems) {
        const sev = p.severity === 'error' ? 'ERROR' : p.severity === 'warning' ? 'WARN' : 'INFO';
        lines.push(`  L${p.line}:${p.column} [${sev}] ${p.message}${p.source ? ` (${p.source})` : ''}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // --- Build Workspace Context ---
  private buildWorkspaceContext(): string {
    const store = useIdeStore.getState();
    const fileContext = getActiveFileContext();
    const structure = getWorkspaceStructure();

    let ctx = `Workspace: ${store.workspace?.name || 'None'}\n`;
    ctx += `Open files: ${store.openFiles.map(f => f.path).join(', ') || 'none'}\n`;
    ctx += `Active file: ${fileContext.path || 'none'}\n`;
    ctx += `\nWorkspace structure:\n${structure}`;

    // Include compact problems summary if any exist
    const allProblems = Object.values(store.problems).flat();
    const errorCount = allProblems.filter(p => p.severity === 'error').length;
    const warningCount = allProblems.filter(p => p.severity === 'warning').length;
    if (errorCount > 0 || warningCount > 0) {
      ctx += `\n\nCurrent problems (${errorCount} error(s), ${warningCount} warning(s)):`;
      const byFile = new Map<string, string[]>();
      for (const p of allProblems) {
        if (p.severity !== 'error' && p.severity !== 'warning') continue;
        const file = store.openFiles.find(f => f.id === p.fileId);
        const path = file?.path || 'unknown';
        const sev = p.severity === 'error' ? 'ERROR' : 'WARN';
        const entry = `  ${path}:${p.line} [${sev}] ${p.message}`;
        if (!byFile.has(path)) byFile.set(path, []);
        byFile.get(path)!.push(entry);
      }
      for (const [path, entries] of byFile) {
        ctx += `\n${path}:`;
        ctx += `\n${entries.join('\n')}`;
      }
      ctx += `\n(Use get_problems tool for full details including column and source)`;
    }

    if (fileContext.content) {
      const lines = fileContext.content.split('\n');
      const numbered = lines.map((line, i) => `${i + 1}: ${line}`).join('\n');
      ctx += `\n\nActive file content (${fileContext.path}, ${lines.length} lines):\n${numbered}`;
    }

    return ctx;
  }

  // --- Build Graph Context (symbol graph retrieval) ---
  private async buildGraphContext(prompt: string): Promise<string> {
    // Extract keywords from prompt
    const identifiers = prompt.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const STOPWORDS = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'from', 'fix', 'debug', 'explain', 'refactor', 'update',
      'implement', 'find', 'show', 'edit', 'change', 'make', 'create',
      'add', 'remove', 'delete', 'build', 'test', 'run', 'check',
      'issue', 'bug', 'error', 'problem', 'wrong', 'broken', 'not', 'no',
    ]);

    const keywords = identifiers
      .filter(w => w.length > 2 && !STOPWORDS.has(w.toLowerCase()))
      .sort((a, b) => {
        const aIsCode = /[A-Z]/.test(a.slice(1)) || /_/.test(a) || /^[A-Z]/.test(a);
        const bIsCode = /[A-Z]/.test(b.slice(1)) || /_/.test(b) || /^[A-Z]/.test(b);
        if (aIsCode && !bIsCode) return -1;
        if (!aIsCode && bIsCode) return 1;
        return b.length - a.length;
      })
      .slice(0, 5);

    if (keywords.length === 0) return '';

    const files: Array<{ path: string; content: string }> = [];
    const seenPaths = new Set<string>();

    for (const keyword of keywords) {
      try {
        const context = await getSymbolContext(this.db, keyword);
        if (context) {
          for (const f of context.relatedFiles) {
            if (!seenPaths.has(f.path) && f.content) {
              seenPaths.add(f.path);
              files.push({ path: f.path, content: f.content });
            }
          }
        }
      } catch {
        // skip
      }
    }

    if (files.length === 0) return '';

    const contextText = files.slice(0, 3).map(f => {
      const lines = f.content.split('\n');
      const numbered = lines.map((line, i) => `${i + 1}: ${line}`).join('\n');
      return `File: ${f.path} (${lines.length} lines)\n${numbered}`;
    }).join('\n\n');

    return `\nSymbol-graph-resolved files (relevant to: ${keywords.join(', ')}):\n${contextText}`;
  }

  // --- Status Messages ---
  private getStatusMessage(round: number): string {
    const phases = [
      'Thinking...',
      'Analyzing context...',
      'Planning next steps...',
      'Working on it...',
      'Refining approach...',
      'Almost there...',
    ];
    return phases[Math.min(round, phases.length - 1)];
  }

  private getToolStatus(action: AgentAction): string {
    switch (action.tool) {
      case 'read_file': return `Reading ${action.args.path}...`;
      case 'edit_file': return `Editing ${action.args.path} lines ${action.args.startLine}-${action.args.endLine}...`;
      case 'create_file': return `Creating ${action.args.path}...`;
      case 'search_code': return `Searching for "${action.args.query}"...`;
      case 'list_files': return 'Listing files...';
      case 'get_problems': return action.args.severity ? `Checking for ${action.args.severity}s...` : 'Checking problems...';
      case 'answer': return 'Composing response...';
      default: return 'Working...';
    }
  }

  // --- Build Result ---
  private makeResult(message: string, success: boolean): AgentResult {
    return {
      message,
      filesChanged: [...this.filesChanged],
      filesRead: [...this.filesRead],
      actions: this.actions,
      pendingEdits: this.pendingEdits,
      canUndo: this.snapshots.size > 0,
      success,
    };
  }
}
