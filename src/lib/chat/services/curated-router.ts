import { CURATED_SOURCES, type CuratedSource } from "./curated-sources";

// Quick Wikipedia title search
async function wikiTitles(query: string): Promise<string[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data[1] || [];
  } catch {
    return [];
  }
}

export async function routeToCuratedSources(query: string): Promise<CuratedSource[]> {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  // 1. Keyword match against curated sources
  const matches = CURATED_SOURCES.filter(
    (s) =>
      s.title.toLowerCase().includes(lowerQuery) ||
      s.url.toLowerCase().includes(lowerQuery)
  );
  if (matches.length > 0) {
    console.log(
      `📚 Keyword match: ${matches.map((s) => s.title).join(", ")}`
    );
    return matches.slice(0, 3); // return top 3 matches
  }

  // 2. Fallback: Wikipedia title search
  console.log("⚠️ No curated match – searching Wikipedia");
  const titles = await wikiTitles(query);
  if (titles.length > 0) {
    const title = titles[0];
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s/g, "_"))}`;
    console.log(`   Using Wikipedia: ${title}`);
    return [{ url, title: `${title} (Wikipedia)` }];
  }

  return [];
}