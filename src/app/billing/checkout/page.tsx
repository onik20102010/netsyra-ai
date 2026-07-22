"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planDetails: Record<string, { name: string; priceId: string }> = {
    pro: { name: "Netsyra Pro", priceId: "pri_01ky298kved9c1cpydj09qpr1k" },
    enterprise: { name: "Netsyra Enterprise", priceId: "pri_01ky298kved9c1cpydj09qpr1k" },
  };

  const currentPlan = planDetails[plan] || planDetails.pro;

  useEffect(() => {
    const redirectToPaddle = async () => {
      try {
        const res = await fetch("/api/paddle/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            priceId: currentPlan.priceId,
          }),
        });
        
        if (!res.ok) throw new Error("Failed to initiate checkout");
        
        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setError("No checkout URL returned");
        }
      } catch (err) {
        setError("Failed to start checkout. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    redirectToPaddle();
  }, [currentPlan.priceId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Checkout Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/billing")}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Paddle...</h1>
        <p className="text-gray-600">You'll be redirected to complete your subscription.</p>
      </div>
    </div>
  );
}
