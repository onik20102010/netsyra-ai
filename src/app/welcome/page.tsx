"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function WelcomeContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activationStatus, setActivationStatus] = useState<"idle" | "activating" | "active" | "error">("idle");

  useEffect(() => {
    const txnId = searchParams.get("_ptxn");
    if (!txnId || !user) return;

    setActivationStatus("activating");
    fetch("/api/paddle/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: txnId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setActivationStatus("active");
        else setActivationStatus("error");
      })
      .catch(() => setActivationStatus("error"));
  }, [searchParams, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080809] text-white">
      <div className="text-center max-w-md px-6">
        <h1 className="text-3xl font-bold mb-4">Welcome to Netsyra!</h1>
        {activationStatus === "idle" && (
          <>
            <p className="text-white/60 mb-8">
              Your payment was received. Your subscription is being activated.
            </p>
            <a href="/chat" className="text-indigo-400 hover:underline mt-4 inline-block">Go to Chat</a>
          </>
        )}
        {activationStatus === "activating" && (
          <>
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Activating your subscription…</p>
          </>
        )}
        {activationStatus === "active" && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white/80 mb-8">Your subscription is now active. You now have access to all the features included in your plan.</p>
            <a href="/billing/subscription" className="inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-500 transition-colors mr-3">
              View My Plan
            </a>
            <a href="/chat" className="text-indigo-400 hover:underline">Go to Chat</a>
          </>
        )}
        {activationStatus === "error" && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white/60 mb-8">
              There was an error activating your subscription. Please contact support or try again in a few minutes.
            </p>
            <a href="/billing/subscription" className="inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-500 transition-colors">
              Go to Billing
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#080809]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
}

