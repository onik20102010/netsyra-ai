"use client";

import React, { useState, useMemo } from "react";
import { useIdeStore } from "@/ide";
import type { Problem } from "@/ide/types";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  FileText,
  CheckCircle2,
  Filter,
  X,
} from "lucide-react";

type SeverityFilter = "error" | "warning" | "info";

interface FileGroup {
  fileId: string;
  filePath: string;
  fileName: string;
  problems: Problem[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

export function ProblemsPanel() {
  const problems = useIdeStore((s) => s.problems);
  const openFile = useIdeStore((s) => s.openFile);
  const openFiles = useIdeStore((s) => s.openFiles);
  const clearProblems = useIdeStore((s) => s.clearProblems);

  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Set<SeverityFilter>>(
    new Set(["error", "warning", "info"])
  );

  const allProblems = useMemo(
    () => Object.values(problems).flat(),
    [problems]
  );

  const errorCount = allProblems.filter((p) => p.severity === "error").length;
  const warningCount = allProblems.filter((p) => p.severity === "warning").length;
  const infoCount = allProblems.filter((p) => p.severity === "info").length;

  const filteredProblems = useMemo(
    () => allProblems.filter((p) => activeFilters.has(p.severity as SeverityFilter)),
    [allProblems, activeFilters]
  );

  // Group problems by file
  const fileGroups: FileGroup[] = useMemo(() => {
    const groupMap = new Map<string, FileGroup>();
    for (const p of filteredProblems) {
      if (!groupMap.has(p.fileId)) {
        const file = openFiles.find((f) => f.id === p.fileId);
        const filePath = file?.path || "unknown";
        const fileName = filePath.split("/").pop() || filePath;
        groupMap.set(p.fileId, {
          fileId: p.fileId,
          filePath,
          fileName,
          problems: [],
          errorCount: 0,
          warningCount: 0,
          infoCount: 0,
        });
      }
      const group = groupMap.get(p.fileId)!;
      group.problems.push(p);
      if (p.severity === "error") group.errorCount++;
      else if (p.severity === "warning") group.warningCount++;
      else group.infoCount++;
    }
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.errorCount !== b.errorCount) return b.errorCount - a.errorCount;
      return a.fileName.localeCompare(b.fileName);
    });
  }, [filteredProblems, openFiles]);

  const toggleFileCollapse = (fileId: string) => {
    setCollapsedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const toggleFilter = (filter: SeverityFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const handleJump = (fileId: string, line: number, column: number) => {
    openFile(fileId);
    const editor = (window as any).__netsyraEditor;
    if (editor) {
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column });
      editor.focus();
    }
  };

  const handleClearAll = () => {
    for (const fileId of Object.keys(problems)) {
      clearProblems(fileId);
    }
  };

  const severityIcon = (severity: string, size: number = 14) => {
    if (severity === "error")
      return <AlertCircle size={size} className="text-[#f85149] shrink-0" />;
    if (severity === "warning")
      return <AlertTriangle size={size} className="text-[#d29922] shrink-0" />;
    return <Info size={size} className="text-[#58a6ff] shrink-0" />;
  };

  // --- Empty State ---
  if (allProblems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] select-none gap-3">
        <CheckCircle2 size={32} className="text-[#3fb950]" />
        <div className="text-[13px] text-[#6e7681]">
          No problems have been detected in the workspace.
        </div>
        <div className="text-[11px] text-[#484f58]">
          Errors and warnings from ESLint and TypeScript will appear here.
        </div>
      </div>
    );
  }

  // --- Filtered-out State ---
  if (filteredProblems.length === 0 && allProblems.length > 0) {
    return (
      <div className="flex-1 flex flex-col bg-[#0d1117] select-none">
        <FilterBar
          errorCount={errorCount}
          warningCount={warningCount}
          infoCount={infoCount}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          onClearAll={handleClearAll}
        />
        <div className="flex-1 flex items-center justify-center text-[#6e7681] text-[13px]">
          No problems match the current filter.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] select-none">
      {/* Filter Bar */}
      <FilterBar
        errorCount={errorCount}
        warningCount={warningCount}
        infoCount={infoCount}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        onClearAll={handleClearAll}
      />

      {/* Problem List */}
      <div className="flex-1 overflow-y-auto">
        {fileGroups.map((group) => {
          const isCollapsed = collapsedFiles.has(group.fileId);
          return (
            <div key={group.fileId}>
              {/* File Header */}
              <div
                className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#161b22] cursor-pointer transition-colors group"
                onClick={() => toggleFileCollapse(group.fileId)}
              >
                {isCollapsed ? (
                  <ChevronRight size={14} className="text-[#6e7681] shrink-0" />
                ) : (
                  <ChevronDown size={14} className="text-[#6e7681] shrink-0" />
                )}
                <FileText size={13} className="text-[#58a6ff] shrink-0" />
                <span className="text-[12px] text-[#e6edf3] truncate flex-1 min-w-0">
                  {group.fileName}
                </span>
                <span className="text-[11px] text-[#484f58] truncate hidden sm:inline">
                  {group.filePath}
                </span>
                {/* Per-file severity badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {group.errorCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-[#f85149]">
                      <AlertCircle size={11} />
                      {group.errorCount}
                    </span>
                  )}
                  {group.warningCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-[#d29922]">
                      <AlertTriangle size={11} />
                      {group.warningCount}
                    </span>
                  )}
                  {group.infoCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-[#58a6ff]">
                      <Info size={11} />
                      {group.infoCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Problem Items */}
              {!isCollapsed && (
                <div>
                  {group.problems.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 pl-7 pr-3 py-[3px] hover:bg-[#161b22] cursor-pointer transition-colors"
                      onClick={() => handleJump(p.fileId, p.line, p.column)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {severityIcon(p.severity, 13)}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1 min-w-0 gap-0.5">
                        <span className="text-[12.5px] text-[#e6edf3] leading-tight">
                          {p.message}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-[#6e7681]">
                          <span className="shrink-0">
                            Ln {p.line}, Col {p.column}
                          </span>
                          {p.source && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1f2428] text-[10px] text-[#8b949e] font-mono shrink-0">
                              {p.source}
                            </span>
                          )}
                          {p.fix && (
                            <span className="text-[10px] text-[#3fb950] shrink-0">
                              fixable
                            </span>
                          )}
                        </div>
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
  );
}

// --- Filter Bar Sub-component ---
interface FilterBarProps {
  errorCount: number;
  warningCount: number;
  infoCount: number;
  activeFilters: Set<SeverityFilter>;
  toggleFilter: (filter: SeverityFilter) => void;
  onClearAll: () => void;
}

function FilterBar({
  errorCount,
  warningCount,
  infoCount,
  activeFilters,
  toggleFilter,
  onClearAll,
}: FilterBarProps) {
  const filterButtons: {
    type: SeverityFilter;
    count: number;
    icon: React.ReactNode;
    activeColor: string;
    inactiveColor: string;
  }[] = [
    {
      type: "error",
      count: errorCount,
      icon: <AlertCircle size={12} />,
      activeColor: "text-[#f85149] bg-[#f85149]/10 border-[#f85149]/30",
      inactiveColor: "text-[#484f58] border-[#30363d] opacity-50",
    },
    {
      type: "warning",
      count: warningCount,
      icon: <AlertTriangle size={12} />,
      activeColor: "text-[#d29922] bg-[#d29922]/10 border-[#d29922]/30",
      inactiveColor: "text-[#484f58] border-[#30363d] opacity-50",
    },
    {
      type: "info",
      count: infoCount,
      icon: <Info size={12} />,
      activeColor: "text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/30",
      inactiveColor: "text-[#484f58] border-[#30363d] opacity-50",
    },
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1f2428] shrink-0 bg-[#161b22]">
      <Filter size={12} className="text-[#6e7681] shrink-0" />

      {/* Severity filter buttons */}
      <div className="flex items-center gap-1.5">
        {filterButtons.map((btn) => {
          const isActive = activeFilters.has(btn.type);
          return (
            <button
              key={btn.type}
              onClick={() => toggleFilter(btn.type)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-all ${
                isActive ? btn.activeColor : btn.inactiveColor
              }`}
              title={`${isActive ? "Hide" : "Show"} ${btn.type}s`}
            >
              {btn.icon}
              <span>{btn.count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Clear all */}
      <button
        onClick={onClearAll}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#1f2428] transition-colors shrink-0"
        title="Clear all problems"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  );
}
