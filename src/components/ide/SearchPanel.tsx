// d:\netsyra\src\components\ide\SearchPanel.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, ChevronDown, ChevronRight, Replace, File, Loader2 } from "lucide-react";
import { useIdeStore, searchWorkspace, type SearchResult, type SearchMatch } from "@/ide";

export function SearchPanel() {
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
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

  const totalMatches = result?.matches.length ?? 0;
  const fileCount = result?.groups.length ?? 0;
  const hasQuery = searchText.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] p-2 select-none">

      {/* --- Search Inputs --- */}
      <div className="mb-2 space-y-2">
        {/* Search Box */}
        <div className="flex items-center relative">
          <Search size={14} className="absolute left-2 text-[#858585]" />
          <input
            type="text"
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoFocus
            className="w-full bg-[#3c3c3c] text-[#cccccc] text-[13px] py-1.5 pl-7 pr-8 rounded-sm border border-transparent focus:border-[#007acc] outline-none placeholder-[#858585] transition-colors"
          />
          {searchText && (
            <X
              size={14}
              className="absolute right-2 text-[#858585] hover:text-white cursor-pointer transition-colors"
              onClick={() => {
                setSearchText("");
              }}
            />
          )}
        </div>

        {/* Replace Toggle */}
        <button
          onClick={() => setIsReplaceOpen(!isReplaceOpen)}
          className="flex items-center gap-1 text-[12px] text-[#858585] hover:text-[#cccccc] transition-colors"
        >
          {isReplaceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>Replace</span>
        </button>

        {/* Replace Box (UI only — replace-all is a future enhancement) */}
        {isReplaceOpen && (
          <div className="flex items-center relative">
            <Replace size={14} className="absolute left-2 text-[#858585]" />
            <input
              type="text"
              placeholder="Replace (coming soon)"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="w-full bg-[#3c3c3c] text-[#cccccc] text-[13px] py-1.5 pl-7 pr-8 rounded-sm border border-transparent focus:border-[#007acc] outline-none placeholder-[#858585] transition-colors opacity-60"
            />
          </div>
        )}
      </div>

      {/* --- Toggle Options (Aa, Ab, .*) --- */}
      <div className="flex gap-2 pb-3 border-b border-[#3e3e3e] mb-3">
        <button
          onClick={() => setMatchCase(!matchCase)}
          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            matchCase
              ? 'bg-[#37373d] border-[#007acc] text-white'
              : 'border-transparent text-[#858585] hover:text-[#cccccc]'
          }`}
          title="Match Case"
        >
          Aa
        </button>
        <button
          onClick={() => setMatchWholeWord(!matchWholeWord)}
          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            matchWholeWord
              ? 'bg-[#37373d] border-[#007acc] text-white'
              : 'border-transparent text-[#858585] hover:text-[#cccccc]'
          }`}
          title="Match Whole Word"
        >
          Ab
        </button>
        <button
          onClick={() => setUseRegex(!useRegex)}
          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
            useRegex
              ? 'bg-[#37373d] border-[#007acc] text-white'
              : 'border-transparent text-[#858585] hover:text-[#cccccc]'
          }`}
          title="Use Regular Expression"
        >
          .*
        </button>
      </div>

      {/* --- Regex error banner --- */}
      {regexError && (
        <div className="mb-2 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-[11px] text-red-400">
          Invalid regex: {regexError}
        </div>
      )}

      {/* --- Search Results --- */}
      {hasQuery ? (
        <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
          {/* Summary header */}
          <div className="flex items-center justify-between text-[12px] text-[#858585] pb-2">
            <span>
              {isSearching ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" />
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
                  className="hover:text-[#cccccc] transition-colors"
                >
                  Expand all
                </button>
                <button
                  onClick={collapseAll}
                  className="hover:text-[#cccccc] transition-colors"
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
                // First group is expanded by default; rest follow explicit state.
                const isExpanded = expandedFiles[group.filePath] ?? (groupIdx === 0);
                return (
                  <div key={group.filePath}>
                    {/* File Header */}
                    <div
                      className="flex items-center gap-1.5 hover:bg-[#2a2d2e] px-1 py-0.5 rounded cursor-pointer text-[13px] transition-colors"
                      onClick={() => toggleFile(group.filePath)}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-[#858585]" />
                      ) : (
                        <ChevronRight size={14} className="text-[#858585]" />
                      )}
                      <File size={14} className="text-[#858585]" />
                      <span className="truncate flex-1">{group.filePath}</span>
                      <span className="text-[10px] text-[#858585] ml-auto">
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
            <div className="flex items-center justify-center text-[#858585] text-[13px] py-8">
              No results found for &ldquo;{searchText}&rdquo;
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#858585] text-[13px] select-none">
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
      className="flex flex-col pl-2 border-l border-[#3e3e3e] hover:bg-[#2a2d2e] rounded-sm cursor-pointer transition-colors py-0.5"
      title={`Click to open at line ${match.line}`}
    >
      <div className="text-[11px] text-[#858585]">Line {match.line}</div>
      <div className="text-[13px] pl-1 text-[#cccccc] whitespace-pre overflow-hidden text-ellipsis">
        <span>{parts.before}</span>
        <span className="bg-[#f14c4c]/30 text-white rounded-sm px-0.5">
          {parts.matched}
        </span>
        <span>{parts.after}</span>
      </div>
    </div>
  );
}
