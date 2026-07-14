import { createServerSupabaseClient } from "./server";

export interface AuthResult {
  userId: string | null;
  error: Response | null;
}

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    return { userId: null, error: new Response("Unauthorized", { status: 401 }) };
  }
  return { userId: data.session.user.id, error: null };
}
