"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Activity } from "lucide-react";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

const transition = {
  duration: 0.7,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16 select-none">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[600px] rounded-full blur-[150px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          {/* Badge */}
          <motion.div variants={item} transition={transition}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              New Era of AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            transition={transition}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.15]"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-rotate bg-[length:200%_auto]">Netsyra</span>
            <span className="text-white"> AI </span>
            <br />
            <span className="text-white">New generic AI</span>
          </motion.h1>

          {/* Detailed description */}
          <motion.p
            variants={item}
            transition={transition}
            className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed"
          >
            Netsyra AI is an advanced orchestration layer that intelligently
            routes every prompt to the best AI model — automatically balancing
            speed, cost, and accuracy.
          </motion.p>

          {/* Key benefits */}
          <motion.div
            variants={item}
            transition={transition}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left"
          >
            {[
              { icon: Zap, title: "Instant Routing", desc: "Simple questions go to fast, cheap models. Complex problems reach deep‑reasoning AI." },
              { icon: Shield, title: "70% Cost Reduction", desc: "Lightweight models handle everyday tasks, slashing your AI bill without sacrificing quality." },
              { icon: Activity, title: "Real‑Time Analytics", desc: "Monitor usage, latency, and routing decisions from a beautiful dashboard." },
              { icon: Sparkles, title: "One Unified API", desc: "Integrate once — access all major providers and your private models simultaneously." },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
              >
                <benefit.icon className="w-8 h-8 text-indigo-400 mb-3" />
                <h3 className="text-white font-semibold mb-1">{benefit.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={item}
            transition={transition}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <Link href="/chat">
              <Button className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg rounded-full font-medium shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]">
                <Sparkles className="mr-2 w-5 h-5" />
                Start Chatting
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-full backdrop-blur-sm transition-all hover:scale-105"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={item}
            transition={transition}
            className="flex flex-wrap justify-center gap-8 text-white/30 text-sm"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white/60">4+</div>
              <div>AI Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white/60">99.9%</div>
              <div>Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white/60">&lt;100ms</div>
              <div>Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white/60">70%</div>
              <div>Cost Saved</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}