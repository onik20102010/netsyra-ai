// src/lib/time-utils.ts

const HOLIDAY_API = "https://date.nager.at/api/v3";

// ── Weather data interface (matches WeatherWidget exactly) ──
export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;          // OpenWeatherMap icon code (e.g. "01d")
  feelsLike?: number;
  visibility?: string;   // km, as a string (e.g. "10.0")
  pressure?: number;     // hPa
  cloudiness?: number;   // %
}

// ── Open‑Meteo weather codes → condition descriptions ──
const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function getOpenWeatherIconFromWmo(code: number, isDay: boolean): string {
  // Map WMO code → OpenWeatherMap icon (used by your existing WeatherIcons)
  if (code === 0) return isDay ? "01d" : "01n";
  if (code <= 2) return isDay ? "02d" : "02n";
  if (code === 3) return "04d";
  if ([45, 48].includes(code)) return "50d";
  if ([51, 53, 55].includes(code)) return "09d";
  if ([56, 57].includes(code)) return "09d"; // freezing drizzle
  if ([61, 63, 65].includes(code)) return "10d";
  if ([66, 67].includes(code)) return "13d"; // freezing rain → use snow icon
  if ([71, 73, 75, 77].includes(code)) return "13d";
  if ([80, 81, 82].includes(code)) return "09d";
  if ([85, 86].includes(code)) return "13d";
  if ([95, 96, 99].includes(code)) return "11d";
  return "03d"; // fallback cloudy
}

export async function getCurrentTimeAndLocation(
  req: any,
  preferredTimezone?: string
): Promise<{
  time: string;
  date: string;
  timezone: string;
  countryCode: string;
  source: string;
  utcTimestamp: number;
  latitude: number;
  longitude: number;
}> {
  const tz = preferredTimezone || "Asia/Karachi";

  // --- Primary: worldtimeapi.org (most reliable for timezone conversion) ---
  try {
    const res = await fetch(`https://worldtimeapi.org/api/timezone/${encodeURIComponent(tz)}`);
    if (res.ok) {
      const data = await res.json();
      const dt = new Date(data.datetime);
      const timeStr = dt.toLocaleTimeString("en-US", { timeZone: tz, hour12: true });
      const dateStr = dt.toLocaleDateString("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return {
        time: timeStr,
        date: dateStr,
        timezone: data.timezone || tz,
        countryCode: tz.split("/")[1] || "PK",
        source: "🌐 Live from worldtimeapi.org",
        utcTimestamp: Date.now(),
        latitude: 0,
        longitude: 0,
      };
    }
  } catch {
    // fall through
  }

  // --- Fallback: TimeZoneDB ---
  const tzKey = process.env.TIMEZONEDB_API_KEY;
  if (tzKey) {
    try {
      const res = await fetch(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=${tzKey}&format=json&by=zone&zone=${encodeURIComponent(tz)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") {
          // Use Intl.DateTimeFormat for proper timezone conversion
          const timeStr = new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }).format(new Date(data.timestamp * 1000));

          const dateStr = new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(data.timestamp * 1000));

          return {
            time: timeStr,
            date: dateStr,
            timezone: data.zoneName || tz,
            countryCode: tz.split("/")[1] || "PK",
            source: "🌐 Live from TimeZoneDB",
            utcTimestamp: data.timestamp * 1000,
            latitude: 0,
            longitude: 0,
          };
        }
      }
    } catch {
      // fall through
    }
  }

  // --- Ultimate fallback: server clock ---
  const now = new Date();
  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  return {
    time: timeStr,
    date: dateStr,
    timezone: tz,
    countryCode: tz.split("/")[1] || "PK",
    source: "⏱️ Approximate (server fallback)",
    utcTimestamp: Date.now(),
    latitude: 0,
    longitude: 0,
  };
}

export async function getUpcomingHolidays(countryCode: string): Promise<string[]> {
  try {
    const year = new Date().getFullYear();
    const res = await fetch(`${HOLIDAY_API}/PublicHolidays/${year}/${countryCode}`);
    if (!res.ok) return [];
    const holidays: any[] = await res.json();
    const now = new Date();
    const upcoming = holidays
      .filter((h: any) => new Date(h.date) >= now)
      .slice(0, 5)
      .map((h: any) => `${h.localName} (${h.date})`);
    return upcoming;
  } catch {
    return [];
  }
}

// ── Core weather fetcher – returns full WeatherData ──
export async function getWeatherData(
  cityOrTimezone: string,
  countryCode?: string
): Promise<WeatherData | null> {
  try {
    // 1. Resolve coordinates + timezone from city name or IANA timezone
    const { latitude, longitude, timezone, cityName } = await resolveLocation(cityOrTimezone);

    // 2. Fetch comprehensive weather from Open‑Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,visibility,pressure_msl,cloudcover&timezone=${encodeURIComponent(timezone)}&forecast_days=1`;
    const res = await fetch(weatherUrl);
    if (!res.ok) return null;
    const data = await res.json();

    const current = data.current_weather;
    if (!current) return null;

    // 3. Extract current hour's data from hourly arrays
    const now = new Date();
    const currentHour = now.getHours();
    const hourly = data.hourly;
    let humidity = 0, visibility = "", pressure = 0, cloudiness = 0;
    if (hourly) {
      // Find the index closest to current hour
      const times: string[] = hourly.time;
      const idx = times.findIndex((t: string) => {
        const d = new Date(t);
        return d.getHours() === currentHour;
      });
      if (idx !== -1) {
        humidity = hourly.relativehumidity_2m?.[idx] ?? 0;
        pressure = hourly.pressure_msl?.[idx] ?? 0;
        cloudiness = hourly.cloudcover?.[idx] ?? 0;
        const visMeters = hourly.visibility?.[idx];
        if (visMeters != null) {
          visibility = (visMeters / 1000).toFixed(1); // convert to km
        }
      }
    }

    const weatherCode = current.weathercode;
    const condition = WMO_CODES[weatherCode] || "Unknown";
    const isDay = current.is_day === 1; // Open‑Meteo provides is_day
    const icon = getOpenWeatherIconFromWmo(weatherCode, isDay);

    return {
      city: cityName,
      temp: Math.round(current.temperature),
      condition,
      humidity: Math.round(humidity),
      windSpeed: current.windspeed,
      icon,
      feelsLike: Math.round(current.temperature), // Open‑Meteo doesn't provide feels_like; could use wind chill approximation if needed
      visibility, // string like "10.0"
      pressure: Math.round(pressure),
      cloudiness: Math.round(cloudiness),
    };
  } catch {
    return null;
  }
}

// ── Resolve location from city name or IANA timezone ──
async function resolveLocation(cityOrTimezone: string): Promise<{
  latitude: number;
  longitude: number;
  timezone: string;
  cityName: string;
}> {
  // If already a full IANA timezone (e.g. "Asia/Karachi"), use hardcoded fallback
  const hardcoded = getCityCoordinates(cityOrTimezone);
  if (hardcoded.latitude !== 0 || hardcoded.longitude !== 0) {
    return {
      latitude: hardcoded.latitude,
      longitude: hardcoded.longitude,
      timezone: cityOrTimezone,
      cityName: cityOrTimezone.split("/").pop() || cityOrTimezone,
    };
  }

  // Otherwise, treat as city name and geocode using Open‑Meteo (free)
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityOrTimezone)}&count=1&language=en&format=json`;
    const res = await fetch(geoUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.results?.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          timezone: result.timezone,
          cityName: result.name + (result.country ? `, ${result.country}` : ""),
        };
      }
    }
  } catch {}

  // Ultimate fallback – you can expand this further
  return {
    latitude: 0,
    longitude: 0,
    timezone: "UTC",
    cityName: cityOrTimezone,
  };
}

// ── Hardcoded city/timezone → coordinates (extended) ──
export function getCityCoordinates(tz: string): { latitude: number; longitude: number } {
  const coords: Record<string, { latitude: number; longitude: number }> = {
    "Asia/Karachi": { latitude: 24.8607, longitude: 67.0011 },
    "Asia/Tokyo": { latitude: 35.6762, longitude: 139.6503 },
    "Europe/London": { latitude: 51.5074, longitude: -0.1278 },
    "America/New_York": { latitude: 40.7128, longitude: -74.006 },
    "America/Los_Angeles": { latitude: 34.0522, longitude: -118.2437 },
    "Europe/Paris": { latitude: 48.8566, longitude: 2.3522 },
    "Europe/Berlin": { latitude: 52.52, longitude: 13.405 },
    "Asia/Dubai": { latitude: 25.2048, longitude: 55.2708 },
    "Australia/Sydney": { latitude: -33.8688, longitude: 151.2093 },
    "America/Toronto": { latitude: 43.6532, longitude: -79.3832 },
    "Asia/Kolkata": { latitude: 22.5726, longitude: 88.3639 },
    "Asia/Shanghai": { latitude: 31.2304, longitude: 121.4737 },
    "Europe/Moscow": { latitude: 55.7558, longitude: 37.6173 },
    "Asia/Seoul": { latitude: 37.5665, longitude: 126.978 },
    "Asia/Singapore": { latitude: 1.3521, longitude: 103.8198 },
    "Asia/Hong_Kong": { latitude: 22.3193, longitude: 114.1694 },
    "Europe/Istanbul": { latitude: 41.0082, longitude: 28.9784 },
    // ... add more as needed from your existing list
  };
  return coords[tz] || { latitude: 0, longitude: 0 };
}