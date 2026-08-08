"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { motion } from "framer-motion";

interface ClockData {
  timezone: string;
  label: string;
  utcDatetime?: string;
  formattedTime?: string;
  formattedDate?: string;
}

// Reliable timezone-aware time extraction using formatToParts
function getTimeInTimezone(timezone: string): {
  h: number; m: number; s: number; h12: number; ampm: string;
  dayAbbr: string; monthAbbr: string; dayNum: string;
} {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || "0";
  const h = parseInt(get("hour"), 10) % 24;
  const m = parseInt(get("minute"), 10);
  const s = parseInt(get("second"), 10);
  const h12 = h % 12 || 12;
  const ampm = h >= 12 ? "PM" : "AM";
  return {
    h, m, s, h12, ampm,
    dayAbbr: get("weekday").toUpperCase(),
    monthAbbr: get("month").toUpperCase(),
    dayNum: get("day"),
  };
}

const ClockWidget = memo(function ClockWidget({ data }: { data: ClockData }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeInfo = useMemo(() => {
    void tick;
    return getTimeInTimezone(data.timezone);
  }, [tick, data.timezone]);

  const timeStr = `${timeInfo.h12}:${String(timeInfo.m).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.05 }}
      className="my-4 w-[280px]"
    >
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0a0a0f" }}
      >
        {/* ── Carbon fiber dot matrix background ── */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, #1a1a2e 1px, transparent 1px)`,
            backgroundSize: "6px 6px",
          }}
        />

        {/* ── Top neon wave (purple/blue) ── */}
        <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-8 -left-20 w-[200%] h-32"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.35) 30%, rgba(59,130,246,0.45) 50%, rgba(139,92,246,0.35) 70%, transparent 100%)",
              filter: "blur(20px)",
              borderRadius: "50%",
            }}
            animate={{ x: ["-10%", "10%", "-10%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* ── Bottom neon wave ── */}
        <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -bottom-6 -left-20 w-[200%] h-28"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.25) 30%, rgba(99,102,241,0.35) 50%, rgba(168,85,247,0.25) 70%, transparent 100%)",
              filter: "blur(18px)",
              borderRadius: "50%",
            }}
            animate={{ x: ["10%", "-10%", "10%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* ── Content ── */}
        <div className="relative px-6 py-5 z-10">
          {/* Date row: SAT, JAN 14 */}
          <div
            className="text-[15px] tracking-wide uppercase"
            style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
          >
            <span
              className="font-bold"
              style={{ color: "#00E676" }}
            >
              {timeInfo.dayAbbr},
            </span>{" "}
            <span
              className="font-normal"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {timeInfo.monthAbbr} {timeInfo.dayNum}
            </span>
          </div>

          {/* Time: 12:45 — oversized */}
          <motion.div
            key={timeStr}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-bold tabular-nums mt-1"
            style={{
              color: "#ffffff",
              fontSize: "64px",
              lineHeight: 1,
              letterSpacing: "-2px",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              fontWeight: 700,
              textShadow: "0 0 30px rgba(139,92,246,0.3)",
            }}
          >
            {timeStr}
          </motion.div>

          {/* AM/PM + seconds — subtle */}
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className="text-xs font-semibold tracking-wider"
              style={{ color: "#00E676" }}
            >
              {timeInfo.ampm}
            </span>
            <span
              className="text-xs font-mono tabular-nums"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              :{String(timeInfo.s).padStart(2, "0")}
            </span>
          </div>

          {/* Timezone footer */}
          <div
            className="text-[10px] font-mono mt-3 pt-2"
            style={{
              color: "rgba(255,255,255,0.3)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {data.label} · {data.timezone}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default ClockWidget;
