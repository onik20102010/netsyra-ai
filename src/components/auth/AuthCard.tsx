"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function AuthCard({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="relative border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-purple-500/20 p-8 space-y-6">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-purple-500/10 to-transparent opacity-60 pointer-events-none" />
        <div className="relative space-y-4 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center p-2 ring-1 ring-purple-500/30 shadow-lg shadow-purple-500/10">
              <img
                src="/logo.png"
                alt="Netsyra"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-white/60">{subtitle}</p>
          </div>
        </div>
        <div className="relative">{children}</div>
      </Card>
    </motion.div>
  );
}