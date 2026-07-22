import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId, customerEmail } = await req.json();
  console.log("PRICE ID:", priceId, "EMAIL:", customerEmail);

  const apiKey = process.env.PADDLE_API_KEY;
  console.log("API KEY (first 10 chars):", apiKey?.substring(0, 10) + "...");
  if (!apiKey) return NextResponse.json({ error: "Paddle not configured" }, { status: 500 });

  // Use correct environment
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";
  const baseUrl = environment === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        custom_data: {
          user_id: user.id,
        },
        customer_email: customerEmail || user.email,
        return_url: `${siteUrl}/billing?success=true`,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Paddle API error:", errorText);
      return NextResponse.json({ error: "Failed to start subscription" }, { status: 500 });
    }

    const data = await res.json();
    const checkoutUrl = data.data?.checkout?.url;

    if (!checkoutUrl) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("Paddle subscription error:", err);
    return NextResponse.json({ error: "Failed to start subscription" }, { status: 500 });
  }
}
