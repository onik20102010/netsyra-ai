import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") || "";

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET is missing");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Parse the event
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("Failed to parse webhook body:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = event.data?.custom_data?.user_id;
  // Not all events have a user_id – just acknowledge those without one
  if (!userId) {
    console.log(`Event ${event.event_type} has no user_id – skipping`);
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.event_type) {
      case "subscription.activated":
      case "subscription.updated": {
        const items = event.data?.items;
        const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;

        await supabase.from("subscriptions").upsert({
          subscription_id: event.data.id,
          customer_id: event.data.customer_id,
          user_id: userId,
          status: event.data.status,
          price_id: firstItem?.price?.id,
          product_id: firstItem?.product?.id,
          scheduled_change_action: event.data.scheduled_change?.action,
          scheduled_change_at: event.data.scheduled_change?.effective_at,
          current_period_end: event.data.current_billing_period?.ends_at,
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

      default:
        // ignore other events
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
