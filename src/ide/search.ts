// d:\netsyra\src\ide\search.ts
//
// Real code-search engine for the Netsyra IDE.
//
// This module is shared by two consumers:
//   1. SearchPanel.tsx        — the VS Code-style search sidebar (UI)
//   2. AgentOrchestrator.ts   — the `search_code` tool the AI agent calls
//
// It scans the in-memory workspace file tree (every file's `content`,
// not just open tabs) and returns line-level matches with file path,
// line number (1-indexed), the matching line text, and the column
// range of each match — exactly the information an agent needs to do
// `read_file path#Lstart-Lend` afterwards.

import { useIdeStore } from './store';
import { FileItem } from './types';

// --- Public types ---

export interface SearchMatch {
  /** Full workspace-relative path, e.g. "src/components/ide/EditorArea.tsx" */
  filePath: string;
  /** Stable id of the FileItem (used to open the file in the editor) */
  fileId: string;
  /** 1-indexed line number where the match starts */
  line: number;
  /** 1-indexed start column of the match */
  column: number;
  /** Length of the matched substring */
  length: number;
  /** The full text of the matching line (untrimmed) */
  text: string;
}

export interface SearchFileGroup {
  filePath: string;
  fileId: string;
  fileName: string;
  matches: SearchMatch[];
}

export interface SearchResult {
  query: string;
  /** All individual matches, flattened in tree order */
  matches: SearchMatch[];
  /** Matches grouped by file (preserves first-match order) */
  groups: SearchFileGroup[];
  /** True if the search was truncated because it hit the max-results cap */
  truncated: boolean;
}

export interface SearchOptions {
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
  /** Hard cap on total matches returned (performance guard for huge files) */
  maxResults: number;
  /** Optional list of file extensions to search (e.g. ['ts','tsx']). Empty = all. */
  includeExtensions: string[];
  /** Extensions to skip (binary / non-text files). Defaults to common ones. */
  excludeExtensions: string[];
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  matchCase: false,
  matchWholeWord: false,
  useRegex: false,
  maxResults: 2000,
  includeExtensions: [],
  excludeExtensions: [
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg',
    'woff', 'woff2', 'ttf', 'eot', 'otf',
    'mp3', 'mp4', 'webm', 'wav', 'ogg',
    'pdf', 'zip', 'gz', 'tar', 'rar',
    'lock', 'map',
  ],
};

// --- Internal helpers ---

/** Recursively collect every non-directory FileItem in the workspace tree. */
function collectAllFiles(items: FileItem[], acc: FileItem[] = []): FileItem[] {
  for (const item of items) {
    if (!item.isDirectory) {
      acc.push(item);
    } else if (item.children) {
      collectAllFiles(item.children, acc);
    }
  }
  return acc;
}

/** Get the lower-cased extension (without the dot) of a file name. */
function getExt(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** Build a RegExp from the query + options. Returns null if the regex is invalid. */
function buildMatcher(query: string, opts: SearchOptions): RegExp | null {
  let pattern: string;
  const flags = opts.matchCase ? 'g' : 'gi';

  if (opts.useRegex) {
    pattern = query;
    // Validate — a bad regex must not crash the whole search.
    try {
      new RegExp(pattern, flags);
    } catch {
      return null;
    }
  } else {
    // Escape regex metacharacters so the literal string is matched.
    pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (opts.matchWholeWord) {
    pattern = `\\b${pattern}\\b`;
  }

  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

// --- Core search function ---

/**
 * Run a real content + filename search across the entire workspace.
 *
 * Works synchronously because all file content lives in memory (the
 * Zustand store). For very large workspaces the `maxResults` cap keeps
 * it fast; the UI debounces keystrokes so we never search on every char.
 */
export function searchWorkspace(
  query: string,
  options: Partial<SearchOptions> = {},
): SearchResult {
  const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };
  const empty: SearchResult = { query, matches: [], groups: [], truncated: false };

  const trimmed = query.trim();
  if (!trimmed) return empty;

  const state = useIdeStore.getState();
  const workspace = state.workspace;
  if (!workspace) return empty;

  // Prefer the latest content from open tabs (they may be dirty / unsaved).
  const openFileContent = new Map<string, string>();
  for (const f of state.openFiles) {
    openFileContent.set(f.path, f.content);
  }

  const allFiles = collectAllFiles(workspace.files);
  const matcher = buildMatcher(trimmed, opts);

  const matches: SearchMatch[] = [];
  let truncated = false;

  for (const file of allFiles) {
    if (matches.length >= opts.maxResults) {
      truncated = true;
      break;
    }

    const ext = getExt(file.name);
    if (opts.excludeExtensions.includes(ext)) continue;
    if (opts.includeExtensions.length > 0 && !opts.includeExtensions.includes(ext)) continue;

    // Use the freshest content available (open tab > tree snapshot).
    const content = openFileContent.get(file.path) ?? file.content ?? '';
    if (!content) continue;

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (matches.length >= opts.maxResults) {
        truncated = true;
        break;
      }
      const lineText = lines[i];

      if (matcher) {
        // Regex / whole-word path — can yield multiple matches per line.
        matcher.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = matcher.exec(lineText)) !== null) {
          matches.push({
            filePath: file.path,
            fileId: file.id,
            line: i + 1,
            column: m.index + 1,
            length: m[0].length,
            text: lineText,
          });
          if (matches.length >= opts.maxResults) break;
          // Guard against zero-length matches (e.g. `.*` style regexes).
          if (m[0].length === 0) matcher.lastIndex++;
        }
      } else {
        // Literal substring path (faster, also used when regex is invalid).
        const hay = opts.matchCase ? lineText : lineText.toLowerCase();
        const needle = opts.matchCase ? trimmed : trimmed.toLowerCase();
        let from = 0;
        let idx: number;
        while ((idx = hay.indexOf(needle, from)) !== -1) {
          if (opts.matchWholeWord) {
            const before = idx > 0 ? hay[idx - 1] : ' ';
            const after = idx + needle.length < hay.length ? hay[idx + needle.length] : ' ';
            if (/[a-zA-Z0-9_]/.test(before) || /[a-zA-Z0-9_]/.test(after)) {
              from = idx + needle.length;
              continue;
            }
          }
          matches.push({
            filePath: file.path,
            fileId: file.id,
            line: i + 1,
            column: idx + 1,
            length: trimmed.length,
            text: lineText,
          });
          if (matches.length >= opts.maxResults) break;
          from = idx + needle.length;
        }
      }
    }
  }

  // Group by file, preserving the order in which files first matched.
  const groupMap = new Map<string, SearchFileGroup>();
  for (const m of matches) {
    let g = groupMap.get(m.filePath);
    if (!g) {
      g = {
        filePath: m.filePath,
        fileId: m.fileId,
        fileName: m.filePath.split('/').pop() || m.filePath,
        matches: [],
      };
      groupMap.set(m.filePath, g);
    }
    g.matches.push(m);
  }

  return {
    query: trimmed,
    matches,
    groups: Array.from(groupMap.values()),
    truncated,
  };
}

/**
 * Lightweight filename-only search (used by the agent when it only
 * needs to locate files, not line-level content). Returns up to `limit`
 * file paths whose name contains the query (case-insensitive).
 */
export function searchFileNames(query: string, limit = 20): FileItem[] {
  const state = useIdeStore.getState();
  if (!state.workspace || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const all = collectAllFiles(state.workspace.files);
  const out: FileItem[] = [];
  for (const f of all) {
    if (f.name.toLowerCase().includes(q)) {
      out.push(f);
      if (out.length >= limit) break;
    }
  }
  return out;
}

// --- Replace-in-files ---

export interface ReplaceResult {
  /** Number of files modified */
  filesChanged: number;
  /** Total number of individual replacements made */
  replacements: number;
  /** File paths that were modified */
  changedFiles: string[];
}

/**
 * Replace all occurrences of `query` with `replaceValue` across the
 * entire workspace (or a single file if `singleFilePath` is provided).
 *
 * This updates both the in-memory tree content AND any open tabs so
 * the editor immediately reflects the change. Disk persistence happens
 * when the user saves the file (or via auto-save).
 */
export function replaceInWorkspace(
  query: string,
  replaceValue: string,
  options: Partial<SearchOptions> = {},
  singleFileId?: string,
): ReplaceResult {
  const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };
  const trimmed = query.trim();
  const empty: ReplaceResult = { filesChanged: 0, replacements: 0, changedFiles: [] };

  if (!trimmed) return empty;

  const state = useIdeStore.getState();
  const workspace = state.workspace;
  if (!workspace) return empty;

  const matcher = buildMatcher(trimmed, opts);
  if (!matcher) return empty; // invalid regex

  // Collect all files to process
  const allFiles = collectAllFiles(workspace.files);
  const filesToProcess = singleFileId
    ? allFiles.filter(f => f.id === singleFileId)
    : allFiles;

  let totalReplacements = 0;
  const changedFileIds: string[] = [];
  const changedFilePaths: string[] = [];

  for (const file of filesToProcess) {
    const ext = getExt(file.name);
    if (opts.excludeExtensions.includes(ext)) continue;
    if (opts.includeExtensions.length > 0 && !opts.includeExtensions.includes(ext)) continue;

    // Use freshest content (open tab > tree)
    const openTab = state.openFiles.find(f => f.path === file.path);
    const content = openTab?.content ?? file.content ?? '';
    if (!content) continue;

    // Perform replacement
    matcher.lastIndex = 0;
    const newContent = content.replace(matcher, () => {
      totalReplacements++;
      return replaceValue;
    });

    if (newContent !== content) {
      changedFileIds.push(file.id);
      changedFilePaths.push(file.path);

      // Update open tab if it exists
      if (openTab) {
        useIdeStore.getState().setFileContent(file.id, newContent);
      } else {
        // Update tree content directly
        useIdeStore.getState().updateFileContent(file.id, newContent);
      }
    }
  }

  return {
    filesChanged: changedFileIds.length,
    replacements: totalReplacements,
    changedFiles: changedFilePaths,
  };
}

/**
 * Format a SearchResult into a compact, agent-friendly text block.
 * The agent uses this to decide which `read_file path#Lstart-Lend`
 * call to make next.
 *
 * Example output:
 *   Found 6 matches in 2 files for "login":
 *   auth.ts
 *     L45  function login(email, password) {
 *     L78  const token = await login(...)
 *   config.ts
 *     L12  LOGIN_URL=https://...
 */
export function formatSearchResultForAgent(result: SearchResult): string {
  if (result.matches.length === 0) {
    return `No results found for "${result.query}".`;
  }

  const lines: string[] = [];
  lines.push(
    `Found ${result.matches.length} match(es) in ${result.groups.length} file(s) for "${result.query}"${result.truncated ? ' (truncated)' : ''}:`,
  );

  for (const group of result.groups) {
    lines.push(`${group.filePath}`);
    for (const m of group.matches.slice(0, 20)) {
      const trimmedText = m.text.trim().slice(0, 120);
      lines.push(`  L${m.line}: ${trimmedText}`);
    }
    if (group.matches.length > 20) {
      lines.push(`  ... and ${group.matches.length - 20} more in this file`);
    }
  }

  return lines.join('\n');
}
