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

  console.log(`🔍 Webhook received: event_type unknown, user_id unknown`);

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET is missing");
    // Return 200 so Paddle stops retrying
    return NextResponse.json({ received: true });
  }

  // Reject invalid signatures — Paddle will retry with a valid one
  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    console.error("Invalid webhook signature — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
    console.log(`🔍 Webhook parsed: event_type=${event.event_type}, user_id=${event.data?.custom_data?.user_id}`);
  } catch {
    console.error("Failed to parse webhook body");
    return NextResponse.json({ received: true });
  }

  const userId = event.data?.custom_data?.user_id;
  if (!userId) {
    console.error("No user_id in webhook custom_data");
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Process only subscription events we care about
  // Transaction events have a different data structure and are handled separately
  const subscriptionEvents = [
    "subscription.activated",
    "subscription.updated",
    "subscription.canceled",
  ];
  const transactionEvents = [
    "transaction.ready",
    "transaction.completed",
  ];

  if (!subscriptionEvents.includes(event.event_type) && !transactionEvents.includes(event.event_type)) {
    console.log(`🔍 Webhook: Ignoring event type ${event.event_type}`);
    return NextResponse.json({ received: true });
  }

  // ── Handle subscription cancellation / expiry ──
  // Paddle fires `subscription.canceled` when a subscription ends (either user-cancelled
  // or non-renewing plan reached period end). We mark the Supabase subscription as
  // `cancelled`, clear the profile tier, but KEEP all chat history (no cascade delete).
  // The user can repurchase immediately — a new subscription row is created on re-buy.
  if (event.event_type === "subscription.canceled") {
    const subscriptionId = event.data.subscription_id || event.data.id;
    const canceledStatus = event.data.status || "canceled";

    console.log(`🗑️ Webhook: subscription.canceled for sub ${subscriptionId}, user ${userId}`);

    const { error: cancelError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        scheduled_change_action: null,
        scheduled_change_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("subscription_id", subscriptionId);

    if (cancelError) {
      console.error("Subscription cancellation update error:", cancelError.message);
      return NextResponse.json({ received: true });
    }

    // Clear the profile tier so the user reverts to free access
    await supabase.from("profiles").update({ subscription_tier: "free" }).eq("user_id", userId);

    console.log(`✅ Webhook: Subscription ${subscriptionId} marked cancelled for user ${userId}. History preserved. User can repurchase.`);
    return NextResponse.json({ received: true });
  }

  // For transaction events, only process if a subscription_id is present
  // (transaction events may fire before subscription is created)
  if (transactionEvents.includes(event.event_type)) {
    const txSubscriptionId = event.data?.subscription_id;
    if (!txSubscriptionId) {
      console.log(`🔍 Webhook: Transaction ${event.event_type} has no subscription_id, skipping`);
      return NextResponse.json({ received: true });
    }
    // Use transaction-specific fields
    const txItems = event.data?.items;
    const txFirstItem = Array.isArray(txItems) && txItems.length > 0 ? txItems[0] : null;
    const txCustomerId = event.data?.customer_id || "pending";

    // Determine plan from price ID
    let txPlan = "free";
    if (txFirstItem?.price?.id) {
      const priceId = txFirstItem.price.id;
      if (priceId === 'pri_01kzk7f0he4j0sjxtg0zf1k6qp') txPlan = "go_plus";
      else if (priceId === 'pri_01kzk7hac9j383j19ffs0k2jwm') txPlan = "pro";
      else if (priceId === 'pri_01kzk7k5hr9wnfs70zd4a5zde9') txPlan = "plus_pro";
    }

    if (txPlan === "free" && txFirstItem?.product?.name) {
      const productName = txFirstItem.product.name.toLowerCase();
      if (productName.includes("go plus")) txPlan = "go_plus";
      else if (productName.includes("+pro") || productName.includes("plus pro")) txPlan = "plus_pro";
      else if (productName.includes("pro")) txPlan = "pro";
    }

    if (txCustomerId !== "pending") {
      await supabase.from("customers").upsert({
        customer_id: txCustomerId,
        email: event.data?.customer?.email || "unknown",
        updated_at: new Date().toISOString(),
      }, { onConflict: "customer_id" });
    }

    // Timer starts at purchase. Use Paddle's billing period end when available;
    // otherwise default to now + 30 days (one-month plan).
    const txPeriodEnd =
      event.data?.current_billing_period?.ends_at ||
      event.data?.billing_period?.ends_at ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const txSubData = {
      subscription_id: txSubscriptionId,
      customer_id: txCustomerId,
      user_id: userId,
      status: "active",
      price_id: txFirstItem?.price?.id || "unknown",
      product_id: txFirstItem?.product?.id || "unknown",
      plan: txPlan,
      current_period_end: txPeriodEnd,
      updated_at: new Date().toISOString(),
    };

    const { error: txError } = await supabase
      .from("subscriptions")
      .upsert(txSubData, { onConflict: "subscription_id" });

    if (txError) {
      console.error("Transaction subscription upsert error:", txError.message);
      return NextResponse.json({ received: true });
    }

    console.log(`✅ Webhook: Successfully upserted subscription from transaction for user ${userId}, plan ${txPlan}`);

    // Update profiles.subscription_tier for admin display
    await supabase.from("profiles").update({ subscription_tier: txPlan }).eq("user_id", userId);

    return NextResponse.json({ received: true });
  }

  const items = event.data?.items;
  const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
  const customerId = event.data.customer_id || "pending";

  console.log(`🔍 Webhook: items=${JSON.stringify(items)}, customerId=${customerId}`);

  // Determine plan from product name or price ID
  let plan = "free";
  if (firstItem?.price?.id) {
    const priceId = firstItem.price.id;
    console.log(`🔍 Webhook: priceId=${priceId}`);
    // Map price IDs to plans
    if (priceId === 'pri_01kzk7f0he4j0sjxtg0zf1k6qp') {
      plan = "go_plus";
    } else if (priceId === 'pri_01kzk7hac9j383j19ffs0k2jwm') {
      plan = "pro";
    } else if (priceId === 'pri_01kzk7k5hr9wnfs70zd4a5zde9') {
      plan = "plus_pro";
    }
  }

  // Fallback to product name if price ID doesn't match
  if (plan === "free" && firstItem?.product?.name) {
    const productName = firstItem.product.name.toLowerCase();
    console.log(`🔍 Webhook: productName=${productName}`);
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
  // For `subscription.updated`, detect if the billing period has ended.
  // Paddle sends `status: "canceled"` on the update event when a non-renewing
  // plan reaches period end — we honour that. If the period end is in the past
  // and status is canceled, mark as cancelled in Supabase too.
  const paddleStatus = event.data.status || "active";
  const periodEndRaw =
    event.data.current_billing_period?.ends_at ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const periodEndDate = new Date(periodEndRaw);
  const isPeriodEnded = periodEndDate.getTime() < Date.now();
  const isCanceledStatus = paddleStatus === "canceled" || paddleStatus === "cancelled";

  // Normalize status: Paddle uses "canceled" (American spelling); we store "cancelled"
  const normalizedStatus = isCanceledStatus ? "cancelled" : paddleStatus;

  // If the period has ended OR Paddle says canceled, the subscription is expired
  const finalStatus = (isPeriodEnded || isCanceledStatus) ? "cancelled" : normalizedStatus;

  const subscriptionData = {
    subscription_id: event.data.subscription_id || event.data.id,
    customer_id: customerId,
    user_id: userId,
    status: finalStatus,
    price_id: firstItem?.price?.id || "unknown",
    product_id: firstItem?.product?.id || "unknown",
    plan,
    scheduled_change_action: event.data.scheduled_change?.action,
    scheduled_change_at: event.data.scheduled_change?.effective_at,
    current_period_end: periodEndRaw,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(subscriptionData, { onConflict: "subscription_id" });

  if (error) {
    console.error("Subscription upsert error:", error.message);
    return NextResponse.json({ received: true });
  }

  console.log(`✅ Webhook: Successfully upserted subscription for user ${userId}, plan ${plan}, status ${finalStatus}`);

  // Update profiles.subscription_tier for admin display
  // If the subscription is cancelled, revert the user to free access.
  // Chat history is preserved (no deletion) — the user can repurchase at any time.
  const tierToSet = finalStatus === "cancelled" ? "free" : plan;
  await supabase.from("profiles").update({ subscription_tier: tierToSet }).eq("user_id", userId);

  if (finalStatus === "cancelled") {
    console.log(`ℹ️ Webhook: Subscription expired for user ${userId}. Access reverted to free. History preserved. User can repurchase.`);
  }

  return NextResponse.json({ received: true });
}