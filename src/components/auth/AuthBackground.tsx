"use client";
import { motion } from "framer-motion";

export default function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Aurora blobs */}
      <div className="absolute inset-0 bg-black" />
      <div className="aurora-blob absolute -top-1/2 -left-1/2 w-full h-full" />
      <div className="aurora-blob absolute -bottom-1/2 -right-1/2 w-full h-full" style={{ animationDelay: "-4s" }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
    </div>
  );
}