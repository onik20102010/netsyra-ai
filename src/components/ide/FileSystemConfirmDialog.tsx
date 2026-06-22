"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FolderOpen, CheckCircle } from "lucide-react";

interface FileSystemConfirmDialogProps {
  isOpen: boolean;
  files: { path: string; content: string }[];
  onConfirm: () => void;
  onCancel: () => void;
  projectName?: string;
}

export default function FileSystemConfirmDialog({
  isOpen,
  files,
  onConfirm,
  onCancel,
  projectName,
}: FileSystemConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-900/30 rounded-full">
            <AlertTriangle className="text-yellow-500" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-white">Confirm File Changes</h3>
        </div>

        {projectName && (
          <div className="mb-4 p-3 bg-[#2d2d2d] rounded-lg flex items-center gap-2">
            <FolderOpen className="text-blue-400" size={16} />
            <span className="text-sm text-gray-300">Project: {projectName}</span>
          </div>
        )}

        <p className="text-gray-300 mb-4">
          You are about to make {files.length} file change{files.length > 1 ? "s" : ""} to your local project.
          This will modify files on your device.
        </p>

        <div className="mb-4 max-h-48 overflow-y-auto bg-[#2d2d2d] rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2">Files to be modified:</div>
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 py-1 text-sm">
              <CheckCircle className="text-green-500" size={14} />
              <span className="text-gray-300 font-mono">{file.path}</span>
            </div>
          ))}
        </div>

        <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-500">
            ⚠️ These changes will be written directly to your local filesystem. Make sure you have a backup if needed.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
            className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-green-700 hover:bg-green-600 text-white"
          >
            Confirm Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
