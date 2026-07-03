"use client";

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string; // e.g., "sun", "cloud", "rain", "snow", "storm"
}

const iconMap: Record<string, string> = {
  sun: "☀️",
  cloud: "⛅",
  rain: "🌧️",
  snow: "❄️",
  storm: "⛈️",
  fog: "🌫️",
  night: "🌙",
};

export default function WeatherWidget({ data }: { data: WeatherData }) {
  const emoji = iconMap[data.icon] || "🌤️";

  return (
    <div
      className="my-4 rounded-2xl p-5 text-white shadow-xl max-w-sm"
      style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-5xl">{emoji}</span>
        <div>
          <h3 className="text-xl font-semibold">{data.city}</h3>
          <p className="text-4xl font-bold">{data.temp}°C</p>
          <p className="text-sm opacity-90 capitalize">{data.condition}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div>💧 Humidity: {data.humidity}%</div>
        <div>🌬️ Wind: {data.windSpeed} m/s</div>
      </div>
    </div>
  );
}