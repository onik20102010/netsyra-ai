"use client";
import { GitCommit, CheckCircle, Copy } from "lucide-react";

interface CommitCardProps {
  mainMessage: string;
  alternatives: string[];
  onSelect: (message: string) => void;
  onCancel: () => void;
}

export default function CommitCard({
  mainMessage,
  alternatives,
  onSelect,
  onCancel,
}: CommitCardProps) {
  return (
    <div className="mt-2 p-3 bg-[#1a1a2e] border border-[#3c3c4c] rounded-lg text-sm text-gray-300">
      <div className="flex items-center gap-2 mb-3">
        <GitCommit size={16} className="text-green-400" />
        <span className="font-medium">AI Generated Commit Message</span>
      </div>

      {/* Main suggestion */}
      <div className="p-2 bg-[#2d2d3d] rounded mb-3 cursor-pointer hover:bg-[#3d3d4d]"
        onClick={() => onSelect(mainMessage)}
      >
        <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{mainMessage}</pre>
        <div className="flex justify-end mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(mainMessage);
            }}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            <Copy size={12} />
          </button>
        </div>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Alternatives</div>
          {alternatives.map((alt, i) => (
            <div
              key={i}
              className="p-1.5 bg-[#252535] rounded mb-1 cursor-pointer hover:bg-[#3d3d4d] text-xs text-gray-300"
              onClick={() => onSelect(alt)}
            >
              <pre className="text-xs font-mono whitespace-pre-wrap">{alt}</pre>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onCancel}
        className="text-xs text-gray-500 hover:text-gray-300 w-full text-center py-1"
      >
        Cancel
      </button>
    </div>
  );
}