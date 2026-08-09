"use client";

import AuthProvider from "@/context/AuthProvider";
import { StylePrefsProvider } from "@/hooks/useStylePrefs";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StylePrefsProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#0d0d0d",
              border: "1px solid #e5e7eb",
            },
          }}
        />
      </StylePrefsProvider>
    </AuthProvider>
  );
}