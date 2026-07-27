"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight, Sparkles, Zap, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { initializePaddle } from "@paddle/paddle-js";
import { createClient } from "@/lib/supabase/client";

export interface Tier {
  name: 'Free' | 'Go Plus' | 'Pro' | '+ Pro';
  description: string;
  features: string[];
  priceId: { month: string; year: string };
  isFree?: boolean;
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    features: ['Everyday chat', 'Very cheapest', 'Document analysis', 'Brainstorming', 'Data formatting', 'Writing (emails, blogs, articles)', 'Homework help', 'Medium-length coding'],
    priceId: { month: '', year: '' },
    isFree: true,
  },
  {
    name: 'Go Plus',
    description: 'Enhanced AI capabilities',
    features: ['Gemini models access', 'Image generations', 'Image analyzing', 'Strong reasoning'],
    priceId: { month: 'pri_01kyf27thzh41n39q3cja2cphq', year: 'pri_01kyf2d4q3h41n39q3cja2cphq' },
  },
  {
    name: 'Pro',
    description: 'For professionals and developers',
    features: ['Advanced AI models', 'Advanced analytics', 'High context window and memory', 'Models like Anthropic, GPT 5, Gemini, Deepseek', 'Best for coding, researching, designing', 'No image generation'],
    priceId: { month: 'pri_01kyf2acjbxs0s8nytjae84ckm', year: 'pri_01kyf2d6c62mpde2s2rfmdjra4' },
  },
  {
    name: '+ Pro',
    description: 'All the features in Pro',
    features: ['All features in Pro', 'Image generation', 'All models in Pro', 'Best for everyday tasks and coding'],
    priceId: { month: 'pri_01kyf2ckc62mpde2s2rfmdjra4', year: 'pri_01kyf2d8q3h41n39q3cja2cphq' },
  },
];

interface SubscriptionContentProps {
  country?: string;
}

export default function SubscriptionContent({ country }: SubscriptionContentProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const ptxn = searchParams.get("_ptxn");

  const [annual, setAnnual] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [paddle, setPaddle] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [serverPrices, setServerPrices] = useState<Record<string, { amount: string; currency: string; formatted: string; interval: string }>>({});
  const [currentPlan, setCurrentPlan] = useState<'Free' | 'Go Plus' | 'Pro' | '+ Pro'>('Free');

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        setIsPro(!!data);
        if (data?.plan) {
          // Map plan names from database to display names
          const planMap: Record<string, 'Free' | 'Go Plus' | 'Pro' | '+ Pro'> = {
            'free': 'Free',
            'go_plus': 'Go Plus',
            'pro': 'Pro',
            'plus_pro': '+ Pro',
          };
          setCurrentPlan(planMap[data.plan] || 'Free');
        } else {
          setCurrentPlan('Free');
        }
      });
  }, [user]);

  // Activate subscription via secure endpoint when _ptxn is in URL
  useEffect(() => {
    if (!ptxn || !user) return;
    console.log('Subscription page: Activating with _ptxn:', ptxn);
    fetch("/api/paddle/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: ptxn }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Subscription page: Activation result:', data);
        if (data.success) {
          // Refresh subscription status
          const supabase = createClient();
          supabase
            .from("subscriptions")
            .select("status, plan")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle()
            .then(({ data: subData }) => {
              if (subData?.plan) {
                const planMap: Record<string, 'Free' | 'Go Plus' | 'Pro' | '+ Pro'> = {
                  'free': 'Free',
                  'go_plus': 'Go Plus',
                  'pro': 'Pro',
                  'plus_pro': '+ Pro',
                };
                setCurrentPlan(planMap[subData.plan] || 'Free');
                setIsPro(true);
              }
            });
        }
      })
      .catch(err => console.error('Activation failed:', err));
  }, [ptxn, user]);

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

  // Fetch prices from server-side API (more reliable than client-side PricePreview)
  useEffect(() => {
    const fetchServerPrices = async () => {
      setPriceLoading(true);
      try {
        const res = await fetch('/api/paddle/prices');
        if (res.ok) {
          const data = await res.json();
          if (data?.prices) {
            setServerPrices(data.prices);
          }
        }
      } catch (err) {
        console.warn('Server price fetch failed:', err);
      } finally {
        setPriceLoading(false);
      }
    };
    fetchServerPrices();
  }, []);

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

      // Listen for checkout completion
      paddle.Update({
        eventCallback: (event: any) => {
          console.log('Paddle event:', event);
          if (event.name === 'checkout.completed') {
            console.log('Checkout completed!', event.data);
            // Directly update subscription via API (fallback for webhook)
            updateSubscriptionDirectly(priceId);
          }
        },
      });
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to open checkout. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const updateSubscriptionDirectly = async (priceId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/paddle/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          priceId,
          status: 'active',
        }),
      });
      const data = await res.json();
      console.log('Direct subscription update result:', data);
      if (data.success) {
        // Refresh UI
        refreshSubscriptionStatus();
      }
    } catch (err) {
      console.error('Failed to update subscription directly:', err);
    }
  };

  const refreshSubscriptionStatus = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (data?.plan) {
      const planMap: Record<string, 'Free' | 'Go Plus' | 'Pro' | '+ Pro'> = {
        'free': 'Free',
        'go_plus': 'Go Plus',
        'pro': 'Pro',
        'plus_pro': '+ Pro',
      };
      setCurrentPlan(planMap[data.plan] || 'Free');
      setIsPro(true);
    }
  };

  const getPrice = (priceId: string) => {
    if (serverPrices[priceId]) {
      return serverPrices[priceId].formatted;
    }
    return '';
  };

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
        <div className="grid md:grid-cols-4 gap-8">
          {TIERS.map((tier) => {
            const priceId = (annual && tier.priceId.year && tier.priceId.year !== tier.priceId.month)
              ? tier.priceId.year
              : tier.priceId.month;
            const currentPrice = getPrice(priceId);
            const isProTier = tier.name === 'Pro';
            const isPlusProTier = tier.name === '+ Pro';
            const isFree = tier.isFree;
            const isCurrentPlan = tier.name === currentPlan;

            return (
              <div
                key={tier.name}
                className={`${
                  isPlusProTier
                    ? 'bg-gradient-to-b from-purple-600/20 to-transparent border border-purple-500/30'
                    : isProTier
                    ? 'bg-gradient-to-b from-blue-600/20 to-transparent border border-blue-500/30'
                    : isFree
                    ? 'bg-white/[0.03] border border-white/[0.08]'
                    : 'bg-white/[0.03] border border-white/[0.08]'
                } rounded-2xl p-8 relative`}
              >
                {isPlusProTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-xs font-medium px-3 py-1 rounded-full">
                    Best Value
                  </div>
                )}
                {isProTier && (
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
                  ) : currentPrice ? (
                    <>
                      <span className="text-4xl font-bold">{currentPrice}</span>
                      <span className="text-white/50">/{annual ? 'year' : 'month'}</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold">—</span>
                      <span className="text-white/50">/{annual ? 'year' : 'month'}</span>
                    </div>
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
                  onClick={() => !isFree && !isCurrentPlan && handleSubscribe(priceId)}
                  disabled={subscribing || isCurrentPlan || isFree}
                  className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isFree
                      ? 'bg-white/10 border border-white/20 text-white/50 cursor-not-allowed'
                      : isCurrentPlan
                      ? 'bg-green-600/20 border border-green-500/30 text-green-400 cursor-not-allowed'
                      : isPlusProTier
                      ? 'bg-purple-600 text-white hover:bg-purple-500'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {isFree ? 'Current Plan' : isCurrentPlan ? 'Current Plan' : subscribing ? <Loader2 className="animate-spin" size={18} /> : <>Get Started <ArrowRight className="w-4 h-4" /></>}
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
