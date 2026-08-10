"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, Sparkles, Terminal } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

const scenes = [
  {
    label: "Prompt Received",
    code: `// User asks a simple question
const input = "What is the capital of France?";

// Netsyra analyses complexity
const tier = analyze(input);
// tier → 'simple'`,
    ui: (
      <div className="flex items-center gap-3 text-sm text-white/80">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="font-medium">Simple question detected</p>
          <p className="text-white/40 text-xs">Routing to N Fast…</p>
        </div>
      </div>
    ),
  },
  {
    label: "Fast Model Selected",
    code: `// Instant reply → N Fast
return "N Fast";

// Response in 80ms
console.log("Cost: $0.0002");`,
    ui: (
      <div className="flex items-center gap-3 text-sm text-white/80">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="font-medium">N Fast responding</p>
          <p className="text-white/40 text-xs">Latency: 80ms · Cost: $0.0002</p>
        </div>
      </div>
    ),
  },
  {
    label: "Complex Query",
    code: `// Complex coding problem
const input = "Build a real-time chat app";

const tier = analyze(input);
// tier → 'complex'

return "N Pro";`,
    ui: (
      <div className="flex items-center gap-3 text-sm text-white/80">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="font-medium">Complex task identified</p>
          <p className="text-white/40 text-xs">Deep reasoning required…</p>
        </div>
      </div>
    ),
  },
  {
    label: "Pro Model Reasoning",
    code: `// Step‑by‑step plan
1. Choose tech stack (WebSocket, React)
2. Design message schema
3. Implement auth
4. Deploy backend

Response ready in 2.3s`,
    ui: (
      <div className="flex items-center gap-3 text-sm text-white/80">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="font-medium">N Pro reasoning</p>
          <p className="text-white/40 text-xs">4‑step plan generated · 2.3s</p>
        </div>
      </div>
    ),
  },
  {
    label: "Live Data Fetch",
    code: `// Real‑time query
const input = "Elon Musk net worth 2026";

// N Live mode activated
const liveData = await fetchLive(input);
return liveData.summary;`,
    ui: (
      <div className="flex items-center gap-3 text-sm text-white/80">
        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <p className="font-medium">N Live fetching web data</p>
          <p className="text-white/40 text-xs">Latest result: $839 billion</p>
        </div>
      </div>
    ),
  },
  {
    label: "Cost & Analytics",
    code: `// Dashboard summary
Total requests today: 1,248
Cost saved: $127.50 (70%)
Fastest model: N Fast (80ms)
Most used: N Plus`,
    ui: (
      <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-2xl font-bold text-green-400">1,248</div>
          <div className="text-white/40 text-xs">Requests today</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-2xl font-bold text-indigo-400">$127.50</div>
          <div className="text-white/40 text-xs">Cost saved</div>
        </div>
      </div>
    ),
  },
];

export default function VideoDemoSection() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextScene = useCallback(() => {
    setCurrentScene((prev) => (prev + 1) % scenes.length);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(nextScene, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, nextScene]);

  const scene = scenes[currentScene];

  return (
    <section className="relative py-24 px-4">
      <AnimatedBackground />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            See Netsyra in Action
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Watch how intelligent routing transforms your prompts into precise,
            cost‑efficient answers across multiple AI models.
          </p>
        </motion.div>

        {/* Code demo player */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-4xl"
        >
          {/* Glass player container */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl shadow-purple-500/10">
            {/* Player chrome */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
                <span className="ml-2 text-xs text-white/40 font-mono">
                  demo.netsyra.ai
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white/60" />
                  ) : (
                    <Play className="w-4 h-4 text-white/60" />
                  )}
                </button>
                <button
                  onClick={nextScene}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <SkipForward className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
              {/* Code panel */}
              <div className="bg-[#0d0d1a] p-6 font-mono text-sm leading-7 overflow-hidden">
                <div className="text-white/30 text-xs mb-3 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  router.ts
                </div>
                <AnimatePresence mode="wait">
                  <motion.pre
                    key={currentScene}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="text-white/80 whitespace-pre-wrap"
                  >
                    {scene.code}
                  </motion.pre>
                </AnimatePresence>
              </div>

              {/* UI / output panel */}
              <div className="bg-[#050510] p-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScene}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    {scene.ui}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Scene indicator */}
          <div className="mt-4 flex items-center justify-center gap-3 text-white/40 text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>
              {scene.label} — Scene {currentScene + 1} of {scenes.length}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}