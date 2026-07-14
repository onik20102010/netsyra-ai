"use client";

import React, { useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";

interface NCodeModalProps {
  open: boolean;
  onClose: () => void;
  nCode: string | null;
  onDone?: () => void;
  showDone?: boolean;
  title?: string;
}

export function NCodeModal({
  open,
  onClose,
  nCode,
  onDone,
  showDone = true,
  title = "Your N code",
}: NCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!nCode) return;
    try {
      await navigator.clipboard.writeText(nCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [nCode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-white/90 border border-white/30 shadow-2xl p-8 rounded-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
          {title}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Save this code. You can always view it from your email menu.
        </p>

        <div className="bg-slate-100 border border-slate-200 rounded-none p-6 flex items-center justify-center mb-6">
          <span className="text-4xl font-mono font-semibold text-slate-900 tracking-widest">
            {nCode ?? "------"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copy}
            disabled={!nCode}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>

          {showDone && (
            <button
              onClick={onDone}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
