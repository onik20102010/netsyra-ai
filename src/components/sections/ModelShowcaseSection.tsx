"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const providers = [
  { name: "OpenAI", logo: "⚡", color: "from-green-400 to-emerald-600" },
  { name: "Gemini", logo: "🌌", color: "from-blue-400 to-indigo-600" },
  { name: "DeepSeek", logo: "🧠", color: "from-purple-400 to-violet-600" },
  { name: "Anthropic", logo: "🔮", color: "from-orange-400 to-rose-600" },
  { name: "Local Models", logo: "💻", color: "from-gray-400 to-gray-600" },
];

export default function ModelShowcaseSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-8"
        >
          Unified API for Every Major AI Provider
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
        >
          {providers.map((provider, idx) => (
            <motion.div
              key={provider.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 0 }}
            >
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center justify-center h-32 group hover:border-purple-500/50 transition-all">
                <div className={`text-3xl mb-2 bg-gradient-to-r ${provider.color} bg-clip-text text-transparent`}>
                  {provider.logo}
                </div>
                <span className="text-sm font-medium text-white/80">{provider.name}</span>
                <div className={`mt-2 w-8 h-1 rounded-full bg-gradient-to-r ${provider.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}