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
    // Return 200 so Paddle stops retrying
    return NextResponse.json({ received: true });
  }

  // Always acknowledge the event, even if signature fails
  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    console.error("Invalid signature – event acknowledged anyway");
    return NextResponse.json({ received: true });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true });
  }

  const userId = event.data?.custom_data?.user_id;
  if (!userId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Process only the events we care about
  const relevantEvents = [
    "subscription.activated",
    "subscription.updated",
    "subscription.canceled",
    "transaction.ready",
    "transaction.completed",
  ];
  if (!relevantEvents.includes(event.event_type)) {
    return NextResponse.json({ received: true });
  }

  const items = event.data?.items;
  const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
  const customerId = event.data.customer_id || "pending";

  // Determine plan from product name or price ID
  let plan = "free";
  if (firstItem?.price?.id) {
    const priceId = firstItem.price.id;
    // Map price IDs to plans
    if (priceId === 'pri_01kyf27thzh41n39q3cja2cphq') {
      plan = "go_plus";
    } else if (priceId === 'pri_01kyf2acjbxs0s8nytjae84ckm') {
      plan = "pro";
    } else if (priceId === 'pri_01kyf2ckc62mpde2s2rfmdjra4') {
      plan = "plus_pro";
    }
  }

  // Fallback to product name if price ID doesn't match
  if (plan === "free" && firstItem?.product?.name) {
    const productName = firstItem.product.name.toLowerCase();
    if (productName.includes("go plus")) plan = "go_plus";
    else if (productName.includes("+pro") || productName.includes("plus pro")) plan = "plus_pro";
    else if (productName.includes("pro")) plan = "pro";
  }

  console.log(`🔍 Webhook: Determined plan "${plan}" from priceId: ${firstItem?.price?.id}, productName: ${firstItem?.product?.name}`);

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
    plan,
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
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}