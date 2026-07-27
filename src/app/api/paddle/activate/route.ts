import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId } = await req.json();
  if (!transactionId) {
    return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
  }

  // 1. Verify the transaction with Paddle
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Paddle not configured" }, { status: 500 });

  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";
  const baseUrl = environment === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

  console.log(`🔍 Activate: Verifying transaction ${transactionId} with Paddle (${environment})`);

  const txRes = await fetch(`${baseUrl}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!txRes.ok) {
    console.error("Paddle fetch transaction failed:", await txRes.text());
    return NextResponse.json({ error: "Failed to verify transaction" }, { status: 500 });
  }

  const txData = await txRes.json();
  const transaction = txData.data;

  // 2. Only activate if the transaction is completed
  if (transaction.status !== "completed") {
    console.log(`🔍 Activate: Transaction status is ${transaction.status}, not completed`);
    return NextResponse.json({ error: "Transaction not completed yet" }, { status: 400 });
  }

  // 3. Determine the plan from the product name (same logic as webhook)
  const firstItem = transaction.items?.[0];
  let plan = "free";
  if (firstItem?.product?.name) {
    const productName = firstItem.product.name.toLowerCase();
    if (productName.includes("go plus")) plan = "go_plus";
    else if (productName.includes("+pro")) plan = "plus_pro";
    else if (productName.includes("pro")) plan = "pro";
  }

  console.log(`🔍 Activate: Determined plan "${plan}" from productName: ${firstItem?.product?.name}`);

  if (plan === "free") {
    console.error("Activate: Could not determine plan from transaction");
    return NextResponse.json({ error: "Could not determine plan from transaction" }, { status: 400 });
  }

  // 4. Upsert subscription in Supabase
  const subscriptionData = {
    subscription_id: transaction.subscription_id || transaction.id,
    customer_id: transaction.customer_id || "pending",
    user_id: user.id,
    status: "active",
    price_id: firstItem?.price?.id || "unknown",
    product_id: firstItem?.product?.id || "unknown",
    plan,
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(subscriptionData, { onConflict: "subscription_id" });

  if (error) {
    console.error("Activation upsert error:", error.message);
    return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
  }

  console.log(`✅ Activate: Successfully activated plan ${plan} for user ${user.id}`);
  return NextResponse.json({ success: true, plan });
}
