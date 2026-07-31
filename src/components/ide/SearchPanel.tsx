// d:\netsyra\src\components\ide\SearchPanel.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, ChevronDown, ChevronRight, Replace, File, Loader2, Check, FileEdit } from "lucide-react";
import { useIdeStore, searchWorkspace, replaceInWorkspace, type SearchResult, type SearchMatch } from "@/ide";

export function SearchPanel() {
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [replaceFeedback, setReplaceFeedback] = useState<string | null>(null);
  // Debounced query — updated inside a setTimeout callback (not synchronously
  // in the effect body), so this is the canonical "what to search for" value.
  const [debouncedText, setDebouncedText] = useState("");

  const openFile = useIdeStore((s) => s.openFile);

  // --- Debounce the raw input into debouncedText (200ms) ---
  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(searchText), 200);
    return () => clearTimeout(t);
  }, [searchText]);

  // --- Derive search results from the debounced query (no setState in effect) ---
  const { result, regexError } = useMemo<{
    result: SearchResult | null;
    regexError: string | null;
  }>(() => {
    const trimmed = debouncedText.trim();
    if (!trimmed) return { result: null, regexError: null };
    try {
      return {
        result: searchWorkspace(debouncedText, {
          matchCase,
          matchWholeWord,
          useRegex,
        }),
        regexError: null,
      };
    } catch (err) {
      return {
        result: null,
        regexError: err instanceof Error ? err.message : "Search error",
      };
    }
  }, [debouncedText, matchCase, matchWholeWord, useRegex]);

  // "Searching..." while the user is typing but the debounce hasn't fired yet.
  const isSearching = searchText !== debouncedText;

  const toggleFile = (filePath: string) => {
    setExpandedFiles((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  const expandAll = () => {
    if (!result) return;
    const all: Record<string, boolean> = {};
    result.groups.forEach((g) => (all[g.filePath] = true));
    setExpandedFiles(all);
  };

  const collapseAll = () => setExpandedFiles({});

  // --- Click-to-jump (mirrors ProblemsPanel behaviour) ---
  const handleJump = (match: SearchMatch) => {
    openFile(match.fileId);
    const editor = (window as unknown as { __netsyraEditor?: MonacoLike }).__netsyraEditor;
    if (editor) {
      editor.revealLineInCenter(match.line);
      editor.setPosition({ lineNumber: match.line, column: match.column });
      editor.focus();
    }
  };

  // --- Replace in all files ---
  const handleReplaceAll = () => {
    if (!searchText.trim() || !result || result.matches.length === 0) return;
    const res = replaceInWorkspace(searchText, replaceText, {
      matchCase,
      matchWholeWord,
      useRegex,
    });
    setReplaceFeedback(
      `Replaced ${res.replacements} occurrence(s) in ${res.filesChanged} file(s)`,
    );
    setTimeout(() => setReplaceFeedback(null), 4000);
  };

  // --- Replace in single file ---
  const handleReplaceFile = (fileId: string, fileName: string) => {
    if (!searchText.trim() || !result) return;
    const res = replaceInWorkspace(searchText, replaceText, {
      matchCase,
      matchWholeWord,
      useRegex,
    }, fileId);
    setReplaceFeedback(
      `Replaced ${res.replacements} occurrence(s) in ${fileName}`,
    );
    setTimeout(() => setReplaceFeedback(null), 4000);
  };

  const totalMatches = result?.matches.length ?? 0;
  const fileCount = result?.groups.length ?? 0;
  const hasQuery = searchText.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] p-2 select-none">

      {/* --- Search Inputs --- */}
      <div className="mb-2 space-y-2">
        {/* Search Box */}
        <div className="flex items-center relative">
          <Search size={14} className="absolute left-2 text-[#6e7681]" />
          <input
            type="text"
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoFocus
            className="w-full bg-[#161b22] text-[#e6edf3] text-[13px] py-1.5 pl-7 pr-8 rounded-sm border border-transparent focus:border-[#34e8bb] outline-none placeholder-[#484f58] transition-colors"
          />
          {searchText && (
            <X
              size={14}
              className="absolute right-2 text-[#6e7681] hover:text-[#e6edf3] cursor-pointer transition-colors"
              onClick={() => {
                setSearchText("");
              }}
            />
          )}
        </div>

        {/* Replace Toggle */}
        <button
          onClick={() => setIsReplaceOpen(!isReplaceOpen)}
          className="flex items-center gap-1 text-[12px] text-[#6e7681] hover:text-[#e6edf3] transition-colors"
        >
          {isReplaceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>Replace</span>
        </button>

        {/* Replace Box */}
        {isReplaceOpen && (
          <>
            <div className="flex items-center relative">
              <Replace size={14} className="absolute left-2 text-[#6e7681]" />
              <input
                type="text"
                placeholder="Replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="w-full bg-[#161b22] text-[#e6edf3] text-[13px] py-1.5 pl-7 pr-8 rounded-sm border border-transparent focus:border-[#34e8bb] outline-none placeholder-[#484f58] transition-colors"
              />
              {replaceText && (
                <X
                  size={14}
                  className="absolute right-2 text-[#6e7681] hover:text-[#e6edf3] cursor-pointer transition-colors"
                  onClick={() => setReplaceText("")}
                />
              )}
            </div>
            {/* Replace action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleReplaceAll}
                disabled={!searchText.trim() || totalMatches === 0}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1f2428] hover:bg-[#30363d] text-[#e6edf3] text-[12px] font-medium rounded border border-[#30363d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Replace All in all files"
              >
                <Check size={13} className="text-[#34e8bb]" />
                Replace All
              </button>
            </div>
          </>
        )}
      </div>

      {/* --- Toggle Options (Aa, Ab, .*) --- */}
      <div className="flex gap-2 pb-3 border-b border-[#1f2428] mb-3">
        <button
          onClick={() => setMatchCase(!matchCase)}
          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            matchCase
              ? 'bg-[#1f2428] border-[#34e8bb] text-[#34e8bb]'
              : 'border-transparent text-[#6e7681] hover:text-[#e6edf3]'
          }`}
          title="Match Case"
        >
          Aa
        </button>
        <button
          onClick={() => setMatchWholeWord(!matchWholeWord)}
          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            matchWholeWord
              ? 'bg-[#1f2428] border-[#34e8bb] text-[#34e8bb]'
              : 'border-transparent text-[#6e7681] hover:text-[#e6edf3]'
          }`}
          title="Match Whole Word"
        >
          Ab
        </button>
        <button
          onClick={() => setUseRegex(!useRegex)}
          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            useRegex
              ? 'bg-[#1f2428] border-[#34e8bb] text-[#34e8bb]'
              : 'border-transparent text-[#6e7681] hover:text-[#e6edf3]'
          }`}
          title="Use Regular Expression"
        >
          .*
        </button>
      </div>

      {/* --- Regex error banner --- */}
      {regexError && (
        <div className="mb-2 px-2 py-1.5 rounded bg-[#f85149]/10 border border-[#f85149]/30 text-[11px] text-[#f85149]">
          Invalid regex: {regexError}
        </div>
      )}

      {/* --- Replace feedback banner --- */}
      {replaceFeedback && (
        <div className="mb-2 px-2 py-1.5 rounded bg-[#3fb950]/10 border border-[#3fb950]/30 text-[11px] text-[#3fb950] flex items-center gap-1.5">
          <Check size={12} />
          {replaceFeedback}
        </div>
      )}

      {/* --- Search Results --- */}
      {hasQuery ? (
        <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
          {/* Summary header */}
          <div className="flex items-center justify-between text-[12px] text-[#6e7681] pb-2">
            <span>
              {isSearching ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin text-[#34e8bb]" />
                  Searching...
                </span>
              ) : totalMatches === 0 ? (
                "No results"
              ) : (
                <>
                  {totalMatches} result{totalMatches > 1 ? 's' : ''} in {fileCount} file{fileCount > 1 ? 's' : ''}
                  {result?.truncated && " (truncated)"}
                </>
              )}
            </span>
            {totalMatches > 0 && (
              <div className="flex gap-2 text-[11px]">
                <button
                  onClick={expandAll}
                  className="hover:text-[#e6edf3] transition-colors"
                >
                  Expand all
                </button>
                <button
                  onClick={collapseAll}
                  className="hover:text-[#e6edf3] transition-colors"
                >
                  Collapse all
                </button>
              </div>
            )}
          </div>

          {/* Results tree */}
          {!isSearching && totalMatches > 0 && result && (
            <div className="space-y-1">
              {result.groups.map((group, groupIdx) => {
                const isExpanded = expandedFiles[group.filePath] ?? (groupIdx === 0);
                return (
                  <div key={group.filePath}>
                    {/* File Header */}
                    <div
                      className="flex items-center gap-1.5 hover:bg-[#161b22] px-1 py-0.5 rounded cursor-pointer text-[13px] transition-colors group"
                      onClick={() => toggleFile(group.filePath)}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-[#6e7681]" />
                      ) : (
                        <ChevronRight size={14} className="text-[#6e7681]" />
                      )}
                      <File size={14} className="text-[#6e7681]" />
                      <span className="truncate flex-1 text-[#e6edf3]">{group.filePath}</span>
                      {/* Per-file replace button */}
                      {isReplaceOpen && replaceText !== "" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplaceFile(group.fileId, group.fileName);
                          }}
                          className="hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-[#34e8bb] hover:bg-[#1f2428] rounded transition-colors"
                          title={`Replace in ${group.fileName}`}
                        >
                          <FileEdit size={11} />
                        </button>
                      )}
                      <span className="text-[10px] text-[#484f58] ml-auto">
                        {group.matches.length}
                      </span>
                    </div>

                    {/* File Matches (collapsible) */}
                    {isExpanded && (
                      <div className="pl-4 space-y-0.5">
                        {group.matches.map((match, idx) => (
                          <MatchRow
                            key={idx}
                            match={match}
                            onClick={() => handleJump(match)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* No-results empty state */}
          {!isSearching && totalMatches === 0 && !regexError && (
            <div className="flex items-center justify-center text-[#6e7681] text-[13px] py-8">
              No results found for &ldquo;{searchText}&rdquo;
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#6e7681] text-[13px] select-none">
          Type to search across all workspace files
        </div>
      )}
    </div>
  );
}

// --- Minimal Monaco editor interface for click-to-jump ---
interface MonacoLike {
  revealLineInCenter: (line: number) => void;
  setPosition: (pos: { lineNumber: number; column: number }) => void;
  focus: () => void;
}

// --- Single match row with highlighted matched text ---

function MatchRow({
  match,
  onClick,
}: {
  match: SearchMatch;
  onClick: () => void;
}) {
  // Split the line text into [before, match, after] for highlighting.
  const parts = useMemo(() => {
    const text = match.text;
    const start = match.column - 1; // 0-indexed
    const end = start + match.length;
    return {
      before: text.slice(0, start),
      matched: text.slice(start, end),
      after: text.slice(end),
    };
  }, [match]);

  return (
    <div
      onClick={onClick}
      className="flex flex-col pl-2 border-l border-[#1f2428] hover:bg-[#161b22] rounded-sm cursor-pointer transition-colors py-0.5"
      title={`Click to open at line ${match.line}`}
    >
      <div className="text-[11px] text-[#484f58]">Line {match.line}</div>
      <div className="text-[13px] pl-1 text-[#8b949e] whitespace-pre overflow-hidden text-ellipsis">
        <span>{parts.before}</span>
        <span className="bg-[#34e8bb]/30 text-[#e6edf3] rounded-sm px-0.5">
          {parts.matched}
        </span>
        <span>{parts.after}</span>
      </div>
    </div>
  );
}
