"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { getWeather3DIcon } from "./Weather3DIcons";

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  feelsLike?: number;
  visibility?: string;
  pressure?: number;
  cloudiness?: number;
  country?: string;
  date?: string;
  tempMin?: number;
  tempMax?: number;
  isNight?: boolean;
  detected?: boolean;
}

// Deep 3D background gradients based on condition — underwater/depth feel
function get3DBackground(icon: string, isNight?: boolean): string {
  const code = (icon || "").toLowerCase();
  if (code.includes("01")) {
    // Clear sky — deep blue (day) or midnight blue (night)
    return isNight
      ? "linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f0f23 100%)"
      : "linear-gradient(180deg, #0077b6 0%, #023e8a 60%, #001233 100%)";
  }
  if (code.includes("02") || code.includes("03")) {
    // Partly cloudy — blue-grey depth
    return "linear-gradient(180deg, #4a6fa5 0%, #2c3e50 60%, #1a1a2e 100%)";
  }
  if (code.includes("04")) {
    // Overcast — grey depth
    return "linear-gradient(180deg, #4b5563 0%, #374151 60%, #1f2937 100%)";
  }
  if (code.includes("09") || code.includes("10")) {
    // Rain — dark blue-teal
    return "linear-gradient(180deg, #2c5364 0%, #1e3a5f 60%, #0a1929 100%)";
  }
  if (code.includes("11")) {
    // Thunderstorm — dark stormy
    return "linear-gradient(180deg, #2d2d3f 0%, #1a1a2e 60%, #0d0d1a 100%)";
  }
  if (code.includes("13")) {
    // Snow — cold blue-white
    return "linear-gradient(180deg, #6b7b8c 0%, #4a5d6b 60%, #2c3e50 100%)";
  }
  if (code.includes("50")) {
    // Fog — muted grey
    return "linear-gradient(180deg, #6b7280 0%, #4b5563 60%, #374151 100%)";
  }
  return "linear-gradient(180deg, #0077b6 0%, #023e8a 60%, #001233 100%)";
}

// Accent glow color per condition (for rim light / accent)
function getAccentGlow(icon: string, isNight?: boolean): string {
  const code = (icon || "").toLowerCase();
  if (code.includes("01")) return isNight ? "rgba(255,235,59,0.15)" : "rgba(255,183,3,0.2)";
  if (code.includes("02") || code.includes("03")) return "rgba(135,206,235,0.15)";
  if (code.includes("04")) return "rgba(160,174,192,0.1)";
  if (code.includes("09") || code.includes("10")) return "rgba(66,165,245,0.15)";
  if (code.includes("11")) return "rgba(255,235,59,0.1)";
  if (code.includes("13")) return "rgba(255,255,255,0.15)";
  if (code.includes("50")) return "rgba(176,190,197,0.1)";
  return "rgba(255,183,3,0.15)";
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-xl px-3 py-2 flex items-center gap-2"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <span className="text-sm">{icon}</span>
      <div>
        <p className="text-[10px] text-white/50 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

const WeatherWidget = memo(function WeatherWidget({ data }: { data: WeatherData }) {
  const IconComponent = getWeather3DIcon(data.icon, data.condition);
  const background = get3DBackground(data.icon, data.isNight);
  const accentGlow = getAccentGlow(data.icon, data.isNight);
  const locationLabel = data.country ? `${data.city}, ${data.country}` : data.city;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
      className="my-4 max-w-sm"
    >
      <div
        className="rounded-[36px] overflow-hidden relative"
        style={{
          background,
          boxShadow: `
            inset 0 1px 2px rgba(255,255,255,0.15),
            inset 0 -2px 4px rgba(0,0,0,0.4),
            0 20px 40px rgba(0,0,0,0.5),
            0 0 60px ${accentGlow}
          `,
        }}
      >
        {/* Ambient accent glow at top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${accentGlow} 0%, transparent 70%)`,
            filter: "blur(20px)",
          }}
        />

        {/* ── Main 3D section ── */}
        <div className="p-6 text-white relative">
          {/* Header: Date & Location */}
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
              {data.date && (
                <p
                  className="text-sm font-medium opacity-80"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                >
                  {data.date}
                </p>
              )}
              {data.detected && (
                <span
                  className="inline-block mt-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Auto-detected
                </span>
              )}
            </div>
            <div className="text-right">
              <h3
                className="text-lg font-medium"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
              >
                {data.city}
              </h3>
              {data.country && (
                <p className="text-xs opacity-60">{data.country}</p>
              )}
            </div>
          </div>

          {/* Center 3D Icon */}
          <div className="flex justify-center items-center my-2 relative z-10">
            <IconComponent isNight={data.isNight} />
          </div>

          {/* Bottom: Temperature & Condition */}
          <div className="flex justify-between items-end relative z-10 mt-2">
            <div>
              <span
                className="text-5xl font-light tabular-nums"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                {data.temp}°
              </span>
              {data.feelsLike !== undefined && data.feelsLike !== data.temp && (
                <p className="text-xs opacity-60 mt-1">Feels {data.feelsLike}°</p>
              )}
            </div>
            <div className="text-right">
              {data.tempMin !== undefined && data.tempMax !== undefined && (
                <p
                  className="text-sm opacity-80 mb-1"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                >
                  {data.tempMin}° ~ {data.tempMax}°
                </p>
              )}
              <p
                className="text-base font-medium capitalize"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                {data.condition}
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-2">
          <StatChip icon="💧" label="Humidity" value={`${data.humidity}%`} />
          <StatChip icon="🌬️" label="Wind" value={`${data.windSpeed} m/s`} />
          {data.visibility !== undefined && (
            <StatChip icon="👁️" label="Visibility" value={`${data.visibility} km`} />
          )}
          {data.pressure !== undefined && (
            <StatChip icon="📊" label="Pressure" value={`${data.pressure} hPa`} />
          )}
          {data.cloudiness !== undefined && (
            <StatChip icon="☁️" label="Cloudiness" value={`${data.cloudiness}%`} />
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default WeatherWidget;
