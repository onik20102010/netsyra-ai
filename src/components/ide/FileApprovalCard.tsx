"use client";
import { File, CheckCircle, XCircle, HardDrive } from "lucide-react";
import { useState } from "react";
import FileSystemConfirmDialog from "./FileSystemConfirmDialog";
import { getFileSystemManager } from "@/lib/ide/file-system-manager";

export interface PendingFile {
  path: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "error";
  type?: "file" | "diff";   // added for diff support
}

interface FileApprovalCardProps {
  files: PendingFile[];
  onAcceptFile: (path: string, content: string) => void;
  onRejectFile: (path: string) => void;
  onConfirmFile?: (path: string, content: string) => void;
  onCommit: () => void;
  commitEnabled: boolean;
  useFileSystem?: boolean;  // New prop to enable file system operations
  projectName?: string;
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
  onCommit,
  commitEnabled,
  useFileSystem = false,
  projectName,
}: FileApprovalCardProps) {
  if (files.length === 0) return null;

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ path: string; content: string }[]>([]);

  const acceptedCount = files.filter(f => f.status === "accepted").length;

  const handleAcceptFile = (path: string, content: string) => {
    if (useFileSystem) {
      // For file system mode, collect files and show confirmation dialog
      setPendingFiles([{ path, content }]);
      setShowConfirmDialog(true);
    } else {
      // For regular mode, use the existing callback
      onConfirmFile?.(path, content);
    }
  };

  const handleConfirmFileSystem = async () => {
    try {
      const fsManager = getFileSystemManager();
      
      // Verify permission
      const hasPermission = await fsManager.verifyPermission();
      if (!hasPermission) {
        alert("Permission denied. Please grant access to write files.");
        setShowConfirmDialog(false);
        return;
      }

      // Write all pending files to the filesystem
      for (const file of pendingFiles) {
        await fsManager.writeFile(file.path, file.content);
      }

      // Call the original accept callback
      for (const file of pendingFiles) {
        onConfirmFile?.(file.path, file.content);
      }

      setShowConfirmDialog(false);
      setPendingFiles([]);
    } catch (error) {
      console.error("Failed to write files:", error);
      alert("Failed to save files to your device. Please try again.");
      setShowConfirmDialog(false);
    }
  };

  const handleCommitWithFileSystem = async () => {
    if (useFileSystem) {
      const acceptedFiles = files.filter(f => f.status === "accepted");
      setPendingFiles(acceptedFiles.map(f => ({ path: f.path, content: f.content })));
      setShowConfirmDialog(true);
    } else {
      onCommit();
    }
  };

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

          {/* Action buttons – single Accept / Reject */}
          {file.status === "pending" && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleAcceptFile(file.path, file.content)}
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
            {useFileSystem && (
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <HardDrive size={12} />
                <span>Local File System</span>
              </div>
            )}
          </div>
          <button
            onClick={handleCommitWithFileSystem}
            disabled={!commitEnabled}
            className={`w-full py-2 rounded text-sm font-medium ${
              !commitEnabled
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-green-700 text-white hover:bg-green-600"
            }`}
          >
            {useFileSystem
              ? `Save to Device (${acceptedCount} files)`
              : `Commit All Changes (${acceptedCount} files)`}
          </button>
        </div>
      )}

      {/* File System Confirmation Dialog */}
      <FileSystemConfirmDialog
        isOpen={showConfirmDialog}
        files={pendingFiles}
        onConfirm={handleConfirmFileSystem}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingFiles([]);
        }}
        projectName={projectName}
      />
    </div>
  );
}