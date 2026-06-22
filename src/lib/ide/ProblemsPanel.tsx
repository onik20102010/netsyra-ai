// src/components/ide/ProblemsPanel.tsx
"use client";
import { AlertTriangle, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { ValidationError } from "@/lib/ide/vnext/Validator";

interface ProblemsPanelProps {
  errors: ValidationError[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function ProblemsPanel({ errors, isOpen, onToggle }: ProblemsPanelProps) {
  if (errors.length === 0) return null;

  return (
    <div className="border-t border-[#2d2d2d] bg-[#1e1e1e] text-gray-300 text-xs">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[#2a2d2e]"
        onClick={onToggle}
      >
        <span className="flex items-center gap-1 text-yellow-400">
          <AlertTriangle size={14} />
          <span className="font-medium">{errors.length} problem{errors.length !== 1 ? "s" : ""}</span>
        </span>
        <span className="text-gray-500 flex-1" />
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </div>

      {/* List */}
      {isOpen && (
        <div className="max-h-40 overflow-y-auto border-t border-[#2d2d2d]">
          {errors.map((err, index) => (
            <div
              key={index}
              className="flex items-start gap-2 px-3 py-1.5 hover:bg-[#2a2d2e] border-b border-[#2d2d2d] last:border-b-0"
            >
              <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-gray-400 font-mono">{err.file}</span>
                {err.line ? (
                  <span className="text-gray-500 ml-1">:{err.line}</span>
                ) : null}
                <span className="mx-1 text-gray-500">–</span>
                <span className="text-gray-300">{err.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}