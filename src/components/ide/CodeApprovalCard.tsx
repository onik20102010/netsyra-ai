"use client";

import React, { useState } from "react";
import { Check, X, FileCode, Copy } from "lucide-react";

interface CodeApprovalCardProps {
  filePath: string;
  content: string;
  onAccept: () => void;
  onReject: () => void;
  isAccepted?: boolean;
  isRejected?: boolean;
}

export default function CodeApprovalCard({
  filePath,
  content,
  onAccept,
  onReject,
  isAccepted = false,
  isRejected = false,
}: CodeApprovalCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract file name from path
  const fileName = filePath.split("/").pop() || filePath;
  const directoryPath = filePath.substring(0, filePath.lastIndexOf("/")) || "/";

  return (
    <div className="my-4 rounded-lg border border-gray-700 bg-gray-900/50 overflow-hidden">
      {/* Header with file info */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{fileName}</span>
            <span className="text-xs text-gray-400">{directoryPath}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="Copy code"
        >
          <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* Code content */}
      <div className="p-4 bg-gray-900/30">
        <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono">
          {content}
        </pre>
      </div>

      {/* Action buttons */}
      {!isAccepted && !isRejected && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-800/30 border-t border-gray-700">
          <button
            onClick={onReject}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors border border-red-600/30"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors border border-green-600/30"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
        </div>
      )}

      {/* Status indicators */}
      {isAccepted && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600/10 border-t border-green-600/30">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Changes accepted</span>
        </div>
      )}
      {isRejected && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 border-t border-red-600/30">
          <X className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">Changes rejected</span>
        </div>
      )}
    </div>
  );
}
