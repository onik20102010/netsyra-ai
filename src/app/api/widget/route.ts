import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWeatherData, detectUserRegion, extractMentionedCity } from "@/lib/time-utils";
import { getCurrentTimeCard, getCurrentCalendarCard } from "@/lib/chat/services/real-time";

const VALID_TYPES = new Set(["weather", "time", "calendar", "date"]);
const MAX_QUERY_LENGTH = 100;

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type");
  const query = (req.nextUrl.searchParams.get("query") || "").trim();

  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid widget type" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  let result = "";
  if (type === "weather") {
    // If user mentioned a city → use it; otherwise auto-detect region
    const mentionedCity = extractMentionedCity(query);
    let city: string;
    let detected = false;
    if (mentionedCity) {
      city = mentionedCity;
    } else {
      const region = await detectUserRegion(req);
      city = region.city;
      detected = true;
    }
    const weatherData = await getWeatherData(city, undefined, { detected });
    if (weatherData) {
      result = `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
    }
  } else if (type === "time") {
    const zone = query.replace(/time|clock|in /gi, "").trim() || undefined;
    result = await getCurrentTimeCard(zone);
  } else if (type === "calendar" || type === "date") {
    const zone = query.replace(/date|calendar|in /gi, "").trim() || undefined;
    result = await getCurrentCalendarCard(zone);
  }

  if (!result) {
    return NextResponse.json({ error: "Could not fetch data" }, { status: 500 });
  }

  return new Response(result, { headers: { "Content-Type": "text/plain" } });
}