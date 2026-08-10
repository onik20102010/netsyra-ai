"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const models = [
  {
    id: "fast",
    name: "N Fast",
    badge: "Balanced",
    desc: "Fast, intelligent and perfect for everyday conversations, Q&A and general tasks.",
    features: ["Quick responses", "General knowledge", "Everyday assistance"],
    msgsPerDay: 15,
    iconSvg: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
    theme: {
      iconBg: "linear-gradient(135deg,#6366f1,#3b82f6)",
      iconShadow: "0 8px 20px rgba(99,102,241,.35)",
      dot: "#818cf8",
      boxBorder: "rgba(129,140,248,.35)",
      boxBg: "rgba(129,140,248,.07)",
      boxIcon: "#818cf8",
    },
  },
  {
    id: "plus",
    name: "N Plus",
    badge: "Smart",
    desc: "Smarter reasoning, deeper answers and better at complex explanations.",
    features: ["Better reasoning", "In-depth answers", "Handles complex topics"],
    msgsPerDay: 10,
    iconSvg: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2Z"/>',
    theme: {
      iconBg: "linear-gradient(135deg,#3b82f6,#2563eb)",
      iconShadow: "0 8px 20px rgba(59,130,246,.35)",
      dot: "#60a5fa",
      boxBorder: "rgba(96,165,250,.35)",
      boxBg: "rgba(96,165,250,.07)",
      boxIcon: "#60a5fa",
    },
  },
  {
    id: "pro",
    name: "N Pro",
    badge: "Advanced",
    desc: "High performance for advanced tasks, analysis, coding and problem solving.",
    features: ["Advanced reasoning", "Coding & debugging", "Complex problem solving"],
    msgsPerDay: 5,
    iconSvg: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
    theme: {
      iconBg: "linear-gradient(135deg,#a855f7,#7c3aed)",
      iconShadow: "0 8px 20px rgba(168,85,247,.35)",
      dot: "#c084fc",
      boxBorder: "rgba(192,132,252,.35)",
      boxBg: "rgba(192,132,252,.07)",
      boxIcon: "#c084fc",
    },
  },
  {
    id: "live",
    name: "N Live",
    badge: "Real-time",
    desc: "Real-time web access, live data, news, trends and up-to-date information.",
    features: ["Live web search", "Real-time data", "Latest updates"],
    msgsPerDay: 3,
    iconSvg: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    theme: {
      iconBg: "linear-gradient(135deg,#2dd4bf,#0d9488)",
      iconShadow: "0 8px 20px rgba(45,212,191,.35)",
      dot: "#2dd4bf",
      boxBorder: "rgba(45,212,191,.35)",
      boxBg: "rgba(45,212,191,.07)",
      boxIcon: "#2dd4bf",
    },
  },
  {
    id: "code",
    name: "N Code",
    badge: "Developer",
    desc: "Specialized in code generation, debugging, optimization and technical tasks.",
    features: ["Code generation", "Debug & optimize", "Technical expertise"],
    msgsPerDay: 5,
    iconSvg: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    theme: {
      iconBg: "linear-gradient(135deg,#4ade80,#16a34a)",
      iconShadow: "0 8px 20px rgba(74,222,128,.35)",
      dot: "#4ade80",
      boxBorder: "rgba(74,222,128,.35)",
      boxBg: "rgba(74,222,128,.07)",
      boxIcon: "#4ade80",
    },
  },
  {
    id: "aai",
    name: "N AAI",
    badge: "Autonomous",
    desc: "Our most powerful autonomous AI. Multi-step reasoning and task execution.",
    features: ["Autonomous agent", "Multi-step execution", "Advanced problem solving"],
    msgsPerDay: 5,
    iconSvg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>',
    theme: {
      iconBg: "linear-gradient(135deg,#fbbf24,#d97706)",
      iconShadow: "0 8px 20px rgba(251,191,36,.35)",
      dot: "#fbbf24",
      boxBorder: "rgba(251,191,36,.35)",
      boxBg: "rgba(251,191,36,.07)",
      boxIcon: "#fbbf24",
    },
  },
];

const features = [
  {
    icon: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    color: "#a78bfa",
    title: "Right Model, Best Result",
    desc: "Each model is trained for specific strengths. Choose the best fit for your task.",
  },
  {
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    color: "#60a5fa",
    title: "Separate Daily Limits",
    desc: "Each model has its own daily message limit that resets every 24 hours.",
  },
  {
    icon: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    color: "#c084fc",
    title: "Private & Secure",
    desc: "Your conversations are private mean never share to public. We just store about you in the memory to make the AI more advanced.",
  },
  {
    icon: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    color: "#fbbf24",
    title: "Always Improving",
    desc: "We continuously update our models to give you the best experience and results.",
  },
];

export default function CTASection() {
  return (
    <section className="relative py-16 px-4 sm:px-6" style={{ background: "#050506", backgroundImage: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.07), transparent 45%)" }}>
      <div className="max-w-[1360px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3.5">
            Our AI Free Plan Models
          </h1>
          <p className="text-base sm:text-lg text-[#9a9aa5] max-w-[600px] mx-auto leading-relaxed">
            Choose the right AI model for your task. Each model is optimized for different strengths.
          </p>
        </motion.div>

        {/* Model cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {models.map((model) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -3 }}
              className="group bg-[#0b0b0d] border border-white/[0.08] rounded-[18px] p-[26px] flex flex-col transition-all hover:border-white/[0.16] hover:shadow-[0_18px_36px_rgba(0,0,0,0.35)]"
            >
              {/* Card top */}
              <div className="flex items-center justify-between mb-[18px] gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center flex-shrink-0"
                    style={{ background: model.theme.iconBg, boxShadow: model.theme.iconShadow }}
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: model.iconSvg }} />
                  </div>
                  <h2 className="text-xl font-bold text-white whitespace-nowrap">{model.name}</h2>
                </div>
                <span className="text-[12.5px] font-medium text-[#c9c9d1] bg-[#161619] border border-white/[0.12] px-[13px] py-[5px] rounded-full whitespace-nowrap">
                  {model.badge}
                </span>
              </div>

              {/* Description */}
              <p className="text-[14.5px] text-[#9d9da5] leading-[1.55] mb-[18px]">{model.desc}</p>

              {/* Features list */}
              <ul className="list-none mb-[22px]">
                {model.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[#c2c2c9] mb-[9px] last:mb-0">
                    <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: model.theme.dot }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Message limit box */}
              <Link
                href={`/chat?model=${model.id}`}
                className="mt-auto flex items-center gap-2.5 border-[1.5px] rounded-[12px] px-4 py-[13px] transition-all hover:scale-[1.02]"
                style={{ borderColor: model.theme.boxBorder, background: model.theme.boxBg }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={model.theme.boxIcon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                  <line x1="8" y1="12" x2="8" y2="12" />
                  <line x1="12" y1="12" x2="12" y2="12" />
                  <line x1="16" y1="12" x2="16" y2="12" />
                </svg>
                <span className="text-[14.5px] font-bold text-white">{model.msgsPerDay} Messages per day</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Feature row */}
        <div className="border border-white/[0.08] rounded-[18px] p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={f.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" dangerouslySetInnerHTML={{ __html: f.icon }} />
              <div>
                <h3 className="text-[15px] font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-[13.5px] text-[#9a9aa5] leading-[1.5]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}