"use client";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Cpu, BrainCircuit, Globe, Code, Bot, Sparkles } from "lucide-react";
import Link from "next/link";

const models = [
  {
    id: "fast",
    name: "N Fast",
    icon: Zap,
    desc: "Instant answers for simple queries.",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    id: "plus",
    name: "N Plus",
    icon: Cpu,
    desc: "Balanced reasoning with clear explanations.",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    id: "pro",
    name: "N Pro",
    icon: BrainCircuit,
    desc: "Deep analysis and step‑by‑step thinking.",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    id: "live",
    name: "N Live",
    icon: Globe,
    desc: "Real‑time web data and Wikipedia integration by activate the dive deep mode.",
    gradient: "from-orange-400 to-red-500",
  },
  {
    id: "code",
    name: "N Code",
    icon: Code,
    desc: "Expert coding assistant for production code.",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    id: "aai",
    name: "N AAI",
    icon: Bot,
    desc: "Multi-step agentic workflows and autonomous execution.",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    id: "auto",
    name: "N Auto",
    icon: Sparkles,
    desc: "Automatic model routing based on your prompt intent.",
    gradient: "from-amber-400 to-orange-500",
  },
];

export default function CTASection() {
  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 select-none">
      {/* Soft radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="space-y-10"
        >
          {/* Heading */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Choose Your AI Model
            </span>
            <h2 className="text-3xl sm:text-4xl sm:text-5xl font-bold text-white">
              Ready to start a conversation?
            </h2>
            <p className="text-base sm:text-lg text-white/40 max-w-xl mx-auto">
              Select a model below - each models is best for it's work.
            </p>
          </div>

          {/* Model cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 max-w-5xl mx-auto">
            {models.map((model) => (
              <motion.div
                key={model.id}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 text-left hover:border-white/20 transition-all"
              >
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 space-y-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${model.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <model.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-white font-semibold">{model.name}</h3>
                    <p className="text-white/40 text-xs leading-relaxed">
                      {model.desc}
                    </p>
                  </div>
                  <Link
                    href={`/chat?model=${model.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
                  >
                    Start Chat <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* General chat button */}
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            Open Chat Page
          </Link>
        </motion.div>
      </div>
    </section>
  );
}