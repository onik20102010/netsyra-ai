"use client";

import React, { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

// ------------------------------------------------------------------
// Real SVG icons (no emoji, pure vectors)
// ------------------------------------------------------------------
const LightningIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const DiamondIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L2 12l10 10 10-10-10-10z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const BracketsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 6L4 12L8 18M16 6L20 12L16 18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// ------------------------------------------------------------------
// Card component with premium animations + non‑copyable text
// ------------------------------------------------------------------
interface ModelCardProps {
  title: string;
  subtitle: string;
  description: string[];
  icon: React.ReactNode;
  accentColor: string;
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
  codeExample,
  index,
  variant = "default",
}: ModelCardProps) {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const delay = variant === "center" ? 0.4 : index * 0.15;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] } },
      }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl bg-gradient-to-br from-[#111215] to-[#0A0C10] border border-gray-800 p-6 shadow-2xl transition-all duration-300 hover:border-gray-700 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05)] select-none"
      style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}
    >
      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${accentColor}20, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative flex flex-col h-full">
        {/* Icon + label row */}
        <div className="flex items-start justify-between">
          <motion.div
            whileHover={{ scale: 1.05, rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl p-2 bg-opacity-10`}
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {icon}
          </motion.div>
          <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-900/50 px-2.5 py-0.5 text-xs font-mono text-gray-400 backdrop-blur-sm">
            {title.split(" ")[1]?.toLowerCase() || "model"}
          </span>
        </div>

        <div className="mt-4">
          <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
          <p className="mt-1 text-sm font-medium text-gray-400">{subtitle}</p>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-300 leading-relaxed">
          {description.map((item, idx) => (
            <p key={idx}>{item}</p>
          ))}
        </div>

        {/* Code block with subtle glow */}
        <div className="mt-6 rounded-md bg-[#0A0C10] border border-gray-800 p-3 font-mono text-xs transition-all group-hover:border-gray-700">
          <pre className="text-gray-300 overflow-x-auto">
            <code>{codeExample}</code>
          </pre>
        </div>

        {/* "Expensive" detail: animated shine on hover */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Main component: two rows – first row two cards, second row one centered
// ------------------------------------------------------------------
export default function ModelsShowcase() {
  const models = [
    {
      title: "N Fast",
      subtitle: "Lowest latency · real‑time intelligence",
      description: [
        "Ultra‑fast inference with <200ms time‑to‑first‑token. Ideal for chatbots, real‑time assistants, and edge deployments.",
        "128K context window · high throughput · 99.999% uptime SLA.",
        "Best for: streaming responses, live translation, and rapid prototyping.",
      ],
      icon: <LightningIcon />,
      accentColor: "#F97316",
      codeExample: `import { NFast } from "netsyra";\nconst response = await NFast.generate("Explain quantum gravity");\n// returns in <200ms`,
    },
    {
      title: "N Pro",
      subtitle: "Deep reasoning · agent‑grade intelligence",
      description: [
        "State‑of‑the‑art reasoning, multi‑step planning, and function calling. Handles complex documents with 2M context.",
        "Advanced tool use, code interpreter, and long‑form analysis with chain‑of‑thought.",
        "Best for: scientific research, legal review, autonomous workflows, and high‑stakes decisions.",
      ],
      icon: <DiamondIcon />,
      accentColor: "#8B5CF6",
      codeExample: `import { NPro } from "netsyra";\nconst analysis = await NPro.analyze(\n  "Compare Q2 financial reports",\n  { context_window: "2M" }\n);`,
    },
    {
      title: "N Code",
      subtitle: "Code‑first · 100+ languages · refactoring",
      description: [
        "Specialized for code generation, debugging, test writing, and repository‑scale understanding.",
        "Supports Python, TypeScript, Rust, Go, and 90+ other languages. Native VS Code and GitHub integration.",
        "Best for: automated PR reviews, unit test generation, legacy code migration, and pair programming.",
      ],
      icon: <BracketsIcon />,
      accentColor: "#10B981",
      codeExample: `import { NCode } from "netsyra";\nconst script = await NCode.generate(\n  "React hook for local storage",\n  { language: "typescript" }\n);`,
    },
  ];

  const [firstRow, thirdModel] = [models.slice(0, 2), models[2]];

  return (
    <section className="min-h-screen bg-[#0A0C10] flex items-center justify-center px-4 py-16 select-none" style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}>
      <div className="w-full max-w-6xl mx-auto">
        {/* react.dev style header – dark theme with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
            Models built for{" "}
            <span className="bg-gradient-to-r from-orange-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              performance
            </span>
          </h1>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            From the creators of Netsyra – each model is meticulously tuned for a specific class of workload.
            <br />
            <span className="inline-block mt-2 text-sm font-mono text-gray-500">
              choose the right intelligence for your use case
            </span>
          </p>
        </motion.div>

        {/* Two containers at the middle: N Fast + N Pro side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {firstRow.map((model, idx) => (
            <ModelCard key={model.title} {...model} index={idx} variant="default" />
          ))}
        </div>

        {/* One container below, centered: N Code */}
        <div className="flex justify-center mt-10">
          <div className="w-full max-w-md">
            <ModelCard {...thirdModel} index={2} variant="center" />
          </div>
        </div>

        {/* Premium footer with Netsyra branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-20 text-center text-xs text-gray-500 border-t border-gray-800/50 pt-6"
        >
          <span className="font-mono">Netsyra AI · enterprise‑grade models with SLA guarantees</span>
          <div className="flex justify-center gap-4 mt-3">
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