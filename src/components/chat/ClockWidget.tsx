"use client";

import { useEffect, useState } from "react";

interface ClockData {
  utcDatetime: string;
  timezone: string;
  label: string;
}

function AnalogClock({ hours, minutes, seconds }: { hours: number; minutes: number; seconds: number }) {
  // Guard against NaN – fallback to 0
  const safeHours = isNaN(hours) ? 0 : hours;
  const safeMinutes = isNaN(minutes) ? 0 : minutes;
  const safeSeconds = isNaN(seconds) ? 0 : seconds;

  const hAngle = (safeHours % 12) * 30 + safeMinutes * 0.5;
  const mAngle = safeMinutes * 6;
  const sAngle = safeSeconds * 6;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="80" r="75" fill="white" stroke="#333" strokeWidth="4" />
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => {
        const ang = (i * 30 * Math.PI) / 180;
        const x = 80 + 65 * Math.sin(ang);
        const y = 80 - 65 * Math.cos(ang);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontFamily="sans-serif" fill="#333">
            {i}
          </text>
        );
      })}
      <line x1="80" y1="80" x2={80 + 40 * Math.sin((hAngle * Math.PI) / 180)} y2={80 - 40 * Math.cos((hAngle * Math.PI) / 180)} stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="80" y1="80" x2={80 + 55 * Math.sin((mAngle * Math.PI) / 180)} y2={80 - 55 * Math.cos((mAngle * Math.PI) / 180)} stroke="#666" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2={80 + 60 * Math.sin((sAngle * Math.PI) / 180)} y2={80 - 60 * Math.cos((sAngle * Math.PI) / 180)} stroke="red" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="80" cy="80" r="4" fill="red" />
    </svg>
  );
}

export default function ClockWidget({ data }: { data: ClockData }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Safely parse UTC datetime
  const utcDate = new Date(data.utcDatetime);
  let hours = 0, minutes = 0, seconds = 0;
  let digital = "";

  try {
    // Use Intl to get local time in the target timezone
    const localOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: data.timezone,
    };
    digital = utcDate.toLocaleTimeString("en-US", localOptions);

    hours = parseInt(
      utcDate.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: data.timezone })
    );
    minutes = parseInt(
      utcDate.toLocaleString("en-US", { minute: "numeric", timeZone: data.timezone })
    );
    seconds = parseInt(
      utcDate.toLocaleString("en-US", { second: "numeric", timeZone: data.timezone })
    );
  } catch {}

  // Fallback to browser time if anything fails
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    const now = new Date();
    hours = now.getHours();
    minutes = now.getMinutes();
    seconds = now.getSeconds();
    digital = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  }

  const liveSeconds = (seconds + tick) % 60;
  const liveMinutes = (minutes + Math.floor((seconds + tick) / 60)) % 60;
  const liveHours = (hours + Math.floor((minutes + Math.floor((seconds + tick) / 60)) / 60)) % 24;

  return (
    <div className="my-4 rounded-2xl p-5 bg-gray-50 shadow-lg max-w-xs text-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">🕐 Current Time</h3>
      <div className="text-3xl font-bold text-gray-900">
        {String(liveHours).padStart(2, "0")}:{String(liveMinutes).padStart(2, "0")}:{String(liveSeconds).padStart(2, "0")}
      </div>
      <div className="text-sm text-gray-500 mb-3">{data.timezone}</div>
      <AnalogClock hours={liveHours} minutes={liveMinutes} seconds={liveSeconds} />
      <div className="text-xs text-gray-400 mt-2">{data.label}</div>
    </div>
  );
}