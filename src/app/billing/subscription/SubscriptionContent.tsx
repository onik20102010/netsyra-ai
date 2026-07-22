"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight, Sparkles, Zap, Shield, Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { initializePaddle } from "@paddle/paddle-js";

const STATIC_PRICE = { amount: 18, currency: "USD" };

export default function SubscriptionContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [annual, setAnnual] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [price, setPrice] = useState(STATIC_PRICE);
  const [priceLoading, setPriceLoading] = useState(true);

  const priceIds = {
    monthly: "pri_01ky298kved9c1cpydj09qpr1k",
    yearly: "pri_01ky298kved9c1cpydj09qpr1k", // TODO: replace with actual yearly ID
  };

  const currentPriceId = annual ? priceIds.yearly : priceIds.monthly;

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "sandbox" | "production") || "sandbox";

    if (!token) {
      console.warn("Paddle token not set – using static price.");
      setPriceLoading(false);
      return;
    }

    initializePaddle({ token, environment })
      .then((paddle) => {
        if (!paddle) throw new Error("Paddle instance is null");

        // Fetch live price
        return paddle.PricePreview({
          items: [{ priceId: currentPriceId, quantity: 1 }],
        });
      })
      .then((data: any) => {
        if (data?.data?.details?.lineItems?.length) {
          const formattedTotal = data.data.details.lineItems[0].formattedTotals?.total;
          // Paddle already returns a formatted string – use it directly
          setPrice({ amount: 0, currency: "USD", formatted: formattedTotal } as any);
        } else {
          throw new Error("No line items");
        }
      })
      .catch((err) => {
        console.warn("Price preview failed, using static price:", err);
        setPrice(STATIC_PRICE);
      })
      .finally(() => setPriceLoading(false));
  }, [currentPriceId, annual]);

  const handleSubscribe = async (priceId: string) => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/paddle/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, customerEmail: user?.email }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Something went wrong");
        return;
      }
      const data = await res.json();
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error(err);
      alert("Failed to start subscription.");
    } finally {
      setSubscribing(false);
    }
  };

  const displayPrice = (price as any).formatted || `$${price.amount}/mo`;

  return (
    <div className="min-h-screen bg-[#080809] text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/[0.05] border border-white/[0.1] px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white/80">Netsyra Premium</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold mb-4">
            Unlock the full potential
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Get unlimited access to all model tiers, priority routing, and advanced features
          </p>
          {isSuccess && (
            <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              ✅ Subscription successful! You now have access to all Pro features.
            </div>
          )}
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm ${!annual ? 'text-white' : 'text-white/50'}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-white/20'}`}
        >
          <div
            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`}
          />
        </button>
        <span className={`text-sm ${annual ? 'text-white' : 'text-white/50'}`}>
          Annual <span className="text-blue-400">-20%</span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-white/50 text-sm">Perfect for getting started</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-white/50">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                50 messages per day
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Basic model tiers
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Standard routing
              </li>
            </ul>
            <Link href="/chat">
              <button className="w-full py-3 rounded-lg bg-white/10 text-white/50 font-medium hover:bg-white/15 transition">
                Get Started
              </button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-blue-600/20 to-transparent border border-blue-500/30 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-xs font-medium px-3 py-1 rounded-full">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-white/50 text-sm">For power users</p>
            </div>
            <div className="mb-6">
              {priceLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-6 h-6 text-blue-400" />
                  <span className="text-white/50">Loading price...</span>
                </div>
              ) : (
                <>
                  <span className="text-4xl font-bold">{displayPrice}</span>
                  <span className="text-white/50">/month</span>
                </>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Unlimited messages
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                All model tiers
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Priority routing
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Advanced analytics
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe(currentPriceId)}
              disabled={subscribing}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {subscribing ? <Loader2 className="animate-spin" size={18} /> : <>Get Started <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-semibold">Enterprise</h3>
              </div>
              <p className="text-white/50 text-sm">For teams and organizations</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">{annual ? '$49' : '$59'}</span>
              <span className="text-white/50">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Everything in Pro
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Team collaboration
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                API access
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400" />
                Dedicated support
              </li>
            </ul>
            <button 
              onClick={() => alert("Contact sales at sales@netsyraai.com")}
              className="w-full py-3 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 border-t border-white/[0.08]">
        <h2 className="text-3xl font-semibold text-center mb-12">Why upgrade?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Faster Response</h3>
            <p className="text-white/50 text-sm">Priority routing ensures your messages get processed first</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">Advanced Models</h3>
            <p className="text-white/50 text-sm">Access to the most powerful AI models for complex tasks</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold mb-2">Enhanced Security</h3>
            <p className="text-white/50 text-sm">Additional security features for your data and conversations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
