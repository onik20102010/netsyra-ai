"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export default function CTASection() {
  return (
    <section className="relative py-24 px-4">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Start building in minutes</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Ready to Orchestrate Your AI?
        </h2>
        <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
          Join thousands of developers who let Netsyra handle model selection, cost, and performance automatically.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-purple-500/25 hover:scale-105 transition-all"
          >
            Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-full backdrop-blur-sm"
          >
            Talk to Sales
          </Button>
        </div>
      </motion.div>
    </section>
  );
}