// src/lib/chat/calendar-detector.ts
//
// Detects which calendar system(s) to show based on the user's timezone/region.
//
// The browser's Intl API supports these calendar systems:
//   - gregory   (Gregorian — default worldwide)
//   - islamic   (Islamic/Hijri — used in Muslim-majority countries)
//   - islamic-umalqura (Saudi Arabia's official calendar)
//   - hebrew    (Hebrew/Jewish — Israel)
//   - indian    (Indian National Calendar — India)
//   - chinese   (Chinese Calendar — China, Taiwan, etc.)
//   - persian   (Persian/Solar Hijri — Iran, Afghanistan)
//
// We detect the primary calendar from the timezone, and also show the
// Gregorian date as a secondary reference (since it's the global standard).

export type CalendarSystem =
  | "gregory"
  | "islamic"
  | "islamic-umalqura"
  | "hebrew"
  | "indian"
  | "chinese"
  | "persian";

export interface CalendarInfo {
  /** Primary calendar system for the user's region */
  primary: CalendarSystem;
  /** Human-readable label for the primary calendar */
  primaryLabel: string;
  /** Whether to also show the Gregorian date as a secondary reference */
  showGregorian: boolean;
}

// ── Timezone → calendar mapping ─────────────────────────────────
// Based on the IANA timezone's country/region component.

const TIMEZONE_CALENDAR_MAP: Record<string, CalendarSystem> = {
  // ── Islamic (Hijri) — Muslim-majority countries ──
  // Saudi Arabia uses Umm al-Qura calendar officially
  "Asia/Riyadh":       "islamic-umalqura",
  "Asia/Mecca":        "islamic-umalqura",
  "Asia/Jeddah":       "islamic-umalqura",
  // Other Gulf / Muslim countries use standard Islamic
  "Asia/Dubai":        "islamic",
  "Asia/Qatar":        "islamic",
  "Asia/Bahrain":      "islamic",
  "Asia/Kuwait":       "islamic",
  "Asia/Muscat":       "islamic",
  "Asia/Baghdad":      "islamic",
  "Asia/Kabul":        "islamic",
  "Asia/Karachi":      "islamic",
  "Asia/Tehran":       "persian",  // Iran uses Solar Hijri (Persian)
  "Asia/Yerevan":      "gregory",
  "Asia/Dhaka":        "islamic",
  "Asia/Damascus":     "islamic",
  "Asia/Amman":        "islamic",
  "Asia/Beirut":       "islamic",
  "Africa/Cairo":      "islamic",
  "Africa/Algiers":    "islamic",
  "Africa/Tunis":      "islamic",
  "Africa/Casablanca": "islamic",
  "Africa/Tripoli":    "islamic",
  "Africa/Khartoum":   "islamic",
  "Africa/Mogadishu":  "islamic",
  "Africa/Djibouti":   "islamic",
  "Indian/Maldives":   "islamic",
  "Asia/Jakarta":      "islamic",
  "Asia/Kuala_Lumpur": "islamic",
  "Asia/Kuching":      "islamic",
  "Asia/Brunei":       "islamic",

  // ── Hebrew — Israel ──
  "Asia/Jerusalem":    "hebrew",
  "Asia/Tel_Aviv":     "hebrew",

  // ── Indian National Calendar — India ──
  "Asia/Kolkata":      "indian",
  "Asia/Calcutta":     "indian",
  "Asia/Delhi":        "indian",
  "Asia/Mumbai":       "indian",
  "Asia/Bangalore":    "indian",
  "Asia/Chennai":      "indian",
  "Asia/Hyderabad":    "indian",
  "Asia/Thimphu":      "indian",
  "Asia/Colombo":      "indian",
  "Asia/Kathmandu":    "indian",

  // ── Chinese Calendar — China, Taiwan, Hong Kong, Singapore ──
  "Asia/Shanghai":     "chinese",
  "Asia/Beijing":      "chinese",
  "Asia/Chongqing":    "chinese",
  "Asia/Harbin":       "chinese",
  "Asia/Urumqi":       "chinese",
  "Asia/Hong_Kong":    "chinese",
  "Asia/Taipei":       "chinese",
  "Asia/Macau":        "chinese",
  "Asia/Singapore":    "chinese",
  "Asia/Ho_Chi_Minh":  "chinese",
  "Asia/Phnom_Penh":   "chinese",
  "Asia/Vientiane":    "chinese",
  "Asia/Seoul":        "chinese",
  "Asia/Pyongyang":    "chinese",
  "Asia/Tokyo":        "gregory",  // Japan uses Gregorian primarily
};

// ── Country-code fallback (extracted from timezone) ──
// Some timezones don't have explicit mappings above; we use the
// country code from the timezone to determine the calendar.

const COUNTRY_CALENDAR_MAP: Record<string, CalendarSystem> = {
  // Muslim-majority countries (by ISO code)
  SA: "islamic-umalqura",  // Saudi Arabia
  AE: "islamic",           // UAE
  QA: "islamic",           // Qatar
  BH: "islamic",           // Bahrain
  KW: "islamic",           // Kuwait
  OM: "islamic",           // Oman
  IQ: "islamic",           // Iraq
  AF: "islamic",           // Afghanistan
  PK: "islamic",           // Pakistan
  IR: "persian",           // Iran
  BD: "islamic",           // Bangladesh
  SY: "islamic",           // Syria
  JO: "islamic",           // Jordan
  LB: "islamic",           // Lebanon
  YE: "islamic",           // Yemen
  EG: "islamic",           // Egypt
  DZ: "islamic",           // Algeria
  TN: "islamic",           // Tunisia
  MA: "islamic",           // Morocco
  LY: "islamic",           // Libya
  SD: "islamic",           // Sudan
  SO: "islamic",           // Somalia
  DJ: "islamic",           // Djibouti
  MV: "islamic",           // Maldives
  ID: "islamic",           // Indonesia
  MY: "islamic",           // Malaysia
  BN: "islamic",           // Brunei
  TR: "islamic",           // Turkey
  // Hebrew
  IL: "hebrew",
  // Indian
  IN: "indian",
  LK: "indian",            // Sri Lanka
  NP: "indian",            // Nepal
  BT: "indian",            // Bhutan
  // Chinese
  CN: "chinese",
  TW: "chinese",
  HK: "chinese",
  MO: "chinese",
  SG: "chinese",
  VN: "chinese",
  KH: "chinese",
  LA: "chinese",
  KR: "chinese",
};

// ── Labels for each calendar system ──

const CALENDAR_LABELS: Record<CalendarSystem, string> = {
  "gregory":           "Gregorian",
  "islamic":           "Islamic (Hijri)",
  "islamic-umalqura":  "Islamic (Umm al-Qura)",
  "hebrew":            "Hebrew",
  "indian":            "Indian National",
  "chinese":           "Chinese",
  "persian":           "Persian (Solar Hijri)",
};

/**
 * Detect the appropriate calendar system from a timezone string.
 * Falls back to Gregorian if the timezone is unknown.
 *
 * @param timezone  IANA timezone (e.g. "Asia/Karachi", "Asia/Jerusalem")
 */
export function detectCalendar(timezone: string): CalendarInfo {
  // 1. Direct timezone match
  if (TIMEZONE_CALENDAR_MAP[timezone]) {
    const primary = TIMEZONE_CALENDAR_MAP[timezone];
    return {
      primary,
      primaryLabel: CALENDAR_LABELS[primary],
      showGregorian: primary !== "gregory",
    };
  }

  // 2. Extract country code from timezone and try country map
  // IANA timezones for some countries include a country code in the
  // resolved options. We use Intl to get the region.
  try {
    const resolved = new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    const options = resolved.resolvedOptions();
    // Try to extract region from locale — not always available
    // Fallback: check if any known timezone prefix matches
    for (const [tz, cal] of Object.entries(TIMEZONE_CALENDAR_MAP)) {
      if (timezone.startsWith(tz.split("/")[0] + "/")) {
        return {
          primary: cal,
          primaryLabel: CALENDAR_LABELS[cal],
          showGregorian: cal !== "gregory",
        };
      }
    }
  } catch {
    // Invalid timezone — fall through to default
  }

  // 3. Default: Gregorian
  return {
    primary: "gregory",
    primaryLabel: CALENDAR_LABELS["gregory"],
    showGregorian: false,
  };
}

/**
 * Format a date in a specific calendar system using Intl.DateTimeFormat.
 *
 * @param date       JavaScript Date object
 * @param calendar   Calendar system to use
 * @param timezone   IANA timezone
 * @param locale     Locale (default "en-US")
 */
export function formatDateInCalendar(
  date: Date,
  calendar: CalendarSystem,
  timezone: string,
  locale: string = "en-US"
): { fullDate: string; weekday: string; day: string; month: string; year: string } {
  try {
    const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`, {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || "";

    return {
      fullDate: formatter.format(date),
      weekday: get("weekday"),
      day: get("day"),
      month: get("month"),
      year: get("year"),
    };
  } catch {
    // Calendar not supported by the browser — fall back to Gregorian
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || "";
    return {
      fullDate: formatter.format(date),
      weekday: get("weekday"),
      day: get("day"),
      month: get("month"),
      year: get("year"),
    };
  }
}
