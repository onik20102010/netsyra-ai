// d:\netsyra\src\components\ide\SearchPanel.tsx
"use client";

import React, { useState } from "react";
import { Search, X, ChevronDown, ChevronRight, Replace, File } from "lucide-react";

export function SearchPanel() {
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Mock search results for UI demonstration
  const searchResults = [
    { file: "src/components/ide/EditorArea.tsx", line: 24, text: "const editorRef = useRef<..." },
    { file: "src/components/ide/EditorArea.tsx", line: 45, text: "const handleMount = useCallback(..." },
    { file: "src/components/ide/TabBar.tsx", line: 12, text: "export function TabBar() {" },
    { file: "src/ide/store.ts", line: 30, text: "export const useIdeStore = create<IdeStore>()" },
  ];

  // Toggle file expansion in results
  const toggleFile = (filePath: string) => {
    setExpandedFiles((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] p-2 select-none">
      
      {/* --- Search Inputs --- */}
      <div className="mb-4 space-y-2">
        {/* Search Box */}
        <div className="flex items-center relative">
          <Search size={14} className="absolute left-2 text-[#858585]" />
          <input
            type="text"
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-[#3c3c3c] text-[#cccccc] text-[13px] py-1.5 pl-7 pr-8 rounded-sm border border-transparent focus:border-[#007acc] outline-none placeholder-[#858585] transition-colors"
          />
          {searchText && (
            <X
              size={14}
              className="absolute right-2 text-[#858585] hover:text-white cursor-pointer transition-colors"
              onClick={() => setSearchText("")}
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

        {/* Replace Box */}
        {isReplaceOpen && (
          <div className="flex items-center relative">
            <Replace size={14} className="absolute left-2 text-[#858585]" />
            <input
              type="text"
              placeholder="Replace"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="w-full bg-[#3c3c3c] text-[#cccccc] text-[13px] py-1.5 pl-7 pr-8 rounded-sm border border-transparent focus:border-[#007acc] outline-none placeholder-[#858585] transition-colors"
            />
            {replaceText && (
              <X
                size={14}
                className="absolute right-2 text-[#858585] hover:text-white cursor-pointer transition-colors"
                onClick={() => setReplaceText("")}
              />
            )}
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

      {/* --- Search Results --- */}
      {searchText ? (
        <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
          <div className="text-[12px] text-[#858585] pb-2">
            {searchResults.length} results found
          </div>
          
          <div className="space-y-1">
            {Array.from(new Set(searchResults.map((r) => r.file))).map((file) => {
              const fileResults = searchResults.filter((r) => r.file === file);
              const isExpanded = expandedFiles[file];

              return (
                <div key={file}>
                  {/* File Header */}
                  <div
                    className="flex items-center gap-1.5 hover:bg-[#2a2d2e] px-1 py-0.5 rounded cursor-pointer text-[13px] transition-colors"
                    onClick={() => toggleFile(file)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-[#858585]" />
                    ) : (
                      <ChevronRight size={14} className="text-[#858585]" />
                    )}
                    <File size={14} className="text-[#858585]" />
                    <span className="truncate flex-1">{file}</span>
                    <span className="text-[10px] text-[#858585] ml-auto">
                      {fileResults.length}
                    </span>
                  </div>

                  {/* File Matches (collapsible) */}
                  {isExpanded && (
                    <div className="pl-4 space-y-0.5">
                      {fileResults.map((result, idx) => (
                        <div key={idx} className="flex flex-col pl-2 border-l border-[#3e3e3e] hover:bg-[#2a2d2e] rounded-sm cursor-pointer transition-colors py-0.5">
                          <div className="text-[11px] text-[#858585]">Line {result.line}</div>
                          <div className="text-[13px] pl-1 text-[#cccccc]">
                            {result.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#858585] text-[13px] select-none">
          No search results
        </div>
      )}
    </div>
  );
}