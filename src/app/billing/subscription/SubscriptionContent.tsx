"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight, Sparkles, Zap, Shield, Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { initializePaddle } from "@paddle/paddle-js";
import { createClient } from "@/lib/supabase/client";

const STATIC_PRICE = { amount: 18, currency: "USD" };

export interface Tier {
  name: 'Free' | 'Plus' | 'Pro';
  description: string;
  features: string[];
  priceId: { month: string; year: string };
  isFree?: boolean;
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    features: ['Basic AI models', '50 messages/day', 'Limited access', 'High limits on models', 'Normal context window'],
    priceId: { month: '', year: '' },
    isFree: true,
  },
  {
    name: 'Plus',
    description: 'Enhanced AI capabilities',
    features: ['Gemini models access', 'Image generations', 'Image analyzing', 'Strong reasoning'],
    priceId: { month: 'pri_01ky298kved9c1cpydj09qpr1k', year: 'pri_01ky298kved9c1cpydj09qpr1k' }, // TODO: replace with actual IDs
  },
  {
    name: 'Pro',
    description: 'For professionals and teams',
    features: ['Advanced AI models', 'Advanced analytics', 'High context window and memory', 'Models like Anthropic, GPT 5, Gemini, Deepseek', 'Best choice for coding, researching, designing', 'No image generation'],
    priceId: { month: 'pri_01ky298kved9c1cpydj09qpr1k', year: 'pri_01ky298kved9c1cpydj09qpr1k' }, // TODO: replace with actual IDs
  },
];

interface SubscriptionContentProps {
  country?: string;
}

export default function SubscriptionContent({ country }: SubscriptionContentProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [annual, setAnnual] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [priceLoading, setPriceLoading] = useState(true);
  const [paddle, setPaddle] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => setIsPro(!!data));
  }, [user]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "sandbox" | "production");

    if (!token) {
      console.error("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set");
      return;
    }

    if (!environment) {
      console.error("NEXT_PUBLIC_PADDLE_ENVIRONMENT is not set");
      return;
    }

    initializePaddle({ token, environment })
      .then((paddleInstance) => {
        if (!paddleInstance) {
          throw new Error("Failed to initialize Paddle");
        }
        setPaddle(paddleInstance);
      })
      .catch((err) => {
        console.error("Paddle initialization failed:", err);
      });
  }, []);

  useEffect(() => {
    if (!paddle) return;

    const fetchPrices = async () => {
      setPriceLoading(true);
      const priceIds = TIERS.flatMap(tier => [
        tier.priceId.month,
        tier.priceId.year,
      ]);

      try {
        const previewOptions: any = {
          items: priceIds.map((id: string) => ({ priceId: id, quantity: 1 })),
        };

        if (country) {
          previewOptions.customer = { countryCode: country };
        }

        const data = await paddle.PricePreview(previewOptions);

        if (data?.data?.details?.lineItems) {
          const newPrices: Record<string, string> = {};
          data.data.details.lineItems.forEach((item: any) => {
            newPrices[item.price.id] = item.formattedTotals.total;
          });
          setPrices(newPrices);
        }
      } catch (err) {
        console.warn("Price preview failed:", err);
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrices();
  }, [paddle, annual, country]);

  const handleSubscribe = async (priceId: string) => {
    if (!paddle) {
      console.error("Paddle not initialized");
      return;
    }

    setSubscribing(true);

    try {
      const checkoutOptions: any = {
        settings: {
          displayMode: 'overlay',
          variant: 'one-page',
          successUrl: `${window.location.origin}/welcome`,
        },
        items: [{ priceId, quantity: 1 }],
        customData: {
          user_id: user?.id,
        },
      };

      if (user?.email) {
        checkoutOptions.customer = { email: user.email };
      }

      await paddle.Checkout.open(checkoutOptions);
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to open checkout. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const getPrice = (priceId: string) => prices[priceId] || 'Loading...';

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
          {TIERS.map((tier) => {
            const priceId = annual ? tier.priceId.year : tier.priceId.month;
            const currentPrice = getPrice(priceId);
            const isPro = tier.name === 'Pro';
            const isFree = tier.isFree;

            return (
              <div
                key={tier.name}
                className={`${
                  isPro
                    ? 'bg-gradient-to-b from-blue-600/20 to-transparent border border-blue-500/30'
                    : isFree
                    ? 'bg-white/[0.03] border border-white/[0.08]'
                    : 'bg-white/[0.03] border border-white/[0.08]'
                } rounded-2xl p-8 relative`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                  <p className="text-white/50 text-sm">{tier.description}</p>
                </div>
                <div className="mb-6">
                  {isFree ? (
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-white/50">/month</span>
                    </div>
                  ) : priceLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-6 h-6 text-blue-400" />
                      <span className="text-white/50">Loading price...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">{currentPrice}</span>
                      <span className="text-white/50">/month</span>
                    </>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                      <Check className="w-4 h-4 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !isFree && !isPro && handleSubscribe(priceId)}
                  disabled={subscribing || isPro || isFree}
                  className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isFree
                      ? 'bg-white/10 border border-white/20 text-white/50 cursor-not-allowed'
                      : isPro
                      ? 'bg-green-600/20 border border-green-500/30 text-green-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {isFree ? 'Current Plan' : isPro ? 'Current Plan' : subscribing ? <Loader2 className="animate-spin" size={18} /> : <>Get Started <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            );
          })}
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
