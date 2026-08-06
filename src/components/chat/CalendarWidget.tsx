"use client";

import { motion } from "framer-motion";

interface CalendarData {
  timezone: string;
  label: string;
  utcDatetime?: string;
  formattedDate?: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDateInTimezone(timezone: string): { year: number; month: number; day: number; weekday: number; fullDate: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || "0";
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const weekdayName = get("weekday");
  const weekday = DAYS.findIndex(d => weekdayName.startsWith(d)) || 0;
  const fullDate = `${weekdayName}, ${MONTHS[month - 1]} ${day}, ${year}`;
  return { year, month, day, weekday, fullDate };
}

export default function CalendarWidget({ data }: { data: CalendarData }) {
  const dateInfo = getDateInTimezone(data.timezone);
  const displayDate = data.formattedDate || dateInfo.fullDate;

  const firstDay = new Date(dateInfo.year, dateInfo.month - 1, 1).getDay();
  const daysInMonth = new Date(dateInfo.year, dateInfo.month, 0).getDate();

  const cells: { day: number | null; isToday: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isToday: d === dateInfo.day });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
      className="my-4 max-w-xs"
    >
      <div className="rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-100">
        {/* Header gradient bar */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />
        {/* Body */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <motion.span
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              className="text-xl"
            >
              📅
            </motion.span>
            <h3 className="text-base font-semibold text-gray-700">
              {MONTHS[dateInfo.month - 1]} {dateInfo.year}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">{displayDate}</p>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d, i) => (
              <div
                key={d}
                className={`text-[10px] font-bold uppercase text-center py-1 ${i === 0 ? "text-red-400" : "text-gray-400"}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => (
              cell.day === null ? (
                <div key={`e-${i}`} />
              ) : (
                <motion.div
                  key={cell.day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.03 * i, type: "spring", stiffness: 300 }}
                  className={`text-sm w-8 h-8 flex items-center justify-center rounded-full font-medium ${
                    cell.isToday
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold shadow-md ring-2 ring-blue-200"
                      : (i % 7 === 0)
                        ? "text-red-400 hover:bg-gray-100"
                        : "text-gray-700 hover:bg-gray-100"
                  } cursor-default transition-colors`}
                >
                  {cell.day}
                </motion.div>
              )
            ))}
          </div>

          {/* Timezone footer */}
          <p className="text-[10px] text-gray-400 mt-3 font-mono text-center">{data.timezone}</p>
        </div>
      </div>
    </motion.div>
  );
}
