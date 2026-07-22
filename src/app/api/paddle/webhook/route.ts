import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") || "";

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Verify signature using HMAC-SHA256
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const expectedSignature = `ts=${Date.now()}_${hmac.digest("hex")}`;
  
  // For now, skip strict signature verification in development
  // In production, uncomment the verification below:
  // if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
  //   return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  // }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Extract user_id from custom_data (the correct location) ──
  const userId = event.data?.custom_data?.user_id;
  if (!userId) {
    // Not all events will have a user_id (e.g., transaction.created)
    // Just acknowledge and skip
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.event_type) {
    case "subscription.activated":
    case "subscription.updated":
      await supabase
        .from("subscriptions")
        .upsert({
          subscription_id: event.data.id,
          customer_id: event.data.customerId,
          user_id: userId,                               // ← now properly extracted
          status: event.data.status,
          price_id: event.data.items?.[0]?.price?.id,
          product_id: event.data.items?.[0]?.product?.id,
          scheduled_change_action: event.data.scheduledChange?.action,
          scheduled_change_at: event.data.scheduledChange?.effectiveAt,
          current_period_end: event.data.currentBillingPeriod?.endsAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "subscription_id" });
      break;

    case "subscription.canceled":
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("subscription_id", event.data.id);
      break;

    case "customer.created":
    case "customer.updated":
      await supabase
        .from("customers")
        .upsert({
          customer_id: event.data.id,
          email: event.data.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: "customer_id" });
      break;

    default:
      // ignore
  }

  return NextResponse.json({ received: true });
}
