"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useInView, AnimatePresence } from "framer-motion";

// ------------------------------------------------------------------
// Real SVG icons (no emoji, pure vectors)
// ------------------------------------------------------------------
const LightningIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const DiamondIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 12l10 10 10-10-10-10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const BracketsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6L4 12L8 18M16 6L20 12L16 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// ------------------------------------------------------------------
// Animated counter for stats
// ------------------------------------------------------------------
function AnimatedCounter({ value, suffix = "", duration = 1.5 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ------------------------------------------------------------------
// Professional Card with premium animations
// ------------------------------------------------------------------
interface ModelCardProps {
  title: string;
  subtitle: string;
  description: string[];
  icon: React.ReactNode;
  accentColor: string;
  stats: { label: string; value: number; suffix?: string }[];
  codeExample: string;
  index: number;
  variant?: "default" | "center";
}

function ModelCard({
  title,
  subtitle,
  description,
  icon,
  accentColor,
  stats,
  codeExample,
  index,
  variant = "default",
}: ModelCardProps) {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (inView) controls.start("visible");
  }, [controls, inView]);

  const delay = variant === "center" ? 0.4 : index * 0.15;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] as const },
        },
      }}
      whileHover={{ y: -10, transition: { duration: 0.25, ease: "easeOut" } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-2xl overflow-hidden select-none"
      style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}
    >
      {/* ── Outer glow layer ── */}
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute -inset-0.5 rounded-2xl blur-lg pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${accentColor}40, transparent 60%)` }}
      />

      {/* ── Card body ── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#0F1115] to-[#080A0E] border border-gray-800/80 p-5 sm:p-7 shadow-2xl transition-all duration-400 group-hover:border-gray-700/80 h-full">
        {/* ── Top accent bar ── */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[2px] origin-left"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: delay + 0.3 }}
        />

        {/* ── Radial glow on hover ── */}
        <motion.div
          animate={{ opacity: isHovered ? 0.15 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${accentColor}, transparent 70%)` }}
        />

        <div className="relative flex flex-col h-full">
          {/* ── Icon + badge row ── */}
          <div className="flex items-start justify-between mb-5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 0.4 }}
              className="rounded-xl p-2.5"
              style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
            >
              {icon}
            </motion.div>
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider backdrop-blur-sm"
              style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08`, color: `${accentColor}cc` }}
            >
              {title.split(" ")[1]?.toLowerCase() || "model"}
            </span>
          </div>

          {/* ── Title + subtitle ── */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h3>
            <p className="mt-1 text-xs sm:text-sm font-medium text-gray-500">{subtitle}</p>
          </div>

          {/* ── Stats row ── */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: delay + 0.4 + i * 0.1, duration: 0.5 }}
                className="rounded-lg bg-white/[0.02] border border-white/5 p-2 text-center"
              >
                <div className="text-base sm:text-lg font-bold" style={{ color: accentColor }}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* ── Description ── */}
          <div className="mt-5 space-y-2 text-xs sm:text-sm text-gray-400 leading-relaxed">
            {description.map((item, idx) => (
              <motion.p
                key={idx}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: delay + 0.5 + idx * 0.1, duration: 0.4 }}
              >
                {item}
              </motion.p>
            ))}
          </div>

          {/* ── Code block ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: delay + 0.6, duration: 0.5 }}
            className="mt-5 rounded-lg bg-[#06080B] border border-gray-800/80 p-3 font-mono text-[10px] sm:text-xs transition-all group-hover:border-gray-700/80"
          >
            {/* Window dots */}
            <div className="flex gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500/30" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/30" />
              <div className="w-2 h-2 rounded-full bg-green-500/30" />
            </div>
            <pre className="text-gray-400 overflow-x-auto leading-relaxed">
              <code>{codeExample}</code>
            </pre>
          </motion.div>

          {/* ── Shine sweep on hover ── */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
            <motion.div
              animate={isHovered ? { x: ["-100%", "200%"] } : { x: "-100%" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-12"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export default function ModelsShowcase() {
  const models = [
    {
      title: "N Fast",
      subtitle: "Lowest latency · real-time intelligence",
      description: [
        "Ultra-fast inference with <200ms time-to-first-token. Ideal for chatbots, real-time assistants, and edge deployments.",
        "Best for daily use such like office, home, researching.",
        "Low context window make the speed of response.",
      ],
      icon: <LightningIcon />,
      accentColor: "#F97316",
      stats: [
        { label: "Latency", value: 200, suffix: "ms" },
        { label: "Speed", value: 99, suffix: "%" },
        { label: "Cost", value: 70, suffix: "%" },
      ],
      codeExample: `import { NFast } from "netsyra";\nconst response = await NFast.generate("Help me in my home work");\n// returns in <4sec`,
    },
    {
      title: "N Pro",
      subtitle: "Deep reasoning · agent-grade intelligence",
      description: [
        "State-of-the-art reasoning, multi-step planning, and function calling. Handles complex documents.",
        "Advanced tool use, code interpreter, and long-form analysis with chain-of-thought.",
        "Best for: scientific research, legal review, autonomous workflows, and high-stakes decisions.",
      ],
      icon: <DiamondIcon />,
      accentColor: "#8B5CF6",
      stats: [
        { label: "Reasoning", value: 98, suffix: "%" },
        { label: "Context", value: 1, suffix: "M" },
        { label: "Accuracy", value: 95, suffix: "%" },
      ],
      codeExample: `import { NPro } from "netsyra";\nconst analysis = await NPro.analyze(\n  "Compare Q2 financial reports",\n );`,
    },
    {
      title: "N Code",
      subtitle: "Code-first · 100+ languages · refactoring",
      description: [
        "Specialized for code generation, debugging, test writing, and repository-scale understanding.",
        "Supports Python, TypeScript, Rust, Go, and 90+ other languages.",
        "Best for: automated PR reviews, unit test generation, legacy code migration, and pair programming.",
      ],
      icon: <BracketsIcon />,
      accentColor: "#10B981",
      stats: [
        { label: "Languages", value: 90, suffix: "+" },
        { label: "Accuracy", value: 97, suffix: "%" },
        { label: "Speed", value: 3, suffix: "x" },
      ],
      codeExample: `import { NCode } from "netsyra";\nconst script = await NCode.generate(\n  "React hook for local storage",\n  { language: "typescript" }\n);`,
    },
  ];

  const [firstRow, thirdModel] = [models.slice(0, 2), models[2]];

  return (
    <section
      className="min-h-screen bg-[#06080B] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20 select-none relative overflow-hidden"
      style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}
    >
      {/* ── Ambient background glow ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 sm:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-wider">Production Ready</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Models built for{" "}
            <span className="bg-gradient-to-r from-orange-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              performance
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            From the creators of Netsyra – each model is known for it's best tone.
            <br />
            <span className="inline-block mt-2 text-xs sm:text-sm font-mono text-gray-500">
              choose the right intelligence for your use case
            </span>
          </p>
        </motion.div>

        {/* ── Two cards side by side ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {firstRow.map((model, idx) => (
            <ModelCard key={model.title} {...model} index={idx} variant="default" />
          ))}
        </div>

        {/* ── One centered card ── */}
        <div className="flex justify-center mt-6 sm:mt-8">
          <div className="w-full max-w-md">
            <ModelCard {...thirdModel} index={2} variant="center" />
          </div>
        </div>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 sm:mt-16 text-center text-xs text-gray-500 border-t border-gray-800/50 pt-6"
        >
          <span className="font-mono">Netsyra AI · enterprise-grade models with SLA guarantees</span>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-3">
            <span className="inline-block w-1 h-1 rounded-full bg-gray-700" />
            <span>REST API</span>
            <span className="inline-block w-1 h-1 rounded-full bg-gray-700" />
            <span>Python / TypeScript SDKs</span>
            <span className="inline-block w-1 h-1 rounded-full bg-gray-700" />
            <span>Private deployment</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
