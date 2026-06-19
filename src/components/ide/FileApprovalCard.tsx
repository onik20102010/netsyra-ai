"use client";
import { File, CheckCircle, XCircle } from "lucide-react";
import { ValidationError } from "@/lib/ide/brain/patch-validator";

export interface PendingFile {
  path: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "error";
  errors?: ValidationError[];
  type?: "file" | "diff";   // added for diff support
}

interface FileApprovalCardProps {
  files: PendingFile[];
  onAcceptFile: (path: string, content: string) => void;
  onRejectFile: (path: string) => void;
  onConfirmFile?: (path: string) => void;
  confirmingFile: string | null;
  onCommit: () => void;
  commitEnabled: boolean;
  validationErrors: ValidationError[];
}

// Helper to colorize diff lines
function DiffContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-y-auto bg-[#2d2d2d] p-2 rounded">
      {lines.map((line, i) => {
        let className = "text-gray-300";
        if (line.startsWith("+")) className = "text-green-400";
        else if (line.startsWith("-")) className = "text-red-400";
        else if (line.startsWith("@@")) className = "text-yellow-400";
        return (
          <div key={i} className={className}>
            {line}
          </div>
        );
      })}
    </pre>
  );
}

export default function FileApprovalCard({
  files,
  onAcceptFile,
  onRejectFile,
  onConfirmFile,
  confirmingFile,
  onCommit,
  commitEnabled,
  validationErrors,
}: FileApprovalCardProps) {
  if (files.length === 0) return null;

  const acceptedCount = files.filter(f => f.status === "accepted").length;

  return (
    <div className="mt-2 space-y-3">
      {files.map((file) => (
        <div
          key={file.path}
          className="p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg text-sm"
        >
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <File size={16} />
            <span className="font-mono text-blue-400 text-xs">{file.path}</span>
            {file.type === "diff" && (
              <span className="text-xs bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded">
                PATCH
              </span>
            )}
            {file.status !== "pending" && (
              <span
                className={`ml-auto text-xs font-medium ${
                  file.status === "accepted" ? "text-green-400" : 
                  file.status === "rejected" ? "text-red-400" : 
                  "text-yellow-400"
                }`}
              >
                {file.status === "accepted" ? "✓ Accepted" : 
                 file.status === "rejected" ? "✗ Rejected" : 
                 "⚠ Errors"}
              </span>
            )}
          </div>

          {/* Content display */}
          {file.type === "diff" ? (
            <DiffContent content={file.content} />
          ) : (
            <pre className="text-gray-300 mt-1 text-xs whitespace-pre-wrap max-h-64 overflow-y-auto bg-[#2d2d2d] p-2 rounded">
              {file.content}
            </pre>
          )}

          {/* Validation errors */}
          {file.errors && file.errors.length > 0 && (
            <div className="mt-2 bg-red-900/20 border border-red-800 rounded p-2">
              {file.errors.map((err, i) => (
                <div key={i} className="text-xs text-red-400">
                  ⚠ Line {err.line}: {err.message}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {file.status === "pending" && (
            confirmingFile === file.path ? (
              <div className="flex gap-2 mt-3 items-center">
                <span className="text-xs text-yellow-400">
                  {file.type === "diff"
                    ? "Apply this patch to your file?"
                    : "Write this file to your project?"}
                </span>
                <button
                  onClick={() => onAcceptFile(file.path, file.content)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white rounded hover:bg-green-600 text-xs font-medium"
                >
                  <CheckCircle size={14} /> Yes
                </button>
                <button
                  onClick={() => onRejectFile(file.path)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs font-medium"
                >
                  No
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onConfirmFile?.(file.path)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white rounded hover:bg-green-600 text-xs font-medium"
                >
                  <CheckCircle size={14} /> Accept
                </button>
                <button
                  onClick={() => onRejectFile(file.path)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-800 text-white rounded hover:bg-red-700 text-xs font-medium"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )
          )}
        </div>
      ))}

      {/* Commit section */}
      {commitEnabled && (
        <div className="mt-4 p-3 bg-[#252526] border border-[#3c3c3c] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">
              {acceptedCount} file(s) accepted
            </span>
            {validationErrors.length > 0 && (
              <span className="text-xs text-red-400">
                ⚠ {validationErrors.length} error(s) found
              </span>
            )}
          </div>
          <button
            onClick={onCommit}
            disabled={validationErrors.length > 0}
            className={`w-full py-2 rounded text-sm font-medium ${
              validationErrors.length > 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-green-700 text-white hover:bg-green-600"
            }`}
          >
            {validationErrors.length > 0
              ? "Fix errors before committing"
              : `Commit All Changes (${acceptedCount} files)`}
          </button>
        </div>
      )}
    </div>
  );
}