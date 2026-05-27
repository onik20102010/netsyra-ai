"use client";
import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className="absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="aurora-blob absolute -top-1/2 -left-1/2 w-full h-full" />
      <div className="aurora-blob absolute -bottom-1/2 -right-1/2 w-full h-full" style={{ animationDelay: "-4s" }} />
    </motion.div>
  );
}