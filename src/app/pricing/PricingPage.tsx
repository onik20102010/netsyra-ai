'use client';

import { useState, useEffect } from 'react';
import { initializePaddle, Paddle, PricePreviewItem, PricePreviewResponse } from '@paddle/paddle-js';

export interface Tier {
  name: 'Starter' | 'Pro' | 'Advanced';
  description: string;
  features: string[];
  priceId: { month: string; year: string };
}

const TIERS: Tier[] = [
  {
    name: 'Starter',
    description: 'Perfect for individuals getting started',
    features: [
      '5 AI conversations per day',
      'Basic code generation',
      'Community support',
      '1 project workspace',
    ],
    priceId: {
      month: 'pri_01h8x...', // Replace with actual Paddle price ID
      year: 'pri_01h8x...', // Replace with actual Paddle price ID
    },
  },
  {
    name: 'Pro',
    description: 'Best for professionals and small teams',
    features: [
      'Unlimited AI conversations',
      'Advanced code generation',
      'Priority support',
      '5 project workspaces',
      'API access',
      'Custom integrations',
    ],
    priceId: {
      month: 'pri_01h8x...', // Replace with actual Paddle price ID
      year: 'pri_01h8x...', // Replace with actual Paddle price ID
    },
  },
  {
    name: 'Advanced',
    description: 'For enterprises and power users',
    features: [
      'Everything in Pro',
      'Unlimited project workspaces',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom AI model training',
      'White-label options',
      'Advanced analytics',
    ],
    priceId: {
      month: 'pri_01h8x...', // Replace with actual Paddle price ID
      year: 'pri_01h8x...', // Replace with actual Paddle price ID
    },
  },
];

type BillingPeriod = 'month' | 'year';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('month');
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Get user's country
        const countryRes = await fetch('/api/country');
        const countryData = await countryRes.json();
        setCountry(countryData.country);

        // Initialize Paddle
        const paddleInstance = await initializePaddle({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
          environment: (process.env.PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        });

        if (!paddleInstance) {
          throw new Error('Failed to initialize Paddle');
        }

        setPaddle(paddleInstance);

        // Fetch prices for all tiers
        const allPriceIds = TIERS.flatMap((tier) => [
          tier.priceId.month,
          tier.priceId.year,
        ]);

        const pricePreviewItems: PricePreviewItem[] = allPriceIds.map((priceId) => ({
          priceId,
          quantity: 1,
        }));

        const pricePreview: PricePreviewResponse = await paddleInstance.PricePreview({
          items: pricePreviewItems,
          ...(countryData.country ? { customer: { address: { country: countryData.country } } } : {}),
        });

        // Create a map of priceId to price data
        const priceMap: Record<string, any> = {};
        if (pricePreview && pricePreview.data && pricePreview.data.details) {
          pricePreview.data.details.lineItems.forEach((item: any) => {
            priceMap[item.priceId] = item;
          });
        }

        setPrices(priceMap);
      } catch (error) {
        console.error('Failed to initialize Paddle or fetch prices:', error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleSubscribe = async (tier: Tier) => {
    if (!paddle) return;

    const priceId = tier.priceId[billingPeriod];

    try {
      await paddle.Checkout.open({
        settings: {
          displayMode: 'overlay',
          variant: 'one-page',
          successUrl: `${window.location.origin}/welcome`,
        },
        items: [{ priceId, quantity: 1 }],
      });
    } catch (error) {
      console.error('Failed to open checkout:', error);
    }
  };

  const getPrice = (tier: Tier) => {
    const priceId = tier.priceId[billingPeriod];
    return prices[priceId];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-8">Start free, upgrade when you need more</p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-200 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('month')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'month'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('year')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'year'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {TIERS.map((tier) => {
            const price = getPrice(tier);
            return (
              <div
                key={tier.name}
                className="bg-white rounded-2xl shadow-lg p-8 flex flex-col hover:shadow-xl transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 mb-6">{tier.description}</p>
                  
                  {price ? (
                    <div className="mb-6">
                      <div className="text-4xl font-bold text-gray-900">
                        {price.formattedPrice || price.unitPrice?.formatted || '--'}
                      </div>
                      <div className="text-gray-500">
                        {billingPeriod === 'month' ? 'per month' : 'per year'}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="text-4xl font-bold text-gray-900">--</div>
                      <div className="text-gray-500">
                        {billingPeriod === 'month' ? 'per month' : 'per year'}
                      </div>
                    </div>
                  )}

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(tier)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
