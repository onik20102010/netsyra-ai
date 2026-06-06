// src/lib/time-utils.ts

const HOLIDAY_API = "https://date.nager.at/api/v3";

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

  // --- Primary: timeapi.io ---
  try {
    const res = await fetch(`https://timeapi.io/api/Time/current/zone?timeZone=${encodeURIComponent(tz)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        time: data.time,
        date: data.date,
        timezone: data.timeZone || tz,
        countryCode: data.countryCode || tz.split("/")[1] || "PK",
        source: "🌐 Live from timeapi.io",
        utcTimestamp: Date.now(),
        latitude: 0,
        longitude: 0,
      };
    }
  } catch {
    // fall through
  }

  // --- Fallback: worldtimeapi.org ---
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
        timezone: tz,
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

  // --- Ultimate fallback: server clock ---
  const now = new Date();
  return {
    time: now.toLocaleTimeString("en-US", { timeZone: tz, hour12: true }),
    date: now.toLocaleDateString("en-US", {
      timeZone: tz,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
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

// ── Weather support (Open-Meteo, no API key) ──
export async function getWeather(
  latitude: number,
  longitude: number,
  timezone: string
): Promise<string | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=${encodeURIComponent(timezone)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const weather = data.current_weather;
    if (!weather) return null;
    return `🌡️ ${weather.temperature}°C, 💨 ${weather.windspeed} km/h, ☁️ Weather code: ${weather.weathercode}`;
  } catch {
    return null;
  }
}

// ── City/Timezone → approximate coordinates ──────────────────
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
  };
  return coords[tz] || { latitude: 0, longitude: 0 };
}