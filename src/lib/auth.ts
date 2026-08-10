import { createClient } from "@/lib/supabase/client";
import { resolveRedirectTo } from "@/lib/auth-redirect";

export const signInWithEmail = async (email: string, password: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { data, error };
};

export const signInWithGoogle = async (redirectTo?: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${resolveRedirectTo(redirectTo)}`,
    },
  });
  return { data, error };
};

export const resetPassword = async (email: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login?password-reset=true`,
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};