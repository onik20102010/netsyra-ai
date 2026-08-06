"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

interface ClockData {
  timezone: string;
  label: string;
  utcDatetime?: string;
  formattedTime?: string;
  formattedDate?: string;
}

// Reliable timezone-aware time extraction using formatToParts
function getTimeInTimezone(timezone: string): { h: number; m: number; s: number; h12: number; ampm: string; dateStr: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || "0";
  const h = parseInt(get("hour"), 10) % 24;
  const m = parseInt(get("minute"), 10);
  const s = parseInt(get("second"), 10);
  const h12 = h % 12 || 12;
  const ampm = h >= 12 ? "PM" : "AM";
  const dateStr = `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`;
  return { h, m, s, h12, ampm, dateStr };
}

function AnalogClock({ h, m, s }: { h: number; m: number; s: number }) {
  const hAngle = (h % 12) * 30 + m * 0.5;
  const mAngle = m * 6 + s * 0.1;
  const sAngle = s * 6;

  return (
    <svg width="140" height="140" viewBox="0 0 150 150" className="drop-shadow-sm">
      <defs>
        <radialGradient id="clockFace" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f4f8" />
        </radialGradient>
        <linearGradient id="clockBezel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      {/* Outer bezel */}
      <circle cx="75" cy="75" r="72" fill="url(#clockBezel)" />
      <circle cx="75" cy="75" r="68" fill="url(#clockFace)" stroke="#e2e8f0" strokeWidth="1" />
      {/* Hour ticks */}
      {Array.from({ length: 12 }, (_, i) => i + 1).map((i) => {
        const ang = (i * 30 * Math.PI) / 180;
        const x = 75 + 58 * Math.sin(ang);
        const y = 75 - 58 * Math.cos(ang);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="600" fill="#475569">
            {i}
          </text>
        );
      })}
      {/* Minute dots */}
      {Array.from({ length: 60 }, (_, i) => i).filter(i => i % 5 !== 0).map((i) => {
        const ang = (i * 6 * Math.PI) / 180;
        const x = 75 + 64 * Math.sin(ang);
        const y = 75 - 64 * Math.cos(ang);
        return <circle key={i} cx={x} cy={y} r="1" fill="#cbd5e1" />;
      })}
      {/* Hour hand */}
      <line
        x1="75" y1="75"
        x2={75 + 33 * Math.sin((hAngle * Math.PI) / 180)}
        y2={75 - 33 * Math.cos((hAngle * Math.PI) / 180)}
        stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round"
        style={{ transition: "all 0.3s cubic-bezier(0.4, 2, 0.6, 1)" }}
      />
      {/* Minute hand */}
      <line
        x1="75" y1="75"
        x2={75 + 48 * Math.sin((mAngle * Math.PI) / 180)}
        y2={75 - 48 * Math.cos((mAngle * Math.PI) / 180)}
        stroke="#475569" strokeWidth="3" strokeLinecap="round"
        style={{ transition: "all 0.3s cubic-bezier(0.4, 2, 0.6, 1)" }}
      />
      {/* Second hand — smooth sweep */}
      <line
        x1="75" y1="80"
        x2={75 + 55 * Math.sin((sAngle * Math.PI) / 180)}
        y2={75 - 55 * Math.cos((sAngle * Math.PI) / 180)}
        stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: "all 0.15s cubic-bezier(0.4, 2, 0.6, 1)" }}
      />
      <circle cx="75" cy="75" r="5" fill="#1e293b" />
      <circle cx="75" cy="75" r="2.5" fill="#ef4444" />
    </svg>
  );
}

export default function ClockWidget({ data }: { data: ClockData }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Use the server-provided formatted time as a base, then tick client-side
  const timeInfo = useMemo(() => {
    void tick; // recompute every tick
    const live = getTimeInTimezone(data.timezone);
    const digital = `${live.h12}:${String(live.m).padStart(2, "0")}:${String(live.s).padStart(2, "0")} ${live.ampm}`;
    const dateStr = data.formattedDate || live.dateStr;
    return { ...live, digital, dateStr };
  }, [tick, data.timezone, data.formattedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
      className="my-4 max-w-xs"
    >
      <div className="rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-100">
        {/* Header gradient bar */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        {/* Body */}
        <div className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-xl"
            >
              🕐
            </motion.span>
            <h3 className="text-base font-semibold text-gray-700">{data.label}</h3>
          </div>

          {/* Digital time */}
          <motion.div
            key={timeInfo.digital.slice(0, 5)}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight mb-1"
          >
            {timeInfo.digital}
          </motion.div>

          {/* Date */}
          <p className="text-xs text-gray-500 mb-3">{timeInfo.dateStr}</p>

          {/* Analog clock */}
          <div className="flex justify-center">
            <AnalogClock h={timeInfo.h} m={timeInfo.m} s={timeInfo.s} />
          </div>

          {/* Timezone footer */}
          <p className="text-[10px] text-gray-400 mt-2 font-mono">{data.timezone}</p>
        </div>
      </div>
    </motion.div>
  );
}
