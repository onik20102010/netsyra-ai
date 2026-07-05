"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Globe } from "lucide-react";

interface Source {
  title: string;
  url: string;
}

export default function SourcesDropdown({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);

  if (!sources.length) return null;

  return (
    <div className="relative mt-2 inline-block">
      {/* Trigger button – Grok style */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition px-3 py-1.5 rounded-lg border border-zinc-800 bg-[#0a0a0a]"
      >
        <Globe size={14} className="text-cyan-400" />
        <span>{sources.length} source{sources.length > 1 ? "s" : ""}</span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute bottom-full mb-1 left-0 w-80 max-w-[calc(100vw-2rem)] bg-[#171717] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="max-h-60 overflow-y-auto">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 last:border-0 transition"
              >
                {/* Cyan dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate">{source.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{source.url}</p>
                </div>
                <ExternalLink size={12} className="text-zinc-600 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}