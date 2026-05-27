"use client";
import { motion } from "framer-motion";
import { Cpu, Zap, BrainCircuit, Globe, Code, Sparkles } from "lucide-react";

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
  return (
    <div className="flex gap-1.5 flex-wrap">
      {models.map((model) => (
        <motion.button
          key={model.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(model.id)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === model.id
              ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
              : "text-gray-500 border border-transparent hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <model.icon className="w-4 h-4" />
          {model.name}
          {selected === model.id && (
            <motion.div
              layoutId="activeModel"
              className="absolute inset-0 rounded-full bg-indigo-50 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}