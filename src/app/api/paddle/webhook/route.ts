import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(";").map((part) => part.trim().split("="))
    );
    const ts = parts["ts"];
    const h1 = parts["h1"];
    if (!ts || !h1) return false;

    const signedPayload = `${ts}:${rawBody}`;
    const expectedH1 = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(h1),
      Buffer.from(expectedH1)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") || "";

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET is missing");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event_type;
  const userId = event.data?.custom_data?.user_id;
  if (!userId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Only process the events we care about
  const relevantEvents = [
    "subscription.activated",
    "subscription.updated",
    "subscription.canceled",
    "transaction.ready",
    "transaction.completed",
  ];
  if (!relevantEvents.includes(eventType)) {
    return NextResponse.json({ received: true });
  }

  const items = event.data?.items;
  const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
  const customerId = event.data.customer_id || "pending";

  // ── Ensure customer exists before subscription (FK constraint) ──
  if (customerId !== "pending") {
    await supabase.from("customers").upsert({
      customer_id: customerId,
      email: event.data.email || "unknown",
      updated_at: new Date().toISOString(),
    }, { onConflict: "customer_id" });
  }

  // ── Insert / update subscription with fallback for product_id ──
  const subscriptionData = {
    subscription_id: event.data.subscription_id || event.data.id,
    customer_id: customerId,
    user_id: userId,
    status: event.data.status || "active",
    price_id: firstItem?.price?.id || "unknown",
    product_id: firstItem?.product?.id || "unknown",
    scheduled_change_action: event.data.scheduled_change?.action,
    scheduled_change_at: event.data.scheduled_change?.effective_at,
    current_period_end:
      event.data.current_billing_period?.ends_at ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(subscriptionData, { onConflict: "subscription_id" });

  if (error) {
    console.error("Subscription upsert error:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}