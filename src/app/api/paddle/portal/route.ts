import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("customer_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!sub?.customer_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  const apiKey = process.env.PADDLE_API_KEY;
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";
  const baseUrl = environment === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

  try {
    const res = await fetch(`${baseUrl}/customers/${sub.customer_id}/portal-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        configuration_id: process.env.PADDLE_PORTAL_CONFIG_ID,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Paddle portal API error:", errorText);
      return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.data?.url });
  } catch (err) {
    console.error("Portal session error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
