"use client";

import { useMemo } from "react";

interface CalendarData {
  utcDatetime: string;
  timezone: string;
  label: string;
}

export default function CalendarWidget({ data }: { data: CalendarData }) {
  const utcDate = new Date(data.utcDatetime);
  const today = utcDate.toLocaleDateString("en-US", { timeZone: data.timezone });
  const [monthName, dayNum, year] = today.split(/[\s,]+/);
  const fullDate = utcDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: data.timezone,
  });

  // Get month details for grid
  const yearNum = utcDate.toLocaleString("en-US", { year: "numeric", timeZone: data.timezone });
  const monthNum = utcDate.toLocaleString("en-US", { month: "2-digit", timeZone: data.timezone });
  const firstDay = new Date(`${yearNum}-${monthNum}-01T00:00:00`);
  const startDay = firstDay.getDay(); // 0 = Sun
  const daysInMonth = new Date(Number(yearNum), Number(monthNum.split("-")[1]), 0).getDate();

  const todayDay = parseInt(utcDate.toLocaleString("en-US", { day: "numeric", timeZone: data.timezone }), 10);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarCells = useMemo(() => {
    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`e-${i}`} className="text-gray-300 text-sm">{}</div>);
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === todayDay;
      cells.push(
        <div
          key={d}
          className={`text-sm rounded-full w-8 h-8 flex items-center justify-center ${isToday ? "bg-indigo-600 text-white font-bold" : "text-gray-700 hover:bg-gray-100"}`}
        >
          {d}
        </div>
      );
    }
    return cells;
  }, [startDay, daysInMonth, todayDay]);

  return (
    <div className="my-4 rounded-2xl p-5 bg-white shadow-lg max-w-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-700 mb-1">📅 {monthName} {year}</h3>
      <p className="text-sm text-gray-500 mb-3">{fullDate}</p>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(d => (
          <div key={d} className="text-xs font-medium text-gray-400 text-center">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells}
      </div>

      <div className="text-xs text-gray-400 mt-3">{data.label}</div>
    </div>
  );
}