"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, BrainCircuit, Globe, Code, Plus } from "lucide-react";

const AutoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    <circle cx="12" cy="12" r="10" strokeDasharray="4 2" opacity="0.4" />
  </svg>
);

const FastIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 2 19 12 12 12 17 22 3 9 10 9 13 2" />
  </svg>
);

const models = [
  { id: "auto", name: "Auto", icon: AutoIcon, desc: "Smart routing" },
  { id: "fast", name: "N Fast", icon: FastIcon, desc: "Instant" },
  { id: "plus", name: "N Plus", icon: Cpu, desc: "Balanced" },
  { id: "pro",  name: "N Pro",  icon: BrainCircuit, desc: "Deep reasoning" },
  { id: "live", name: "N Live", icon: Globe, desc: "Real‑time" },
  { id: "code", name: "N Code", icon: Code, desc: "Expert coding" },
];

export default function ModelSelector({
  selected,
  onSelect,
  upward = false,
}: {
  selected: string;
  onSelect: (id: string) => void;
  upward?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 shadow-sm transition-all"
        title="Select model"
      >
        <Plus className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: upward ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: upward ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-500/10 p-2 z-50 ${
              upward ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            <p className="text-xs text-gray-400 px-3 py-1">Select Model</p>
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  selected === model.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <model.icon />
                <div className="text-left">
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-gray-400">{model.desc}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}