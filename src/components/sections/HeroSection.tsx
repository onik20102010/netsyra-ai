"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Activity, Brain, Cpu, Orbit } from "lucide-react";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const transition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

const backgroundElements = [
  { icon: Brain, top: "20%", left: "10%" },
  { icon: Cpu, top: "60%", left: "85%" },
  { icon: Orbit, top: "70%", left: "15%" },
  { icon: Sparkles, top: "30%", left: "80%" },
  { icon: Zap, top: "15%", left: "90%" },
  { icon: Activity, top: "80%", left: "40%" },
];

export default function HeroSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background Elements - Only animated when mounted to prevent SSR layout shifts */}
      {isMounted && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[600px] rounded-full blur-[150px] opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)' }}
          />

          {backgroundElements.map((el, i) => (
            <motion.div
              key={i}
              className="absolute text-slate-300/40"
              style={{ top: el.top, left: el.left }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            >
              <el.icon size={40} />
            </motion.div>
          ))}

          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`dot-${i}`}
              className="absolute w-2 h-2 rounded-full bg-white/40"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-8"
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 default-gradient bg-[length:200%_auto]">Netsyra</span>
            <span className="text-white"> AI </span>
            <br />
            <span className="text-white text-3xl sm:text-5xl block mt-2 font-medium tracking-normal text-white/90">
              AI Orchestration & Intelligent Prompt Routing Platform
            </span>
          </motion.h1>

          {/* CRITICAL GOOGLE VERIFICATION BLOCK - PLACED DIRECTLY UNDER HEADLINE AND RENDERED STATICALLY WITHOUT CLIENT-SIDE GUARDS */}
          <motion.div
            variants={item}
            transition={transition}
            className="bg-white/5 border border-indigo-500/40 rounded-2xl p-6 text-left max-w-3xl mx-auto backdrop-blur-md space-y-4 shadow-[0_0_30px_rgba(99,102,241,0.05)]"
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                Application Purpose & Functionality
              </h2>
              <p className="text-white/80 text-base leading-relaxed">
                Netsyra AI is an artificial intelligence orchestration application designed to help users streamline interactions with various language models. The primary purpose of this platform is to provide a single, unified interface where users can submit prompts. Our system analyzes each query and automatically routes it to the most cost-effective and task-appropriate large language model (such as OpenAI's GPT or Anthropic's Claude), slashing your API costs by up to 70% while ensuring fast, accurate responses.
              </p>
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-indigo-300 mb-2">
                Google User Data Notice
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                We use Google Sign-In solely for secure user account creation, identity authentication, and profile verification. We only request permission to access your basic Google profile details (specifically your full name and email address) to manage your user session. Netsyra AI does not request, store, or access any other personal Google data, Google Drive files, or Gmail records.
              </p>
            </div>
          </motion.div>

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

          {/* CTA & Legal Links */}
          <motion.div
            variants={item}
            transition={transition}
            className="flex flex-col items-center gap-4 pt-2"
          >
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/chat">
                <Button className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg rounded-full font-medium shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105">
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
            </div>
            
            <div className="text-sm text-white/40 mt-4">
              By using Netsyra AI, you agree to our{" "}
              <Link href="/privacy" className="underline hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={item}
            transition={transition}
            className="flex flex-wrap justify-center gap-8 text-white/30 text-sm"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white/60">5</div>
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