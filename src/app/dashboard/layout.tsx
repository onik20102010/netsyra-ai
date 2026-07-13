// src/app/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";

const ThreeBackground = dynamic(() => import("./ThreeBackground"), {
  ssr: false,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-black text-gray-300 relative overflow-hidden">
      <ThreeBackground />

      <aside className="fixed top-0 left-0 h-full w-[260px] z-10 bg-black/80 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col">
        <div className="mb-8 pb-6 border-b border-white/5">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
            Netsyra AI
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 px-3 pb-2">Dashboards</div>

          <Link
            href="https://netsyraai.com/chat"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Netsyra Chat
          </Link>
          <Link
            href="https://netsyraai.com/cv-builder/index.html"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            CV Builder
          </Link>
          <Link
            href="/goal"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              pathname === "/goal" ? "bg-white/5 text-white border border-white/10 shadow-sm" : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pathname === "/goal" ? "bg-white shadow-lg" : "bg-gray-500"}`} />
            Goal
          </Link>

          {/* Legal / policy links – using your live URLs */}
          <Link
            href="https://netsyraai.com/terms"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Terms of Service
          </Link>
          <Link
            href="https://netsyraai.com/legal"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Legal Notice
          </Link>
          <Link
            href="https://netsyraai.com/privacy"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Privacy Policy
          </Link>

          {/* Local Legal page – your original terms content */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              pathname === "/dashboard" ? "bg-white/5 text-white border border-white/10 shadow-sm" : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pathname === "/dashboard" ? "bg-white shadow-lg" : "bg-gray-500"}`} />
            Legal
          </Link>
        </nav>
      </aside>

      <div className="ml-[260px] relative z-10 min-h-screen">
        <header className="sticky top-0 z-20 flex items-center justify-end px-8 py-4 border-b border-white/5 backdrop-blur-sm bg-black/40">
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/40">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="relative z-10 px-8 py-12 max-w-4xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}