"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, CheckCircle, Loader2 } from "lucide-react";

export type AgentStep = {
  key: string;
  label: string;
  status: "pending" | "working" | "done";
};

interface AgentPipelineProps {
  steps: AgentStep[];
  expanded: boolean;
  onToggle: () => void;
}

const statusColors: Record<string, string> = {
  pending: "#9e9e9e",
  working: "#4f8cff",
  done: "#4caf50",
};

export default function AgentPipeline({ steps, expanded, onToggle }: AgentPipelineProps) {
  return (
    <div className="mb-3 p-3 bg-[#181818] border border-[#2d2d2d] rounded-lg text-sm">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-[#d4d4d4] font-medium w-full text-left"
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="chat-header uppercase tracking-wide">Netsyra Agent</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-1.5 overflow-hidden"
          >
            {steps.map(step => (
              <div
                key={step.key}
                className="flex items-center gap-2 text-[13px]"
                style={{ color: statusColors[step.status] }}
              >
                {step.status === "done" ? (
                  <CheckCircle size={14} />
                ) : step.status === "working" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-current opacity-40" />
                )}
                <span className={step.status === "pending" ? "opacity-50" : ""}>{step.label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}