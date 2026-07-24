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

  // Ignore events without a user_id
  if (!userId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ── Process subscription events ─────────────
    if (
      eventType === "subscription.activated" ||
      eventType === "subscription.updated" ||
      eventType === "subscription.canceled"
    ) {
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
    }

    // ── NEW: Process transaction events for instant activation ──
    if (eventType === "transaction.ready" || eventType === "transaction.completed") {
      const items = event.data?.items;
      const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;

      // Create an "instant" subscription record using the transaction data
      await supabase.from("subscriptions").upsert({
        subscription_id: event.data.subscription_id || event.data.id, // fallback to transaction id
        customer_id: event.data.customer_id || "pending",
        user_id: userId,
        status: "active",
        price_id: firstItem?.price?.id,
        product_id: firstItem?.product?.id,
        current_period_end: event.data.billing_period?.ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "subscription_id" });
    }

    // ── Process customer events ─────────────────
    if (eventType === "customer.created" || eventType === "customer.updated") {
      await supabase.from("customers").upsert({
        customer_id: event.data.id,
        email: event.data.email,
        updated_at: new Date().toISOString(),
      }, { onConflict: "customer_id" });
    }
  } catch (err) {
    console.error("Webhook DB error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}