"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  Cpu,
  BrainCircuit,
  Globe,
  Code,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 25 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const values = [
  {
    icon: BrainCircuit,
    title: "Intelligent by Design",
    desc: "Every prompt is analyzed in real time. Complexity, cost, latency, and context determine which model responds—no manual tuning required.",
  },
  {
    icon: TrendingUp,
    title: "Radically Efficient",
    desc: "Our routing engine slashes AI costs by up to 70% while improving response quality. Lightweight models handle the routine; premium models tackle the complex.",
  },
  {
    icon: Globe,
    title: "Universally Accessible",
    desc: "One API, all major providers under a single intelligent layer with better efficiency.",
  },
  {
    icon: Users,
    title: "Built for Builders",
    desc: "Designed for developers, researchers, and businesses who demand performance without the overhead of managing multiple keys, contracts, and benchmarks.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    desc: "Conversations of the users are used to improve our models and achieve our goals quickly in a month.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    desc: "Optimized infrastructure and intelligent caching deliver responses in under 7 seconds—often much less.",
  },
];

const differentiators = [
  {
    icon: Cpu,
    label: "Multi‑Provider Routing",
    detail:
      "Automatically selects the best model, and more—per request, in real time.",
  },
  {
    icon: Code,
    label: "Developer‑First API",
    detail:
      "Clean, RESTful endpoints. Drop‑in integration with existing workflows. No complex configuration.",
  },
  {
    icon: BrainCircuit,
    label: "Context‑Aware Memory",
    detail:
      "Remembers user preferences and facts across sessions without compromising privacy.",
  },
  {
    icon: Globe,
    label: "Real‑Time Web Search",
    detail:
      "Live queries trigger instant web searches, delivering current information alongside AI reasoning.",
  },
];

export default function GoalPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 relative overflow-hidden">
      {/* Background animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-900/20 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-900/20 blur-[120px]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-20"
        >
          {/* Hero section */}
          <motion.div variants={item} className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight">
              The Future of{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Orchestration
              </span>
            </h1>
            <p className="text-white/50 text-lg max-w-3xl mx-auto leading-relaxed">
              We're building the standard layer for AI‑powered applications—where every prompt
              finds its perfect model, automatically.
            </p>
          </motion.div>

          {/* Values grid */}
          <motion.div
            variants={container}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {values.map((v, i) => (
              <motion.div
                key={i}
                variants={item}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <v.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{v.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Mission statement */}
          <motion.div
            variants={item}
            className="text-center max-w-3xl mx-auto space-y-4 p-8 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10"
          >
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            <p className="text-white/50 leading-relaxed">
              To make AI accessible, affordable, and intelligent for everyone. We believe no single
              model is perfect for every task—so we built Netsyra to route each request to the
              best model automatically. We aim to become the definitive orchestration layer for
              AI‑powered applications worldwide.
            </p>
          </motion.div>

          {/* Differentiators */}
          <motion.div variants={container} className="space-y-6">
            <motion.h2
              variants={item}
              className="text-3xl font-bold text-white text-center"
            >
              What Sets Us Apart
            </motion.h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {differentiators.map((d, i) => (
                <motion.div
                  key={i}
                  variants={item}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <d.icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">{d.label}</h4>
                    <p className="text-white/40 text-xs mt-1 leading-relaxed">{d.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Back link */}
          <motion.div variants={item} className="text-center">
            <Link
              href="/"
              className="inline-block text-purple-400 hover:text-purple-300 underline underline-offset-4 transition text-sm"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}