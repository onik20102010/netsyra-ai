"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Globe } from "lucide-react";

interface Source {
  title: string;
  url: string;
}

export default function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!sources.length) return null;

  return (
    <>
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(!open)}
        className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-sm transition"
      >
        <Globe size={14} className="text-cyan-500" />
        <span>{sources.length} source{sources.length > 1 ? "s" : ""}</span>
      </button>

      {/* Slide‑in panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-96 max-w-[85vw] bg-[#0f0f0f] border-l border-zinc-800 z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-100">Sources</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Source list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-800 transition group"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium group-hover:text-white truncate">
                        {source.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {source.url}
                      </p>
                    </div>
                    <ExternalLink size={14} className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-zinc-800 text-xs text-zinc-500">
                Click any link to open in a new tab
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}