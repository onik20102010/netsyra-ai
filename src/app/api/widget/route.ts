import { NextRequest } from "next/server";
import { getWeather, getCurrentTimeCard, getCurrentCalendarCard } from "@/lib/services/real-time";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type"); // "weather", "time", "calendar"
  const query = req.nextUrl.searchParams.get("query") || "";

  let result = "";
  if (type === "weather") {
    const city = query.replace(/weather|temperature|rain|forecast|in /gi, "").trim() || "Lahore";
    result = await getWeather(city);
  } else if (type === "time") {
    const zone = query.replace(/time|clock|in /gi, "").trim() || undefined;
    result = await getCurrentTimeCard(zone);
  } else if (type === "calendar" || type === "date") {
    const zone = query.replace(/date|calendar|in /gi, "").trim() || undefined;
    result = await getCurrentCalendarCard(zone);
  }

  if (!result) {
    return new Response("Could not fetch data", { status: 500 });
  }

  return new Response(result, { headers: { "Content-Type": "text/plain" } });
}