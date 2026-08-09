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
    description: 'Limited access on models',
    features: ['Small and cheap models', 'Low reasoning', 'Few coding access', 'Low context window', 'Minimal web searching access', 'High limits'],
    priceId: { month: '', year: '' },
    isFree: true,
  },
  {
    name: 'Go Plus',
    description: 'High quality with low limits',
    features: ['Low limits', 'High quality', 'Image analyzing', 'Good web search and researching', 'Best in content writing', 'Good coding', 'High context window'],
    priceId: { month: 'pri_01kzk7f0he4j0sjxtg0zf1k6qp', year: 'pri_01kzk7f0he4j0sjxtg0zf1k6qp' },
  },
  {
    name: 'Pro',
    description: 'Excellent coding and agentic',
    features: ['All features in Go Plus', 'Very low limits', 'Few limits on Anthropic', 'Excellent coding and agentic', 'Master planner', 'Very large models', 'Excellent web searching', 'Good for heavy tasks'],
    priceId: { month: 'pri_01kzk7hac9j383j19ffs0k2jwm', year: 'pri_01kzk7hac9j383j19ffs0k2jwm' },
  },
  {
    name: '+ Pro',
    description: 'Excellent in all tasks',
    features: ['All features in Go Plus, Pro', 'Negligible limits', 'Excellent in all tasks', 'Very heavy models', 'Advanced AI features'],
    priceId: { month: 'pri_01kzk7k5hr9wnfs70zd4a5zde9', year: 'pri_01kzk7k5hr9wnfs70zd4a5zde9' },
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

  const [annual] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [paddle, setPaddle] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [serverPrices, setServerPrices] = useState<Record<string, { amount: string; currency: string; formatted: string; interval: string }>>({});
  const [currentPlan, setCurrentPlan] = useState<'Free' | 'Go Plus' | 'Pro' | '+ Pro'>('Free');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Fetch the user's most recent subscription (active OR cancelled).
  // Plans are 1-month non-renewing: after the period ends, Paddle fires
  // subscription.canceled, the webhook sets status to "cancelled", and the
  // user reverts to Free. We show an "expired" banner with a repurchase CTA.
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("subscriptions")
      .select("status, plan, current_period_end")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setIsPro(false);
          setCurrentPlan('Free');
          setSubscriptionEndDate(null);
          setIsExpired(false);
          return;
        }
        const isActive = data.status === "active";
        const isCancelled = data.status === "cancelled" || data.status === "canceled";
        setIsPro(isActive);
        setIsExpired(isCancelled);
        if (data.plan) {
          const planMap: Record<string, 'Free' | 'Go Plus' | 'Pro' | '+ Pro'> = {
            'free': 'Free',
            'go_plus': 'Go Plus',
            'pro': 'Pro',
            'plus_pro': '+ Pro',
          };
          // If cancelled, the user is effectively back on Free for access purposes,
          // but we still show which plan they had so the expired banner is meaningful.
          setCurrentPlan(isActive ? (planMap[data.plan] || 'Free') : 'Free');
          if ((data as any).current_period_end) {
            setSubscriptionEndDate((data as any).current_period_end);
          }
        } else {
          setCurrentPlan('Free');
          setSubscriptionEndDate(null);
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
            .select("status, plan, current_period_end")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data: subData }) => {
              if (subData?.plan) {
                const planMap: Record<string, 'Free' | 'Go Plus' | 'Pro' | '+ Pro'> = {
                  'free': 'Free',
                  'go_plus': 'Go Plus',
                  'pro': 'Pro',
                  'plus_pro': '+ Pro',
                };
                const active = subData.status === "active";
                setIsPro(active);
                setIsExpired(!active);
                setCurrentPlan(active ? (planMap[subData.plan] || 'Free') : 'Free');
                if ((subData as any).current_period_end) {
                  setSubscriptionEndDate((subData as any).current_period_end);
                }
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
      .select("status, plan, current_period_end")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.plan) {
      const planMap: Record<string, 'Free' | 'Go Plus' | 'Pro' | '+ Pro'> = {
        'free': 'Free',
        'go_plus': 'Go Plus',
        'pro': 'Pro',
        'plus_pro': '+ Pro',
      };
      const active = data.status === "active";
      setIsPro(active);
      setIsExpired(!active);
      setCurrentPlan(active ? (planMap[data.plan] || 'Free') : 'Free');
      if ((data as any).current_period_end) {
        setSubscriptionEndDate((data as any).current_period_end);
      }
    } else {
      setSubscriptionEndDate(null);
      setIsExpired(false);
      setIsPro(false);
      setCurrentPlan('Free');
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
        <div className="relative max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 py-10 xs:py-12 sm:py-16 lg:py-20 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/[0.05] border border-white/[0.1] px-3 xs:px-4 py-1.5 xs:py-2 rounded-full mb-4 xs:mb-6">
            <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-blue-400" />
            <span className="text-xs xs:text-sm font-medium text-white/80">Netsyra Premium</span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold mb-3 xs:mb-4 leading-tight">
            Unlock the full potential
          </h1>
          <p className="text-sm xs:text-base sm:text-lg text-white/50 max-w-xl xs:max-w-2xl mx-auto px-2">
            Get unlimited access to all model tiers, priority routing, and advanced features
          </p>
          {isSuccess && (
            <div className="mt-4 xs:mt-6 mx-2 xs:mx-4 p-3 xs:p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs xs:text-sm">
              ✅ Subscription successful! You now have access to all Pro features.
            </div>
          )}
          {isExpired && subscriptionEndDate && (
            <div className="mt-4 xs:mt-6 mx-2 xs:mx-4 p-3 xs:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs xs:text-sm max-w-2xl mx-auto text-left">
              <p className="font-medium mb-1">Your subscription has ended</p>
              <p className="text-amber-400/80 leading-relaxed">
                Your plan expired on {new Date(subscriptionEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.
                You&apos;re now on the Free plan. Your chat history is preserved — you can repurchase any plan below to restore access.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 pb-12 xs:pb-16 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {TIERS.map((tier) => {
            const priceId = (annual && tier.priceId.year && tier.priceId.year !== tier.priceId.month)
              ? tier.priceId.year
              : tier.priceId.month;
            const currentPrice = getPrice(priceId);
            const isProTier = tier.name === 'Pro';
            const isPlusProTier = tier.name === '+ Pro';
            const isFree = tier.isFree;
            const isCurrentPlan = tier.name === currentPlan;
            const hasActiveSubscription = isPro && currentPlan !== 'Free';
            const isLocked = hasActiveSubscription && !isCurrentPlan && !isFree;

            const formatDate = (dateStr: string) => {
              const date = new Date(dateStr);
              return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            };

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
                } rounded-2xl p-4 xs:p-5 sm:p-6 lg:p-8 relative flex flex-col`}
              >
                {isPlusProTier && (
                  <div className="absolute -top-2.5 xs:-top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-[10px] xs:text-xs font-medium px-2.5 xs:px-3 py-0.5 xs:py-1 rounded-full whitespace-nowrap">
                    Best Value
                  </div>
                )}
                {isProTier && (
                  <div className="absolute -top-2.5 xs:-top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] xs:text-xs font-medium px-2.5 xs:px-3 py-0.5 xs:py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="mb-4 xs:mb-5 sm:mb-6">
                  <h3 className="text-lg xs:text-xl font-semibold mb-1 xs:mb-2">{tier.name}</h3>
                  <p className="text-white/50 text-xs xs:text-sm leading-snug">{tier.description}</p>
                </div>
                <div className="mb-4 xs:mb-5 sm:mb-6">
                  {isFree ? (
                    <div className="flex items-baseline gap-1.5 xs:gap-2">
                      <span className="text-3xl xs:text-4xl font-bold">$0</span>
                      <span className="text-white/50 text-xs xs:text-sm">/month</span>
                    </div>
                  ) : priceLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-5 h-5 xs:w-6 xs:h-6 text-blue-400" />
                      <span className="text-white/50 text-xs xs:text-sm">Loading price...</span>
                    </div>
                  ) : currentPrice ? (
                    <div className="flex items-baseline gap-1.5 xs:gap-2 flex-wrap">
                      <span className="text-3xl xs:text-4xl font-bold">{currentPrice}</span>
                      <span className="text-white/50 text-xs xs:text-sm">/{annual ? 'year' : 'month'}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5 xs:gap-2">
                      <span className="text-3xl xs:text-4xl font-bold">—</span>
                      <span className="text-white/50 text-xs xs:text-sm">/{annual ? 'year' : 'month'}</span>
                    </div>
                  )}
                </div>
                <ul className="space-y-2 xs:space-y-2.5 sm:space-y-3 mb-6 xs:mb-7 sm:mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 xs:gap-3 text-xs xs:text-sm text-white/70 leading-snug">
                      <Check className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !isFree && !isCurrentPlan && !isLocked && handleSubscribe(priceId)}
                  disabled={subscribing || isCurrentPlan || isFree || isLocked}
                  className={`w-full py-2.5 xs:py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm xs:text-base disabled:opacity-50 ${
                    isFree
                      ? 'bg-white/10 border border-white/20 text-white/50 cursor-not-allowed'
                      : isCurrentPlan
                      ? 'bg-green-600/20 border border-green-500/30 text-green-400 cursor-not-allowed'
                      : isLocked
                      ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                      : isPlusProTier
                      ? 'bg-purple-600 text-white hover:bg-purple-500'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {isFree
                    ? 'Current Plan'
                    : isCurrentPlan
                    ? 'Current Plan'
                    : isLocked
                    ? 'Locked'
                    : subscribing
                    ? <Loader2 className="animate-spin" size={16} />
                    : <>Get Started <ArrowRight className="w-3.5 h-3.5 xs:w-4 xs:h-4" /></>}
                </button>
                {isLocked && subscriptionEndDate && (
                  <p className="text-[10px] xs:text-[11px] text-white/30 text-center mt-2 leading-tight">
                    Available after {formatDate(subscriptionEndDate)}
                  </p>
                )}
                {isCurrentPlan && subscriptionEndDate && (
                  <p className="text-[10px] xs:text-[11px] text-green-400/60 text-center mt-2 leading-tight">
                    {isExpired ? 'Expired on' : 'Expires on'} {formatDate(subscriptionEndDate)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 py-10 xs:py-12 sm:py-16 lg:py-20 border-t border-white/[0.08]">
        <h2 className="text-xl xs:text-2xl sm:text-3xl font-semibold text-center mb-8 xs:mb-10 sm:mb-12">Why upgrade?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          <div className="text-center">
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 xs:mb-4">
              <Zap className="w-5 h-5 xs:w-6 xs:h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1.5 xs:mb-2 text-sm xs:text-base">Faster Response</h3>
            <p className="text-white/50 text-xs xs:text-sm leading-relaxed">Priority routing ensures your messages get processed first</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 xs:mb-4">
              <Sparkles className="w-5 h-5 xs:w-6 xs:h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-1.5 xs:mb-2 text-sm xs:text-base">Advanced Models</h3>
            <p className="text-white/50 text-xs xs:text-sm leading-relaxed">Access to the most powerful AI models for complex tasks</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 xs:mb-4">
              <Shield className="w-5 h-5 xs:w-6 xs:h-6 text-green-400" />
            </div>
            <h3 className="font-semibold mb-1.5 xs:mb-2 text-sm xs:text-base">Enhanced Security</h3>
            <p className="text-white/50 text-xs xs:text-sm leading-relaxed">Additional security features for your data and conversations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
