"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO, TechCorp",
    avatar: "SC",
    content: "Netsyra cut our AI costs by 60% while actually improving response quality. The routing engine is magic.",
    rating: 5,
  },
  {
    name: "Marcus Rivera",
    role: "Lead Engineer, DevFlow",
    avatar: "MR",
    content: "We choose Netsyra for many works.",
    rating: 5,
  },
  {
    name: "Elena Novak",
    role: "AI Researcher, NextGen",
    avatar: "EN",
    content: "Finally, an orchestration layer that understands model strengths. Perfect for complex pipelines.",
    rating: 5,
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            Trusted by AI-driven Teams
          </h2>
          <p className="text-white/60 mt-4 text-lg max-w-2xl mx-auto">
            Don't take our word for it.
          </p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={cardVariant} whileHover={{ y: -5 }}>
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl p-6 h-full flex flex-col">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar>
                    <AvatarFallback className="bg-purple-500/20 text-purple-300">
                      {t.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-white/50">{t.role}</p>
                  </div>
                </div>
                <p className="text-white/70 mb-4 flex-1">{t.content}</p>
                <div className="flex space-x-1">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}