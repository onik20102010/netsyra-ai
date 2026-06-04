"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Cpu,
  DollarSign,
  Layers,
  Zap,
  BrainCircuit,
  BarChart3,
} from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

const features = [
  {
    icon: Cpu,
    title: "Intelligent Model Routing",
    desc: "Models can deeply analyse the request of the user and help the user more than just as an assistant.",
  },
  {
    icon: DollarSign,
    title: "Tiered Models",
    desc: "Fast, Plus, Pro, Live, Code, and Expert – each tier is optimised for a different type of request.",
  },
  {
    icon: Layers,
    title: "Multi‑Backend AI",
    desc: "Powered by Netsyra models that use one of the best routing systems ever.",
  },
  {
    icon: Zap,
    title: "Instant Responses",
    desc: "Low‑latency inference through N Live with real‑time streaming and Wikipedia integration.",
  },
  {
    icon: BrainCircuit,
    title: "Conversation Memory",
    desc: "Remembers your thoughts, deeds, and uses them in responses.",
  },
  {
    icon: BarChart3,
    title: "Usage Controls",
    desc: "Built‑in daily limits, per‑conversation caps, and model‑specific quotas keep usage predictable.",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
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
            Everything You Need to Orchestrate AI
          </h2>
          <p className="text-white/60 mt-4 text-lg max-w-2xl mx-auto">
            Smart model selection that routes every prompt to the right tier.
          </p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feat) => (
            <motion.div key={feat.title} variants={item} whileHover={{ y: -5 }}>
              <Card className="group relative border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:border-purple-500/50 transition-all h-full">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:animate-glow-pulse">
                    <feat.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feat.title}</h3>
                  <p className="text-white/60">{feat.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}