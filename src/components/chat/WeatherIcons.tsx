// Custom weather icons as inline SVG components

export function SunIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="14" fill="#FFB300" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 32 + 20 * Math.cos(rad);
        const y1 = 32 + 20 * Math.sin(rad);
        const x2 = 32 + 24 * Math.cos(rad);
        const y2 = 32 + 24 * Math.sin(rad);
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFB300" strokeWidth="3" strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function CloudSunIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="24" cy="26" r="12" fill="#FFB300" />
      <path d="M42 44c0 6.6-5.4 12-12 12H20c-7.7 0-14-6.3-14-14 0-6.5 4.4-11.9 10.3-13.6C16.7 24.8 20.7 22 25.5 22c3.4 0 6.4 1.3 8.7 3.4C36.3 24.5 39 24 42 24c5.5 0 10 4.5 10 10s-4.5 10-10 10z" fill="#B0BEC5" />
      <circle cx="24" cy="26" r="12" fill="#FFB300" opacity="0.9" />
    </svg>
  );
}

export function CloudIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M42 44c0 6.6-5.4 12-12 12H20c-7.7 0-14-6.3-14-14 0-6.5 4.4-11.9 10.3-13.6C16.7 24.8 20.7 22 25.5 22c3.4 0 6.4 1.3 8.7 3.4C36.3 24.5 39 24 42 24c5.5 0 10 4.5 10 10s-4.5 10-10 10z" fill="#90A4AE" />
    </svg>
  );
}

export function RainIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M42 38c0 5.5-4.5 10-10 10H20c-6.6 0-12-5.4-12-12 0-5.5 3.7-10.1 8.7-11.5C17.1 22.4 20.5 20 24.5 20c2.8 0 5.3 1 7.3 2.7C33.5 21.8 35.8 21 38.5 21c4.7 0 8.5 3.8 8.5 8.5s-3.8 8.5-8.5 8.5H42z" fill="#78909C" />
      <line x1="20" y1="44" x2="16" y2="56" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="44" x2="26" y2="56" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="44" x2="36" y2="56" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SnowIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M42 38c0 5.5-4.5 10-10 10H20c-6.6 0-12-5.4-12-12 0-5.5 3.7-10.1 8.7-11.5C17.1 22.4 20.5 20 24.5 20c2.8 0 5.3 1 7.3 2.7C33.5 21.8 35.8 21 38.5 21c4.7 0 8.5 3.8 8.5 8.5s-3.8 8.5-8.5 8.5H42z" fill="#B0BEC5" />
      <circle cx="18" cy="48" r="2" fill="white" />
      <circle cx="28" cy="52" r="2" fill="white" />
      <circle cx="38" cy="48" r="2" fill="white" />
      <circle cx="23" cy="56" r="2" fill="white" />
      <circle cx="33" cy="58" r="2" fill="white" />
    </svg>
  );
}

export function StormIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M42 38c0 5.5-4.5 10-10 10H20c-6.6 0-12-5.4-12-12 0-5.5 3.7-10.1 8.7-11.5C17.1 22.4 20.5 20 24.5 20c2.8 0 5.3 1 7.3 2.7C33.5 21.8 35.8 21 38.5 21c4.7 0 8.5 3.8 8.5 8.5s-3.8 8.5-8.5 8.5H42z" fill="#546E7A" />
      <path d="M30 36l-6 12h4l-2 6 8-14h-4l2-6z" fill="#FFC107" />
    </svg>
  );
}

export function FogIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <line x1="14" y1="26" x2="50" y2="26" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="34" x2="46" y2="34" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line x1="14" y1="42" x2="50" y2="42" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="50" x2="46" y2="50" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function NightIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M38 12C28 12 20 20 20 30s8 18 18 18c2.5 0 4.9-.5 7-1.4C40.5 44.2 38 40 38 35.5s2.5-8.7 7-11.1C42.9 12.5 40.5 12 38 12z" fill="#FFCA28" />
      <circle cx="44" cy="18" r="1.5" fill="#FFCA28" />
      <circle cx="48" cy="24" r="1" fill="#FFCA28" />
      <circle cx="46" cy="30" r="1.5" fill="#FFCA28" />
    </svg>
  );
}

// Map condition string to icon component
const iconComponents: Record<string, React.FC> = {
  sun: SunIcon,
  "sunny": SunIcon,
  "clear": SunIcon,
  "mostly sunny": CloudSunIcon,
  "partly cloudy": CloudSunIcon,
  "cloudy": CloudIcon,
  "overcast": CloudIcon,
  "scattered clouds": CloudIcon,
  "broken clouds": CloudIcon,
  rain: RainIcon,
  "light rain": RainIcon,
  "heavy rain": RainIcon,
  "showers": RainIcon,
  snow: SnowIcon,
  "light snow": SnowIcon,
  "heavy snow": SnowIcon,
  storm: StormIcon,
  thunderstorm: StormIcon,
  fog: FogIcon,
  mist: FogIcon,
  haze: FogIcon,
  night: NightIcon,
  "clear night": NightIcon,
};

export function getWeatherIcon(condition: string): React.FC {
  const lower = condition.toLowerCase().trim();
  // Find the best match
  for (const [key, comp] of Object.entries(iconComponents)) {
    if (lower.includes(key)) return comp;
  }
  return SunIcon; // default
}