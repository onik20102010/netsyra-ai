import { createClient } from "@supabase/supabase-js";

export async function logRetrieval(
  supabase: any,
  userId: string,
  originalQuery: string,
  rewrittenQueries: string[],
  urlsUsed: string[],
  sourcesUsed: string[],
  answer: string
) {
  try {
    await supabase.from("retrieval_logs").insert({
      user_id: userId,
      query: originalQuery,
      rewritten_queries: rewrittenQueries,
      urls_used: urlsUsed,
      sources_used: sourcesUsed,
      answer: answer.substring(0, 1000), // truncate for storage
    });
  } catch (err) {
    console.error("Failed to log retrieval:", err);
  }
}