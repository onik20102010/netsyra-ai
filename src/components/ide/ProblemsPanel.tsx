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
      return <AlertCircle size={size} className="text-red-500 shrink-0" />;
    if (severity === "warning")
      return <AlertTriangle size={size} className="text-yellow-500 shrink-0" />;
    return <Info size={size} className="text-blue-500 shrink-0" />;
  };

  // --- Empty State ---
  if (allProblems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e1e] select-none gap-3">
        <CheckCircle2 size={32} className="text-green-600" />
        <div className="text-[13px] text-[#858585]">
          No problems have been detected in the workspace.
        </div>
        <div className="text-[11px] text-[#6a6a6a]">
          Errors and warnings from ESLint and TypeScript will appear here.
        </div>
      </div>
    );
  }

  // --- Filtered-out State ---
  if (filteredProblems.length === 0 && allProblems.length > 0) {
    return (
      <div className="flex-1 flex flex-col bg-[#1e1e1e] select-none">
        <FilterBar
          errorCount={errorCount}
          warningCount={warningCount}
          infoCount={infoCount}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          onClearAll={handleClearAll}
        />
        <div className="flex-1 flex items-center justify-center text-[#858585] text-[13px]">
          No problems match the current filter.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] select-none">
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
                className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer transition-colors group"
                onClick={() => toggleFileCollapse(group.fileId)}
              >
                {isCollapsed ? (
                  <ChevronRight size={14} className="text-[#858585] shrink-0" />
                ) : (
                  <ChevronDown size={14} className="text-[#858585] shrink-0" />
                )}
                <FileText size={13} className="text-[#519aba] shrink-0" />
                <span className="text-[12px] text-[#cccccc] truncate flex-1 min-w-0">
                  {group.fileName}
                </span>
                <span className="text-[11px] text-[#6a6a6a] truncate hidden sm:inline">
                  {group.filePath}
                </span>
                {/* Per-file severity badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {group.errorCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-red-400">
                      <AlertCircle size={11} />
                      {group.errorCount}
                    </span>
                  )}
                  {group.warningCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-yellow-400">
                      <AlertTriangle size={11} />
                      {group.warningCount}
                    </span>
                  )}
                  {group.infoCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-blue-400">
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
                      className="flex items-start gap-2 pl-7 pr-3 py-[3px] hover:bg-[#2a2d2e] cursor-pointer transition-colors"
                      onClick={() => handleJump(p.fileId, p.line, p.column)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {severityIcon(p.severity, 13)}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1 min-w-0 gap-0.5">
                        <span className="text-[12.5px] text-[#cccccc] leading-tight">
                          {p.message}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-[#858585]">
                          <span className="shrink-0">
                            Ln {p.line}, Col {p.column}
                          </span>
                          {p.source && (
                            <span className="px-1.5 py-0.5 rounded bg-[#3c3c3c] text-[10px] text-[#9d9d9d] font-mono shrink-0">
                              {p.source}
                            </span>
                          )}
                          {p.fix && (
                            <span className="text-[10px] text-green-500 shrink-0">
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
      activeColor: "text-red-400 bg-red-500/10 border-red-500/30",
      inactiveColor: "text-[#5a5a5a] border-[#3c3c3c] opacity-50",
    },
    {
      type: "warning",
      count: warningCount,
      icon: <AlertTriangle size={12} />,
      activeColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
      inactiveColor: "text-[#5a5a5a] border-[#3c3c3c] opacity-50",
    },
    {
      type: "info",
      count: infoCount,
      icon: <Info size={12} />,
      activeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      inactiveColor: "text-[#5a5a5a] border-[#3c3c3c] opacity-50",
    },
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#2d2d2d] shrink-0">
      <Filter size={12} className="text-[#6a6a6a] shrink-0" />

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
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#6a6a6a] hover:text-[#cccccc] hover:bg-[#2a2d2e] transition-colors shrink-0"
        title="Clear all problems"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  );
}
