"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
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

const paragraphs = [
  `Netsyra AI is an intelligent AI orchestration platform that routes every prompt to the smartest
  and most cost-efficient AI model. We combine the power of multiple AI providers into one seamless API,
  helping developers and businesses save up to 70% on AI costs while improving response quality.`,

  `Unlike traditional single‑model services, Netsyra automatically analyses every request in real time.
  A simple factual question is instantly handled by a lightweight, low‑cost model. A complex coding problem
  is automatically escalated to a deep‑reasoning engine. A question about current events instantly
  searches the live web and integrates the latest information into the answer. All of this happens
  behind a single, unified interface — the user only sees fast, accurate, and context‑aware responses.`,

  `Under the hood, Netsyra integrates with leading AI providers
  as well as local and self‑hosted models. Our intelligent router evaluates complexity,
  latency, token cost, and availability across providers, then selects the best model for every single
  message — no manual configuration required. For users who want full control, individual model tiers
  can be selected manually at any time.`,

  `The platform is built for speed and reliability. A live performance dashboard tracks latency, token usage,
  cost savings, and routing decisions in real time. Conversations are stored securely with per‑user encryption,
  and our context window is also very high level means the conversation history to maintain natural, flowing dialogue.
  Intelligent memory systems recall important user facts across sessions, so Netsyra learns about you
  without ever compromising privacy.`,

  `Netsyra AI is designed for developers, researchers, businesses, and anyone who demands the best from
  artificial intelligence — without the overhead of managing multiple API keys, provider contracts, and
  model benchmarks. From rapid prototyping to production‑grade applications, Netsyra delivers the right
  answer, from the right model, at the right cost — every single time.`,
];

export default function AboutPage() {
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl w-full space-y-8 text-center"
        >
          {/* Title */}
          <motion.h1
            variants={item}
            className="text-5xl md:text-6xl font-extrabold text-white tracking-tight"
          >
            About{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Netsyra AI
            </span>
          </motion.h1>

          {/* Paragraphs */}
          {paragraphs.map((text, index) => (
            <motion.p
              key={index}
              variants={item}
              className="text-white/50 leading-relaxed text-base md:text-lg"
            >
              {text}
            </motion.p>
          ))}

          {/* Back link */}
          <motion.div variants={item}>
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