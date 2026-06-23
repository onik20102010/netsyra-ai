// src/app/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";

// Dynamically import the Three.js background – never on the server
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
      {/* Three.js background – loaded only in the browser */}
      <ThreeBackground />

      {/* Glass sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[260px] z-10 bg-black/80 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col">
        <div className="mb-8 pb-6 border-b border-white/5">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
            Netsyra AI
          </Link>
          <div className="text-xs text-gray-400 mt-1">Intelligence Without Limits</div>
        </div>
        <nav className="flex-1 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 px-3 pb-2">Dashboards</div>
          <Link
            href="https://www.netsyraai.com/chat"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Netsyra Chat
          </Link>
          <Link
            href="https://www.netsyraai.com/ide"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            IDE Netsyra
          </Link>
          <Link
            href="https://www.netsyraai.com/cv-builder/index.html"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            CV Builder
          </Link>
          {/* ── Goal link – now points to /goal ── */}
          <Link
            href="/goal"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              pathname === "/goal"
                ? "bg-white/5 text-white border border-white/10 shadow-sm"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pathname === "/goal" ? "bg-white shadow-lg" : "bg-gray-500"}`} />
            Goal
          </Link>
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              pathname === "/dashboard"
                ? "bg-white/5 text-white border border-white/10 shadow-sm"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pathname === "/dashboard" ? "bg-white shadow-lg" : "bg-gray-500"}`} />
            Legal
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="ml-[260px] relative z-10 min-h-screen">
        {/* Header – only email and logout now */}
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

        {/* Page content */}
        <main className="relative z-10 px-8 py-12 max-w-4xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}