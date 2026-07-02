// src/lib/services/real-time.ts

// ── Weather (returns JSON marker for frontend card) ──
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

// ── Analog Clock SVG Generator (kept for reference, not used with new widget approach) ──
function analogClockSvg(hours: number, minutes: number, seconds: number, label: string): string {
  const hAngle = (hours % 12) * 30 + minutes * 0.5;
  const mAngle = minutes * 6;
  const sAngle = seconds * 6;

  return `<svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <circle cx="80" cy="80" r="75" fill="white" stroke="#333" stroke-width="4"/>
  ${[1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
    const ang = i * 30 * Math.PI / 180;
    const x = 80 + 65 * Math.sin(ang);
    const y = 80 - 65 * Math.cos(ang);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="12" font-family="sans-serif">${i}</text>`;
  }).join('')}
  <line x1="80" y1="80" x2="${80 + 40 * Math.sin(hAngle * Math.PI / 180)}" y2="${80 - 40 * Math.cos(hAngle * Math.PI / 180)}" stroke="#333" stroke-width="5" stroke-linecap="round"/>
  <line x1="80" y1="80" x2="${80 + 55 * Math.sin(mAngle * Math.PI / 180)}" y2="${80 - 55 * Math.cos(mAngle * Math.PI / 180)}" stroke="#666" stroke-width="3" stroke-linecap="round"/>
  <line x1="80" y1="80" x2="${80 + 60 * Math.sin(sAngle * Math.PI / 180)}" y2="${80 - 60 * Math.cos(sAngle * Math.PI / 180)}" stroke="red" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="80" cy="80" r="4" fill="red"/>
</svg>`;
}

// ── Dynamic city‑to‑timezone resolver (worldwide, no hardcoding) ──
async function resolveCityToTimezone(city: string): Promise<string | null> {
  try {
    // Use Open‑Meteo geocoding API (free, no key required)
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].timezone; // IANA timezone e.g., "Asia/Karachi"
    }
    return null;
  } catch {
    return null;
  }
}

function looksLikeTimezone(str: string): boolean {
  // IANA timezone format: "Continent/City" or "Etc/UTC" etc.
  return /^[A-Za-z_]+\/[A-Za-z_]+$/.test(str);
}

// ── Updated fetchTimeData with dynamic zone resolution ──
async function fetchTimeData(zone?: string): Promise<{
  utcDatetime: string;
  timezone: string;
  label: string;
} | null> {
  // If a zone is provided and it's not already a valid IANA timezone, resolve it
  let resolvedZone = zone || "UTC";

  if (zone && !looksLikeTimezone(zone)) {
    const resolved = await resolveCityToTimezone(zone);
    if (resolved) {
      resolvedZone = resolved;
    }
    // If resolution fails, fall through to UTC
  }

  // Try TimeZoneDB first (if key available and zone is resolved)
  const tzKey = process.env.TIMEZONEDB_API_KEY;
  if (tzKey && resolvedZone) {
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
            label: data.zoneName,
          };
        }
      }
    } catch {}
  }

  // Fallback: worldtimeapi.org
  if (resolvedZone) {
    try {
      const res = await fetch(
        `https://worldtimeapi.org/api/timezone/${encodeURIComponent(resolvedZone)}`
      );
      if (res.ok) {
        const data = await res.json();
        return {
          utcDatetime: data.utc_datetime,
          timezone: data.timezone,
          label: data.timezone,
        };
      }
    } catch {}
  }

  // Own IP time (timeapi.world)
  try {
    const res = await fetch("https://timeapi.world/clock/api/json");
    if (res.ok) {
      const data = await res.json();
      return {
        utcDatetime: new Date(data.currentDateTime).toISOString(),
        timezone: data.timezone,
        label: `Your location (${data.timezone})`,
      };
    }
  } catch {}

  // Ultimate fallback: UTC
  try {
    const res = await fetch("https://worldtimeapi.org/api/timezone/UTC");
    if (res.ok) {
      const data = await res.json();
      return {
        utcDatetime: data.utc_datetime,
        timezone: "UTC",
        label: "UTC",
      };
    }
  } catch {}

  return null;
}

// ── Time (returns JSON marker for frontend clock card) ──
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

// ── Calendar (reuses the same time data) ──
export async function getCurrentCalendarCard(zone?: string): Promise<string> {
  const data = await fetchTimeData(zone);
  if (!data) return "";
  return `<!--WIDGET:CALENDAR:${JSON.stringify(data)}-->`;
}

// ── News (unchanged) ───────────────────────────
export async function getNews(query?: string): Promise<string> {
  const key = process.env.NEWSAPI_API_KEY;
  if (!key) return "";
  const q = query || "latest";
  try {
    const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=5&apiKey=${key}`);
    if (!res.ok) return "";
    const data = await res.json();
    if (!data.articles?.length) return "";
    return data.articles.map((a: any) => `- [${a.title}](${a.url}) (${a.source.name})`).join("\n");
  } catch { return ""; }
}