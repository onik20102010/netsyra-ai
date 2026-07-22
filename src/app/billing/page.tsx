"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    features: ["N Fast, Plus models", "10 messages/day per tier", "Community support"],
    priceId: null,
  },
  {
    name: "Netsyra Pro",
    price: "$18/month",
    features: [
      "All models (Live, Code, AAI)",
      "Unlimited messages",
      "Priority web search",
      "Mesh API for faster responses",
    ],
    priceId: "pri_01ky298kved9c1cpydj09qpr1k",   // ← your actual Paddle price ID
    highlighted: true,
  },
];

export default function BillingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) {
      // Free plan – just redirect to chat
      router.push("/chat");
      return;
    }

    setSubscribing(true);
    try {
      const res = await fetch("/api/paddle/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Something went wrong");
        return;
      }

      const data = await res.json();
      // Redirect to Paddle's hosted checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error(err);
      alert("Failed to start subscription. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose your plan</h1>
      <p className="text-gray-500 mb-12">Upgrade to unlock all models and features.</p>

      {isSuccess && (
        <div className="mb-8 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          ✅ Subscription successful! You now have access to all Pro features.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 shadow-sm flex flex-col ${
              plan.highlighted ? "border-indigo-500 ring-2 ring-indigo-500" : "border-gray-200"
            } bg-white`}
          >
            <h2 className="text-2xl font-semibold text-gray-900">{plan.name}</h2>
            <p className="text-3xl font-bold text-gray-900 mt-4">{plan.price}</p>
            <ul className="mt-6 space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.priceId)}
              disabled={subscribing}
              className={`mt-6 w-full py-2.5 rounded-xl font-medium transition ${
                plan.highlighted
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {subscribing ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Get Started"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}