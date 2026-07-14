import { createBrowserClient } from "@supabase/ssr";

type Schema = "public" | "chat" | "ide";

function createSchemaClient(schema: Schema) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase URL and Anon Key are required");
  }

  return createBrowserClient(url, anonKey, {
    db: { schema },
  });
}

export function createClient() {
  return createSchemaClient("public");
}

export function createSharedClient() {
  return createSchemaClient("public");
}

export function createChatClient() {
  return createSchemaClient("chat");
}

export function createIdeClient() {
  return createSchemaClient("ide");
}