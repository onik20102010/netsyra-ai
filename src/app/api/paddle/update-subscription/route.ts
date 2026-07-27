import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Direct subscription update endpoint (fallback for webhook in sandbox)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, priceId, customerId, subscriptionId, status } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    // Determine plan from price ID
    let plan = "free";
    const priceIdMap: Record<string, string> = {
      'pri_01kyf27thzh41n39q3cja2cphq': 'go_plus',
      'pri_01kyf2acjbxs0s8nytjae84ckm': 'pro',
      'pri_01kyf2ckc62mpde2s2rfmdjra4': 'plus_pro',
    };

    plan = priceIdMap[priceId] || "free";

    console.log(`🔍 Direct update: userId=${userId}, priceId=${priceId}, plan=${plan}`);

    if (plan === "free") {
      return NextResponse.json({ error: "Unknown priceId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const subscriptionData = {
      subscription_id: subscriptionId || `manual_${userId}_${Date.now()}`,
      customer_id: customerId || "pending",
      user_id: userId,
      status: status || "active",
      price_id: priceId,
      product_id: "unknown",
      plan,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "subscription_id" });

    if (error) {
      console.error("Direct subscription update error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Direct update: Successfully set plan ${plan} for user ${userId}`);

    // Update profiles.subscription_tier for admin display
    await supabase.from("profiles").update({ subscription_tier: plan }).eq("user_id", userId);

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error("Direct update failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
