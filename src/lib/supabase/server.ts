import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type Schema = "public" | "chat" | "ide";

async function createSchemaServerClient(schema: Schema) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

export async function createServerSupabaseClient() {
  return createSchemaServerClient("public");
}

export async function createSharedServerClient() {
  return createSchemaServerClient("public");
}

export async function createChatServerClient() {
  return createSchemaServerClient("chat");
}

export async function createIdeServerClient() {
  return createSchemaServerClient("ide");
}