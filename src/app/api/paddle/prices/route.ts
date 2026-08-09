import { NextResponse } from "next/server";

const PRICE_IDS = [
  "pri_01kzk7f0he4j0sjxtg0zf1k6qp", // Go Plus monthly
  "pri_01kzk7hac9j383j19ffs0k2jwm", // Pro monthly
  "pri_01kzk7k5hr9wnfs70zd4a5zde9", // Plus Pro monthly
];

export async function GET() {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Paddle API key not configured" }, { status: 500 });
  }

  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";
  const baseUrl = environment === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

  try {
    const idParam = PRICE_IDS.join(",");
    const res = await fetch(`${baseUrl}/prices?id=${encodeURIComponent(idParam)}&per_page=200`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Paddle prices API error:", res.status, errorText);
      return NextResponse.json({ error: `Paddle API returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const priceList = data?.data || [];

    const results: Record<string, { amount: string; currency: string; formatted: string; interval: string }> = {};

    for (const price of priceList) {
      const unitPrice = price.unit_price;
      if (!unitPrice) continue;

      const amount = (unitPrice.amount / 100).toFixed(2);
      const currency = unitPrice.currency_code || "USD";
      const interval = price.billing_cycle?.interval || "month";
      const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
      const formatted = `${currencySymbol}${amount}${currencySymbol ? "" : " " + currency}`;

      results[price.id] = { amount, currency, formatted, interval };
    }

    return NextResponse.json({ prices: results });
  } catch (err: any) {
    console.error("Paddle prices fetch failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
