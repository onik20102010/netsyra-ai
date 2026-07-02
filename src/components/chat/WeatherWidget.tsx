"use client";

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
}

export default function WeatherWidget({ data }: { data: WeatherData }) {
  const iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;

  return (
    <div
      className="my-4 rounded-2xl p-5 text-white shadow-xl max-w-md"
      style={{
        background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        <img src={iconUrl} alt={data.description} className="w-16 h-16" />
        <div>
          <h3 className="text-xl font-semibold">
            {data.city}, {data.country}
          </h3>
          <p className="text-4xl font-bold">{data.temp}°C</p>
          <p className="text-sm opacity-90 capitalize">{data.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div>💧 Humidity: {data.humidity}%</div>
        <div>🌬️ Wind: {data.windSpeed} m/s</div>
        <div>🌡️ Feels like: {data.feelsLike}°C</div>
        <div>👁️ Visibility: {data.visibility} km</div>
      </div>
    </div>
  );
}