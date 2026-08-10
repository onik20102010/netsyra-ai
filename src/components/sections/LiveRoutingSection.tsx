"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowDown, Zap, Cpu, BrainCircuit, Globe } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

const routingExamples = [
  {
    prompt: "Simple question: 'What is the capital of France?'",
    model: "N Fast",
    badge: "Instant",
    icon: Zap,
    color: "from-green-400 to-emerald-500",
    desc: "Lightning‑fast replies for simple queries.",
  },
  {
    prompt: "Complex coding: 'Build a real‑time chat app'",
    model: "N Plus",
    badge: "Balanced",
    icon: Cpu,
    color: "from-blue-400 to-cyan-500",
    desc: "Detailed answers with clear explanations.",
  },
  {
    prompt: "Research task: 'Summarize latest AI papers'",
    model: "N Pro",
    badge: "Deep reasoning",
    icon: BrainCircuit,
    color: "from-purple-400 to-pink-500",
    desc: "Step‑by‑step analysis and advanced reasoning.",
  },
  {
    prompt: "Live query: 'What's Elon Musk's net worth today?'",
    model: "N Live",
    badge: "Real‑time",
    icon: Globe,
    color: "from-orange-400 to-red-500",
    desc: "Fresh answers using live web data and Wikipedia.",
  },
];

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

export default function LiveRoutingSection() {
  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Intelligent Routing in Action
          </h2>
          <p className="text-white/60 text-base sm:text-lg">
            Every prompt is analyzed and sent to the perfect model.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {routingExamples.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInScale}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -5 }}
            >
              <Card className="relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-6 flex flex-col items-center text-center h-full group hover:border-white/20 transition-all">
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${item.color} mb-4 shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white/80 mb-2 text-xs sm:text-sm font-medium">{item.prompt}</p>
                <div className="flex flex-col items-center mt-4">
                  <ArrowDown className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/10 text-white/80">
                    {item.badge}
                  </span>
                  <p className="text-lg font-bold text-white mt-2">{item.model}</p>
                  <p className="text-white/40 text-xs mt-1">{item.desc}</p>
                </div>
                {/* Glowing connection line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            </motion.div>
          ))}
        </div>
        {/* Central routing line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-12 routing-glow-line w-3/4 mx-auto"
        />
      </div>
    </section>
  );
}