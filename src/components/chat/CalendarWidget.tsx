"use client";

import { motion } from "framer-motion";
import { useMemo, memo } from "react";

interface CalendarData {
  timezone: string;
  label: string;
  utcDatetime?: string;
  formattedDate?: string;
  // Calendar system detected from user's timezone
  calendar?: string;       // "islamic", "hebrew", "indian", "chinese", "persian", "gregory"
  calendarLabel?: string;  // "Islamic (Hijri)", "Hebrew", etc.
  showGregorian?: boolean; // Whether to also show Gregorian as secondary
}

type CalendarSystem = "gregory" | "islamic" | "islamic-umalqura" | "hebrew" | "indian" | "chinese" | "persian";

const GREGORIAN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GREGORIAN_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/**
 * Format a date in a specific calendar system using the browser's Intl API.
 * Falls back to Gregorian if the calendar is not supported.
 */
function formatDateInCalendar(
  date: Date,
  calendar: CalendarSystem,
  timezone: string
): { fullDate: string; weekday: string; day: string; month: string; year: string } {
  try {
    const formatter = new Intl.DateTimeFormat(`en-US-u-ca-${calendar}`, {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || "";
    return {
      fullDate: formatter.format(date),
      weekday: get("weekday"),
      day: get("day"),
      month: get("month"),
      year: get("year"),
    };
  } catch {
    // Calendar not supported — fall back to Gregorian
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || "";
    return {
      fullDate: formatter.format(date),
      weekday: get("weekday"),
      day: get("day"),
      month: get("month"),
      year: get("year"),
    };
  }
}

/**
 * Get Gregorian date info for the calendar grid (always Gregorian for the grid,
 * since non-Gregorian calendars don't map cleanly to a 7-column grid).
 */
function getGregorianDateInfo(timezone: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || "0";
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const weekdayName = get("weekday");
  const weekday = GREGORIAN_DAYS.findIndex(d => weekdayName.startsWith(d));
  if (weekday < 0) return { year, month, day, weekday: 0 };
  return { year, month, day, weekday };
}

const CalendarWidget = memo(function CalendarWidget({ data }: { data: CalendarData }) {
  const calendarSystem = (data.calendar as CalendarSystem) || "gregory";
  const showGregorian = data.showGregorian ?? false;

  const dateInfo = useMemo(() => {
    const now = data.utcDatetime ? new Date(data.utcDatetime) : new Date();
    const greg = getGregorianDateInfo(data.timezone);
    const primary = formatDateInCalendar(now, calendarSystem, data.timezone);
    const gregorianRef = showGregorian
      ? formatDateInCalendar(now, "gregory", data.timezone)
      : null;
    return { greg, primary, gregorianRef };
  }, [data.utcDatetime, data.timezone, calendarSystem, showGregorian]);

  // Build the Gregorian grid (used for all calendars — the grid is always
  // Gregorian, but the header shows the detected calendar's date)
  const firstDay = new Date(dateInfo.greg.year, dateInfo.greg.month - 1, 1).getDay();
  const daysInMonth = new Date(dateInfo.greg.year, dateInfo.greg.month, 0).getDate();

  const cells: { day: number | null; isToday: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isToday: d === dateInfo.greg.day });
  }

  const isGregorian = calendarSystem === "gregory";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
      className="my-4 max-w-xs"
    >
      <div className="rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-100">
        {/* Header gradient bar — color varies by calendar system */}
        <div className="h-2" style={{
          background: isGregorian
            ? "linear-gradient(90deg, #3b82f6, #06b6d4, #14b8a6)"
            : calendarSystem.startsWith("islamic") || calendarSystem === "persian"
            ? "linear-gradient(90deg, #10b981, #059669, #047857)"
            : calendarSystem === "hebrew"
            ? "linear-gradient(90deg, #6366f1, #4f46e5, #4338ca)"
            : calendarSystem === "indian"
            ? "linear-gradient(90deg, #f59e0b, #f97316, #ea580c)"
            : calendarSystem === "chinese"
            ? "linear-gradient(90deg, #ef4444, #dc2626, #b91c1c)"
            : "linear-gradient(90deg, #3b82f6, #06b6d4, #14b8a6)",
        }} />

        <div className="p-5">
          {/* Header: calendar system label + primary date */}
          <div className="flex items-center gap-2 mb-1">
            <motion.span
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              className="text-xl"
            >
              📅
            </motion.span>
            <h3 className="text-base font-semibold text-gray-700">
              {dateInfo.primary.month} {dateInfo.primary.year}
            </h3>
          </div>

          {/* Calendar system badge */}
          {!isGregorian && data.calendarLabel && (
            <span
              className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2"
              style={{
                background: calendarSystem.startsWith("islamic") || calendarSystem === "persian"
                  ? "rgba(16,185,129,0.12)"
                  : calendarSystem === "hebrew"
                  ? "rgba(99,102,241,0.12)"
                  : calendarSystem === "indian"
                  ? "rgba(245,158,11,0.12)"
                  : calendarSystem === "chinese"
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(59,130,246,0.12)",
                color: calendarSystem.startsWith("islamic") || calendarSystem === "persian"
                  ? "#059669"
                  : calendarSystem === "hebrew"
                  ? "#4f46e5"
                  : calendarSystem === "indian"
                  ? "#d97706"
                  : calendarSystem === "chinese"
                  ? "#dc2626"
                  : "#2563eb",
              }}
            >
              {data.calendarLabel}
            </span>
          )}

          {/* Primary date (in detected calendar) */}
          <p className="text-xs text-gray-500 mb-2">{dateInfo.primary.fullDate}</p>

          {/* Gregorian reference (secondary, if non-Gregorian) */}
          {showGregorian && dateInfo.gregorianRef && (
            <p className="text-[11px] text-gray-400 mb-3 italic">
              Gregorian: {dateInfo.gregorianRef.fullDate}
            </p>
          )}

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {GREGORIAN_DAYS.map((d, i) => (
              <div
                key={d}
                className={`text-[10px] font-bold uppercase text-center py-1 ${i === 0 ? "text-red-400" : "text-gray-400"}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid (always Gregorian grid) */}
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
});

export default CalendarWidget;
