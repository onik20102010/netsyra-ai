import { Suspense } from "react";
import SubscriptionContent from "./SubscriptionContent";

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#080809] text-white">Loading…</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
