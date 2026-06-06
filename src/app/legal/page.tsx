"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, AlertTriangle, Copyright } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-900/20 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-900/20 blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
          {/* Header */}
          <motion.div variants={item} className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white">Legal Notice</h1>
            <p className="text-white/50 max-w-xl mx-auto">
              Intellectual Property Protection Statement
            </p>
          </motion.div>

          {/* Warning */}
          <motion.div
            variants={item}
            className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-red-400">⚠️ Unauthorized Use is Strictly Prohibited</h2>
                <p className="text-white/60 leading-relaxed">
                  All content, design elements, user interface components, source code, algorithms, routing logic,
                  AI model configurations, system prompts, and overall architecture of Netsyra AI are the exclusive
                  intellectual property of their respective owners.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sections */}
          <motion.div variants={item} className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Copyright className="w-5 h-5 text-purple-400" />
              Protected Elements
            </h2>
            <div className="grid gap-4">
              {[
                "User Interface design and layout",
                "AI routing algorithms and logic",
                "System prompt engineering and configurations",
                "Model fallback chains and orchestration patterns",
                "Source code, file structure, and architecture",
                "Website design, color schemes, and typography choices",
                "Branding, logos, and visual identity",
                "Documentation and written content",
                "Database schemas and data models",
                "API design and endpoint structures",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-purple-500/50 flex-shrink-0" />
                  <span className="text-white/50 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Legal Action */}
          <motion.div variants={item} className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Our Rights</h2>
            <p className="text-white/50 leading-relaxed">
              We actively monitor for unauthorized use, copying, reproduction, or distribution of our intellectual
              property. We reserve the right to pursue legal action, including but not limited to:
            </p>
            <ul className="space-y-2 text-white/50">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Filing DMCA takedown notices for copyright infringement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Pursuing civil litigation for damages and injunctive relief</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Reporting violations to relevant authorities and platforms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Seeking compensation for financial losses and legal costs</span>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            variants={item}
            className="p-6 border border-white/10 rounded-2xl bg-white/[0.02] backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Report Infringement</h3>
            <p className="text-white/40 text-sm">
              If you believe your work has been copied or used without authorization, please contact us at:
            </p>
            <a href="mailto:onik20102010@gmail.com" className="text-purple-400 hover:underline text-sm">
              onik20102010@gmail.com
            </a>
          </motion.div>

          <motion.div variants={item} className="text-center pt-8">
            <Link href="/" className="text-purple-400 hover:underline text-sm">
              ← Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}