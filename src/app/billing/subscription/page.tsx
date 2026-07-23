import { headers } from "next/headers";
import { Suspense } from "react";
import SubscriptionContent from "./SubscriptionContent";

export default async function SubscriptionPage() {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country") || undefined;

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#080809] text-white">Loading…</div>}>
      <SubscriptionContent country={country} />
    </Suspense>
  );
}
