"use client";
import { Search, FileText, CheckCircle, XCircle } from "lucide-react";

interface RenamePreviewCardProps {
  oldName: string;
  newName: string;
  totalFiles: number;
  totalOccurrences: number;
  importChanges: number;
  exportChanges: number;
  onApprove: () => void;
  onReject: () => void;
}

export default function RenamePreviewCard({
  oldName,
  newName,
  totalFiles,
  totalOccurrences,
  importChanges,
  exportChanges,
  onApprove,
  onReject,
}: RenamePreviewCardProps) {
  return (
    <div className="mt-2 p-3 bg-[#1a1a2e] border border-[#3c3c4c] rounded-lg text-sm text-gray-300">
      <div className="flex items-center gap-2 mb-3">
        <Search size={16} className="text-blue-400" />
        <span className="font-medium">Rename Preview</span>
      </div>

      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-lg font-mono text-white">{oldName}</span>
        <span className="text-gray-500">→</span>
        <span className="text-lg font-mono text-green-400">{newName}</span>
      </div>

      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs">
          <FileText size={14} className="text-gray-400" />
          <span>{totalFiles} file(s) affected</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Search size={14} className="text-gray-400" />
          <span>{totalOccurrences} reference(s) found</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <FileText size={14} className="text-blue-400" />
          <span>{importChanges} import(s) updated</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <FileText size={14} className="text-green-400" />
          <span>{exportChanges} export(s) updated</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white rounded hover:bg-green-600 text-xs font-medium"
        >
          <CheckCircle size={14} /> Apply Rename
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