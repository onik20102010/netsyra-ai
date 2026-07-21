"use client";

import { useEffect, useState } from "react";

interface ClockData {
  timezone: string;
  label: string;
}

function AnalogClock({ h, m, s }: { h: number; m: number; s: number }) {
  const safeH = isNaN(h) ? 0 : h;
  const safeM = isNaN(m) ? 0 : m;
  const safeS = isNaN(s) ? 0 : s;

  const hAngle = (safeH % 12) * 30 + safeM * 0.5;
  const mAngle = safeM * 6;
  const sAngle = safeS * 6;

  const hourX2 = 75 + 35 * Math.sin((hAngle * Math.PI) / 180);
  const hourY2 = 75 - 35 * Math.cos((hAngle * Math.PI) / 180);
  const minuteX2 = 75 + 50 * Math.sin((mAngle * Math.PI) / 180);
  const minuteY2 = 75 - 50 * Math.cos((mAngle * Math.PI) / 180);
  const secondX2 = 75 + 55 * Math.sin((sAngle * Math.PI) / 180);
  const secondY2 = 75 - 55 * Math.cos((sAngle * Math.PI) / 180);

  return (
    <svg width="150" height="150" viewBox="0 0 150 150">
      <circle cx="75" cy="75" r="70" fill="white" stroke="#333" strokeWidth="4" />
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => {
        const ang = (i * 30 * Math.PI) / 180;
        const x = 75 + 60 * Math.sin(ang);
        const y = 75 - 60 * Math.cos(ang);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#333">
            {i}
          </text>
        );
      })}
      <line x1="75" y1="75" x2={hourX2} y2={hourY2} stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="75" y1="75" x2={minuteX2} y2={minuteY2} stroke="#666" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="75" x2={secondX2} y2={secondY2} stroke="red" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="75" cy="75" r="4" fill="red" />
    </svg>
  );
}

export default function ClockWidget({ data }: { data: ClockData }) {
  const [time, setTime] = useState("");
  const [analogTime, setAnalogTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString("en-US", {
        timeZone: data.timezone,
        hour12: true,
      });
      setTime(formatted);

      // Get hours, minutes, seconds for analog clock
      const hours = parseInt(now.toLocaleTimeString("en-US", {
        timeZone: data.timezone,
        hour12: false,
        hour: "numeric",
      }));
      const minutes = parseInt(now.toLocaleTimeString("en-US", {
        timeZone: data.timezone,
        hour12: false,
        minute: "numeric",
      }));
      const seconds = parseInt(now.toLocaleTimeString("en-US", {
        timeZone: data.timezone,
        hour12: false,
        second: "numeric",
      }));

      setAnalogTime({ h: hours, m: minutes, s: seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [data.timezone]);

  return (
    <div className="my-4 rounded-2xl p-5 bg-gray-50 shadow-lg max-w-xs text-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">🕐 {data.label}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-2">{time}</div>
      <div className="text-sm text-gray-500 mb-2">{data.timezone}</div>
      <AnalogClock h={analogTime.h} m={analogTime.m} s={analogTime.s} />
    </div>
  );
}