import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Paddle } from "@paddle/paddle-node-sdk";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve customer ID from your database (not from client!)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("customer_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!sub?.customer_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  const paddle = new Paddle({ apiKey: process.env.PADDLE_API_KEY! });
  try {
    const session = await paddle.customers.createPortalSession({
      customerId: sub.customer_id,
      configurationId: process.env.PADDLE_PORTAL_CONFIG_ID!,   // obtain from Paddle dashboard → Customer portal
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Portal session error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
