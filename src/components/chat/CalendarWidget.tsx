"use client";

interface CalendarData {
  year: number;
  month: number; // 1–12
  day: number;
  timezone: string;
  label: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarWidget({ data }: { data: CalendarData }) {
  const firstDay = new Date(data.year, data.month - 1, 1).getDay();
  const daysInMonth = new Date(data.year, data.month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === data.day;
    cells.push(
      <div
        key={d}
        className={`text-sm w-8 h-8 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white font-bold" : "text-gray-700"}`}
      >
        {d}
      </div>
    );
  }

  return (
    <div className="my-4 rounded-2xl p-5 bg-white shadow-lg max-w-xs border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-700 mb-1">📅 {MONTHS[data.month - 1]} {data.year}</h3>
      <p className="text-sm text-gray-500 mb-3">{data.label}</p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => <div key={d} className="text-xs font-medium text-gray-400 text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}