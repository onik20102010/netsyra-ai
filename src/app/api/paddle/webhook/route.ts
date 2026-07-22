import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Paddle } from "@paddle/paddle-node-sdk";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") || "";

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET is missing");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event;
  try {
    // Use the SDK's unmarshal method – it does exist
    event = Paddle.webhooks.unmarshal(rawBody, secret, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const userId = event.data?.custom_data?.user_id;
  if (!userId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.eventType) {
      case "subscription.activated":
      case "subscription.updated": {
        const items = event.data?.items;
        const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;

        await supabase.from("subscriptions").upsert({
          subscription_id: event.data.id,
          customer_id: event.data.customerId,
          user_id: userId,
          status: event.data.status,
          price_id: firstItem?.price?.id,
          product_id: firstItem?.product?.id,
          scheduled_change_action: event.data.scheduledChange?.action,
          scheduled_change_at: event.data.scheduledChange?.effectiveAt,
          current_period_end: event.data.currentBillingPeriod?.endsAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "subscription_id" });
        break;
      }

      case "subscription.canceled":
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("subscription_id", event.data.id);
        break;

      case "customer.created":
      case "customer.updated":
        await supabase.from("customers").upsert({
          customer_id: event.data.id,
          email: event.data.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: "customer_id" });
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
