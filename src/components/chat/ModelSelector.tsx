"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Zap, BrainCircuit, Globe, Code, Sparkles, ChevronDown
} from "lucide-react";

const models = [
  { id: "auto", name: "Auto", icon: Sparkles, desc: "Smart routing" },
  { id: "fast", name: "N Fast", icon: Zap, desc: "Instant" },
  { id: "plus", name: "N Plus", icon: Cpu, desc: "Balanced" },
  { id: "pro",  name: "N Pro",  icon: BrainCircuit, desc: "Deep reasoning" },
  { id: "live", name: "N Live", icon: Globe, desc: "Real‑time" },
  { id: "code", name: "N Code", icon: Code, desc: "Expert coding" },
];

export default function ModelSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentModel = models.find((m) => m.id === selected) || models[0];
  const Icon = currentModel.icon;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-gray-300 shadow-sm transition-all"
      >
        <Icon className="w-4 h-4 text-indigo-500" />
        <span>{currentModel.name}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-500/10 p-2 z-50"
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
                <model.icon className="w-4 h-4" />
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