// src/lib/services/real-time.ts

// A reliable city‑to‑timezone map (can be extended, but Open‑Meteo will catch the rest)
const HARDCODED_TIMEZONES: Record<string, string> = {
  lahore: "Asia/Karachi",
  karachi: "Asia/Karachi",
  islamabad: "Asia/Karachi",
  "new york": "America/New_York",
  london: "Europe/London",
  tokyo: "Asia/Tokyo",
  paris: "Europe/Paris",
  sydney: "Australia/Sydney",
  dubai: "Asia/Dubai",
  mumbai: "Asia/Kolkata",
  delhi: "Asia/Kolkata",
  singapore: "Asia/Singapore",
  berlin: "Europe/Berlin",
  toronto: "America/Toronto",
};

async function resolveCityToTimezone(city: string): Promise<string | null> {
  // 1. Check hardcoded map
  const key = city.toLowerCase().trim();
  if (HARDCODED_TIMEZONES[key]) return HARDCODED_TIMEZONES[key];

  // 2. Use Open‑Meteo geocoding (free, no key)
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.results?.length > 0) {
        return data.results[0].timezone; // e.g. "Asia/Karachi"
      }
    }
  } catch {}

  return null;
}

// ── Weather (returns widget marker) ──────────
export async function getWeather(city: string): Promise<string> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return "";
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`
    );
    if (!res.ok) return "";
    const data = await res.json();
    const weatherData = {
      city: data.name,
      country: data.sys.country,
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      visibility: (data.visibility / 1000).toFixed(1),
    };
    return `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
  } catch {
    return "";
  }
}

// ── Unified time/date data fetcher (used by clock & calendar) ──
async function fetchTimeData(zone?: string): Promise<{
  utcDatetime: string;
  timezone: string;
  label: string;
} | null> {
  let resolvedZone = zone || "UTC";

  // If a zone was provided and it's not already an IANA timezone, resolve it
  if (zone && !/^[A-Za-z_]+\/[A-Za-z_]+$/.test(zone)) {
    const resolved = await resolveCityToTimezone(zone);
    if (resolved) resolvedZone = resolved;
    else {
      // Could not resolve – return null and let the caller decide
      console.warn("Could not resolve timezone for:", zone);
      return null;
    }
  }

  // Try TimeZoneDB (if key exists)
  const tzKey = process.env.TIMEZONEDB_API_KEY;
  if (tzKey) {
    try {
      const res = await fetch(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=${tzKey}&format=json&by=zone&zone=${encodeURIComponent(resolvedZone)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") {
          return {
            utcDatetime: new Date(data.timestamp * 1000).toISOString(),
            timezone: data.zoneName,
            label: `${zone || data.zoneName}`,
          };
        }
      }
    } catch {}
  }

  // Fallback: worldtimeapi.org
  try {
    const res = await fetch(
      `https://worldtimeapi.org/api/timezone/${encodeURIComponent(resolvedZone)}`
    );
    if (res.ok) {
      const data = await res.json();
      return {
        utcDatetime: data.utc_datetime,
        timezone: data.timezone,
        label: `${zone || data.timezone}`,
      };
    }
  } catch {}

  return null; // No more fallbacks – if we can't get the time, we return null
}

// ── Time (returns clock widget marker) ───────
export async function getCurrentTimeCard(zone?: string): Promise<string> {
  const data = await fetchTimeData(zone);
  if (!data) return "";
  const clockData = {
    utcDatetime: data.utcDatetime,
    timezone: data.timezone,
    label: data.label,
  };
  return `<!--WIDGET:CLOCK:${JSON.stringify(clockData)}-->`;
}

// ── Date / Calendar (returns calendar widget marker) ──
export async function getCurrentCalendarCard(zone?: string): Promise<string> {
  const data = await fetchTimeData(zone);
  if (!data) return "";
  const calData = {
    utcDatetime: data.utcDatetime,
    timezone: data.timezone,
    label: data.label,
  };
  return `<!--WIDGET:CALENDAR:${JSON.stringify(calData)}-->`;
}

// ── News (returns plain text, no widget) ──────
export async function getNews(query?: string): Promise<string> {
  const key = process.env.NEWSAPI_API_KEY;
  if (!key) return "";
  const q = query || "latest";
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=5&apiKey=${key}`
    );
    if (!res.ok) return "";
    const data = await res.json();
    if (!data.articles?.length) return "";
    return data.articles
      .map((a: any) => `- [${a.title}](${a.url}) (${a.source.name})`)
      .join("\n");
  } catch {
    return "";
  }
}