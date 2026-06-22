"use client";
import { motion, AnimatePresence } from "framer-motion";
import { File, ShieldAlert, CheckCircle, XCircle } from "lucide-react";

interface PermissionModalProps {
  isOpen: boolean;
  filePath: string;
  fileContent: string;
  onApprove: () => void;
  onDeny: () => void;
}

export default function PermissionModal({
  isOpen,
  filePath,
  fileContent,
  onApprove,
  onDeny,
}: PermissionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onDeny}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md mx-4 bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2d2d2d]">
              <ShieldAlert size={20} className="text-yellow-400" />
              <div>
                <div className="text-sm font-medium text-white">Allow file modification?</div>
                <div className="text-xs text-[#8b949e]">Netsyra AI wants to write a file</div>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <File size={14} className="text-blue-400" />
                <span className="font-mono text-blue-400">{filePath}</span>
              </div>
              <pre className="text-xs text-[#d4d4d4] bg-[#2d2d2d] p-3 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                {fileContent.slice(0, 500)}
                {fileContent.length > 500 ? "\n…" : ""}
              </pre>
            </div>
            <div className="flex border-t border-[#2d2d2d]">
              <button
                onClick={onDeny}
                className="flex-1 px-4 py-3 text-sm text-[#d4d4d4] hover:bg-[#2a2d2e] transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={16} className="text-red-400" />
                Deny
              </button>
              <div className="w-px bg-[#2d2d2d]" />
              <button
                onClick={onApprove}
                className="flex-1 px-4 py-3 text-sm text-white bg-[#0e639c] hover:bg-[#1177bb] transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} className="text-green-400" />
                Allow
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}