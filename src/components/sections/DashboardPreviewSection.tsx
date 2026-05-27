"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  GitBranch,
  BarChart3,
  Zap,
  Activity,
} from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export default function DashboardPreviewSection() {
  return (
    <section className="relative py-24 px-4">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            A Dashboard Built for AI Engineers
          </h2>
          <p className="text-white/60 mt-4 text-lg max-w-2xl mx-auto">
            Monitor, optimize, and control your AI infrastructure in real time.
          </p>
        </motion.div>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-1 shadow-2xl"
        >
          <div className="absolute inset-0 rounded-3xl bg-purple-500/5 blur-3xl" />
          <div className="relative bg-black/40 rounded-2xl p-6 md:p-8 grid gap-6 lg:grid-cols-3">
            {/* Chat panel */}
            <Card className="border-white/10 bg-black/60 backdrop-blur-sm p-4 space-y-4 col-span-1">
              <div className="flex items-center space-x-2 text-purple-400">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">AI Chat</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-white/5 text-sm">What's the best way to scale microservices?</div>
                <div className="flex items-center space-x-2 text-xs text-purple-300">
                  <GitBranch className="w-4 h-4" />
                  <span>Routed to: <strong>GPT-4.1</strong></span>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 text-sm">Use horizontal scaling with Kubernetes...</div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-white/50">
                <Activity className="w-4 h-4" />
                <span>Streaming · 234ms latency</span>
              </div>
            </Card>

            {/* Analytics panel */}
            <Card className="border-white/10 bg-black/60 backdrop-blur-sm p-4 space-y-4 col-span-1">
              <div className="flex items-center space-x-2 text-blue-400">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Usage Analytics</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>DeepSeek Flash</span>
                  <span className="text-green-400">1.2M tokens</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>GPT-4.1</span>
                  <span className="text-blue-400">450K tokens</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full">
                  <div className="h-full w-1/4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full" />
                </div>
              </div>
              <div className="text-xs text-white/50">Cost saved today: <strong className="text-purple-400">$127.50</strong></div>
            </Card>

            {/* Routing decisions panel */}
            <Card className="border-white/10 bg-black/60 backdrop-blur-sm p-4 space-y-4 col-span-1">
              <div className="flex items-center space-x-2 text-pink-400">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium">Routing Decisions</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Simple queries</span>
                  <span className="text-green-400">→ Flash model</span>
                </div>
                <div className="flex justify-between">
                  <span>Reasoning</span>
                  <span className="text-blue-400">→ GPT-4.1</span>
                </div>
                <div className="flex justify-between">
                  <span>Research</span>
                  <span className="text-purple-400">→ Gemini Pro</span>
                </div>
                <div className="flex justify-between">
                  <span>Private data</span>
                  <span className="text-orange-400">→ Local Model</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-white/40">
                98.7% uptime · 12ms avg routing decision
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}