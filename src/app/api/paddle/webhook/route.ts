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

  console.log("=== WEBHOOK RECEIVED ===");
  console.log("Signature header:", signature);
  console.log("Raw body (first 200 chars):", rawBody.substring(0, 200));

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  console.log("Secret exists:", !!secret, "Secret length:", secret?.length);

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Signature verification
  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    console.error("=== SIGNATURE VERIFICATION FAILED ===");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("Event type:", event.event_type);
  console.log("User ID from custom_data:", event.data?.custom_data?.user_id);

  // Only process subscription & customer events
  const eventType = event.event_type;
  if (
    !["subscription.activated", "subscription.updated", "subscription.canceled",
      "customer.created", "customer.updated"].includes(eventType)
  ) {
    return NextResponse.json({ received: true });  // acknowledge and ignore
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
    switch (eventType) {
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
    }
  } catch (err) {
    console.error("Webhook DB error:", err);
    console.error("Event body:", rawBody);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}