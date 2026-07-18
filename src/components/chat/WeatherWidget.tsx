"use client";
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

export default function WeatherWidget({ data }: { data: WeatherData }) {
  const IconComponent = getWeatherIcon(data.icon, data.condition);

  return (
    <div
      className="my-4 rounded-2xl p-5 text-white shadow-xl max-w-sm"
      style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}
    >
      <div className="flex items-center gap-3">
        <IconComponent />
        <div>
          <h3 className="text-xl font-semibold">{data.city}</h3>
          <p className="text-4xl font-bold">{data.temp}°C</p>
          <p className="text-sm opacity-90 capitalize">{data.condition}</p>
          {data.feelsLike !== undefined && (
            <p className="text-xs opacity-75">Feels like {data.feelsLike}°C</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div>💧 Humidity: {data.humidity}%</div>
        <div>🌬️ Wind: {data.windSpeed} m/s</div>
        {data.visibility !== undefined && (
          <div>👁️ Visibility: {data.visibility} km</div>
        )}
        {data.pressure !== undefined && (
          <div>📊 Pressure: {data.pressure} hPa</div>
        )}
        {data.cloudiness !== undefined && (
          <div>☁️ Cloudiness: {data.cloudiness}%</div>
        )}
      </div>
    </div>
  );
}