"use client";
import { AlertTriangle, CheckCircle, XCircle, FileText } from "lucide-react";

interface ErrorFixCardProps {
  totalErrors: number;
  errors: { file: string; line: number; message: string }[];
  fixPlan: { file: string; action: string }[];
  onApprove: () => void;
  onReject: () => void;
}

export default function ErrorFixCard({
  totalErrors,
  errors,
  fixPlan,
  onApprove,
  onReject,
}: ErrorFixCardProps) {
  return (
    <div className="mt-2 p-3 bg-[#1a1a2e] border border-[#3c3c4c] rounded-lg text-sm text-gray-300">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-red-400" />
        <span className="font-medium">Error Scan</span>
        <span className="ml-auto px-2 py-0.5 bg-red-900/30 text-red-400 rounded text-xs font-medium">
          {totalErrors} error(s)
        </span>
      </div>

      {/* Error list */}
      <div className="max-h-40 overflow-y-auto mb-3">
        {errors.map((err, i) => (
          <div key={i} className="flex items-start gap-2 text-xs py-0.5">
            <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-mono text-blue-400">{err.file}</span>
              <span className="text-gray-500">:{err.line}</span>
              <span className="text-gray-300 ml-1">{err.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Fix plan */}
      {fixPlan.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-green-400 font-medium mb-1 flex items-center gap-1">
            <CheckCircle size={12} /> Fix Plan
          </div>
          {fixPlan.map((item, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-gray-300 ml-4">
              <span className="font-mono text-blue-400">{item.file}</span>
              <span>→ {item.action}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white rounded hover:bg-green-600 text-xs font-medium"
        >
          <CheckCircle size={14} /> Fix All Errors
        </button>
        <button
          onClick={onReject}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-800 text-white rounded hover:bg-red-700 text-xs font-medium"
        >
          <XCircle size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}