import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveRedirectTo } from "@/lib/auth-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; "password-reset"?: string }>;
}) {
  const params = await searchParams;
  const target = resolveRedirectTo(params.redirectTo);

  // Already signed in → never show the login screen, go straight to the app.
  // Password-recovery links keep the form so the flow isn't hijacked.
  if (params["password-reset"] === undefined) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(target);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your Netsyra AI account">
      <LoginForm redirectTo={target} />
    </AuthCard>
  );
}
