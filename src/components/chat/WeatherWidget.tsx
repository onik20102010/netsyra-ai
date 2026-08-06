"use client";

import { motion } from "framer-motion";
import { getWeatherIcon } from "./WeatherIcons";

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
}

// Gradient backgrounds based on condition
function getGradient(icon: string): string {
  if (icon.includes("01")) return "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)"; // clear
  if (icon.includes("02") || icon.includes("03")) return "linear-gradient(135deg, #4b79cf 0%, #283e51 100%)"; // partly cloudy
  if (icon.includes("04")) return "linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)"; // overcast
  if (icon.includes("09") || icon.includes("10")) return "linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)"; // rain
  if (icon.includes("11")) return "linear-gradient(135deg, #232526 0%, #414345 100%)"; // thunderstorm
  if (icon.includes("13")) return "linear-gradient(135deg, #83a4d4 0%, #b6fbff 100%)"; // snow
  if (icon.includes("50")) return "linear-gradient(135deg, #757F9A 0%, #D7DDE8 100%)"; // fog
  return "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2"
    >
      <span className="text-sm">{icon}</span>
      <div>
        <p className="text-[10px] text-white/60 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

export default function WeatherWidget({ data }: { data: WeatherData }) {
  const IconComponent = getWeatherIcon(data.icon, data.condition);
  const gradient = getGradient(data.icon);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
      className="my-4 max-w-sm"
    >
      <div
        className="rounded-3xl overflow-hidden shadow-xl"
        style={{ background: gradient }}
      >
        {/* Main section */}
        <div className="p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold drop-shadow-sm">{data.city}</h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-white/80 capitalize"
              >
                {data.condition}
              </motion.p>
            </div>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <IconComponent />
            </motion.div>
          </div>

          {/* Big temperature */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mt-3"
          >
            <span className="text-5xl font-bold tabular-nums drop-shadow-lg">{data.temp}°</span>
            <span className="text-2xl font-light text-white/70">C</span>
            {data.feelsLike !== undefined && data.feelsLike !== data.temp && (
              <p className="text-xs text-white/70 mt-1">Feels like {data.feelsLike}°C</p>
            )}
          </motion.div>
        </div>

        {/* Stats grid */}
        <div className="px-5 pb-5 grid grid-cols-2 gap-2">
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
}
