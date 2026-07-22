import { Suspense } from "react";
import CheckoutContent from "./CheckoutContent";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white text-gray-500">Loading…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
