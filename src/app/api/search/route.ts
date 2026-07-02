import { NextRequest, NextResponse } from "next/server";
import { search } from "duck-duck-scrape";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const result = await search(query);   // no options, uses default safeSearch
    const results = (result.results || []).slice(0, 5).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description?.slice(0, 300) || "",
    }));
    return NextResponse.json({ results });
  } catch (err) {
    console.error("DuckDuckGo search failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}