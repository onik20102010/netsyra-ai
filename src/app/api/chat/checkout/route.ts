import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Netsyra AI Pro" },
          unit_amount: 900, // $9.00
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `https://netsyra-ai.vercel.app/api/upgrade?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}`,
    cancel_url: "https://netsyra-ai.vercel.app/subscription",
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}