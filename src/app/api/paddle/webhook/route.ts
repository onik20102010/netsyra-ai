import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Verify webhook signature (simplified – add proper verification later)
  const eventType = body.event_type;
  const subscriptionId = body.data?.id;
  const userId = body.data?.custom_data?.user_id;

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // use service role to bypass RLS
  );

  if (eventType === "subscription.activated") {
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      paddle_subscription_id: subscriptionId,
      status: "active",
      current_period_end: body.data?.current_billing_period?.ends_at,
    });
  } else if (eventType === "subscription.canceled") {
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("paddle_subscription_id", subscriptionId);
  }

  return NextResponse.json({ received: true });
}
