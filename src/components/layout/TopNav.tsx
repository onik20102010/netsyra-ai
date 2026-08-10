"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Sparkles, Code, Menu, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLAN_DISPLAY_NAMES } from "@/lib/plan-access";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "onik20102010@gmail.com";

export default function TopNav() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isPro, setIsPro] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'Free' | 'Go Plus' | 'Pro' | '+ Pro'>('Free');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-3 mt-2 sm:mx-6 sm:mt-4">
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Left – Logo + Name */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
                <defs>
                  <radialGradient id="bgGradient" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#1a1c23" />
                    <stop offset="60%" stopColor="#0a0b0e" />
                    <stop offset="100%" stopColor="#020203" />
                  </radialGradient>
                  <linearGradient id="silverBase" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e6e8fa" />
                    <stop offset="25%" stopColor="#9ea4b4" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="75%" stopColor="#6b7280" />
                    <stop offset="100%" stopColor="#374151" />
                  </linearGradient>
                  <linearGradient id="whiteHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#f3f4f6" />
                    <stop offset="100%" stopColor="#d1d5db" />
                  </linearGradient>
                  <linearGradient id="bevelShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#111827" />
                    <stop offset="50%" stopColor="#4b5563" />
                    <stop offset="100%" stopColor="#1f2937" />
                  </linearGradient>
                  <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="12" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="reflectionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect width="800" height="800" fill="url(#bgGradient)" />
                <ellipse cx="400" cy="680" rx="220" ry="25" fill="url(#reflectionGrad)" />
                <g transform="translate(0, -10)">
                  <path d="M 230 180 L 250 180 L 250 620 L 230 620 Z" fill="url(#bevelShadow)" />
                  <path d="M 550 180 L 570 180 L 570 620 L 550 620 Z" fill="url(#bevelShadow)" />
                  <path d="M 220 160 H 350 L 470 460 V 160 H 580 V 640 H 450 L 330 340 V 640 H 220 Z" fill="url(#silverBase)" stroke="#94a3b8" strokeWidth="2" filter="url(#subtleGlow)" />
                  <path d="M 245 185 H 325 V 525 L 245 320 Z" fill="url(#whiteHighlight)" />
                  <path d="M 355 200 L 555 615 H 475 L 275 200 Z" fill="url(#whiteHighlight)" />
                  <path d="M 495 275 L 555 425 V 615 H 495 Z" fill="url(#whiteHighlight)" />
                  <path d="M 220 160 H 350" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 470 160 H 580" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 220 640 H 330" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 450 640 H 580" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                  <line x1="280" y1="210" x2="470" y2="600" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
                </g>
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold text-white">
              Netsyra
            </span>
          </Link>

          {/* Desktop Right – Nav Links + User */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/chat">
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-3 sm:px-4 text-sm transition-all"
              >
                <svg className="w-5 h-5 mr-1 sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
                  <defs>
                    <radialGradient id="bgGradientChat" cx="50%" cy="50%" r="70%">
                      <stop offset="0%" stopColor="#1a1c23" />
                      <stop offset="60%" stopColor="#0a0b0e" />
                      <stop offset="100%" stopColor="#020203" />
                    </radialGradient>
                    <linearGradient id="silverBaseChat" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e6e8fa" />
                      <stop offset="25%" stopColor="#9ea4b4" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="75%" stopColor="#6b7280" />
                      <stop offset="100%" stopColor="#374151" />
                    </linearGradient>
                    <linearGradient id="whiteHighlightChat" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#f3f4f6" />
                      <stop offset="100%" stopColor="#d1d5db" />
                    </linearGradient>
                    <linearGradient id="bevelShadowChat" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#111827" />
                      <stop offset="50%" stopColor="#4b5563" />
                      <stop offset="100%" stopColor="#1f2937" />
                    </linearGradient>
                    <filter id="subtleGlowChat" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="12" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="reflectionGradChat" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <rect width="800" height="800" fill="url(#bgGradientChat)" />
                  <ellipse cx="400" cy="680" rx="220" ry="25" fill="url(#reflectionGradChat)" />
                  <g transform="translate(0, -10)">
                    <path d="M 230 180 L 250 180 L 250 620 L 230 620 Z" fill="url(#bevelShadowChat)" />
                    <path d="M 550 180 L 570 180 L 570 620 L 550 620 Z" fill="url(#bevelShadowChat)" />
                    <path d="M 220 160 H 350 L 470 460 V 160 H 580 V 640 H 450 L 330 340 V 640 H 220 Z" fill="url(#silverBaseChat)" stroke="#94a3b8" strokeWidth="2" filter="url(#subtleGlowChat)" />
                    <path d="M 245 185 H 325 V 525 L 245 320 Z" fill="url(#whiteHighlightChat)" />
                    <path d="M 355 200 L 555 615 H 475 L 275 200 Z" fill="url(#whiteHighlightChat)" />
                    <path d="M 495 275 L 555 425 V 615 H 495 Z" fill="url(#whiteHighlightChat)" />
                    <path d="M 220 160 H 350" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 470 160 H 580" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 220 640 H 330" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 450 640 H 580" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                    <line x1="280" y1="210" x2="470" y2="600" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
                  </g>
                </svg>
                <span>Netsyra Chat</span>
              </Button>
            </Link>

            <a
              href="/cv-builder/index.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-3 sm:px-4 text-sm transition-all"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <span>CV-Builder Pro</span>
              </Button>
            </a>

            <Link href="/ide">
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-3 sm:px-4 text-sm transition-all"
              >
                <Code className="w-4 h-4 mr-1 sm:mr-2" />
                <span>Code IDE</span>
              </Button>
            </Link>

            {/* Admin link — only visible to admin email */}
            {user?.email === ADMIN_EMAIL && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-3 sm:px-4 text-sm transition-all"
                >
                  <Lock className="w-4 h-4 mr-1 sm:mr-2" />
                  <span>Admin</span>
                </Button>
              </Link>
            )}

            {/* Current plan badge */}
            {isPro ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                currentPlan === '+ Pro'
                  ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400'
                  : currentPlan === 'Pro'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                  : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  currentPlan === '+ Pro'
                    ? 'bg-purple-400'
                    : currentPlan === 'Pro'
                    ? 'bg-blue-400'
                    : 'bg-indigo-400'
                }`} />
                {PLAN_DISPLAY_NAMES[currentPlan] || currentPlan}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/60 text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                {PLAN_DISPLAY_NAMES[currentPlan] || 'Free'}
              </div>
            )}

            {/* Separator */}
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* User Section */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 group" title={user.email ?? undefined}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm text-white/70 max-w-[100px] truncate group-hover:text-white transition-colors">
                    {user.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="bg-white text-black hover:bg-gray-200 rounded-full px-4 sm:px-5 text-sm font-medium transition-all shadow-lg shadow-white/10"
              >
                <User className="w-4 h-4 mr-1 sm:mr-2" />
                <span>Login Now</span>
              </Button>
            )}
          </div>

          {/* Mobile – Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {/* Plan badge (compact) */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              isPro
                ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
                : 'bg-white/10 border border-white/20 text-white/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-indigo-400' : 'bg-white/40'}`} />
              {PLAN_DISPLAY_NAMES[currentPlan] || 'Free'}
            </div>

            {/* User avatar or login icon */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0"
                aria-label="Login"
              >
                <User className="w-4 h-4" />
              </button>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden mt-2 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="flex flex-col p-3 gap-1">
                <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
                      <defs>
                        <radialGradient id="bgGradientChatM" cx="50%" cy="50%" r="70%">
                          <stop offset="0%" stopColor="#1a1c23" />
                          <stop offset="60%" stopColor="#0a0b0e" />
                          <stop offset="100%" stopColor="#020203" />
                        </radialGradient>
                        <linearGradient id="silverBaseChatM" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#e6e8fa" />
                          <stop offset="25%" stopColor="#9ea4b4" />
                          <stop offset="50%" stopColor="#ffffff" />
                          <stop offset="75%" stopColor="#6b7280" />
                          <stop offset="100%" stopColor="#374151" />
                        </linearGradient>
                        <linearGradient id="whiteHighlightChatM" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#f3f4f6" />
                          <stop offset="100%" stopColor="#d1d5db" />
                        </linearGradient>
                        <linearGradient id="bevelShadowChatM" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#111827" />
                          <stop offset="50%" stopColor="#4b5563" />
                          <stop offset="100%" stopColor="#1f2937" />
                        </linearGradient>
                        <filter id="subtleGlowChatM" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="12" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="reflectionGradChatM" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <rect width="800" height="800" fill="url(#bgGradientChatM)" />
                      <ellipse cx="400" cy="680" rx="220" ry="25" fill="url(#reflectionGradChatM)" />
                      <g transform="translate(0, -10)">
                        <path d="M 230 180 L 250 180 L 250 620 L 230 620 Z" fill="url(#bevelShadowChatM)" />
                        <path d="M 550 180 L 570 180 L 570 620 L 550 620 Z" fill="url(#bevelShadowChatM)" />
                        <path d="M 220 160 H 350 L 470 460 V 160 H 580 V 640 H 450 L 330 340 V 640 H 220 Z" fill="url(#silverBaseChatM)" stroke="#94a3b8" strokeWidth="2" filter="url(#subtleGlowChatM)" />
                        <path d="M 245 185 H 325 V 525 L 245 320 Z" fill="url(#whiteHighlightChatM)" />
                        <path d="M 355 200 L 555 615 H 475 L 275 200 Z" fill="url(#whiteHighlightChatM)" />
                        <path d="M 495 275 L 555 425 V 615 H 495 Z" fill="url(#whiteHighlightChatM)" />
                        <path d="M 220 160 H 350" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 470 160 H 580" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 220 640 H 330" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 450 640 H 580" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                        <line x1="280" y1="210" x2="470" y2="600" stroke="#ffffff" strokeWidth="3" opacity="0.8" />
                      </g>
                    </svg>
                    <span className="text-sm">Netsyra Chat</span>
                  </div>
                </Link>
                <a
                  href="/cv-builder/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span className="text-sm">CV-Builder Pro</span>
                  </div>
                </a>
                <Link href="/ide" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition">
                    <Code className="w-4 h-4" />
                    <span className="text-sm">Code IDE</span>
                  </div>
                </Link>
                {user?.email === ADMIN_EMAIL && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">Admin</span>
                    </div>
                  </Link>
                )}
                {user && (
                  <button
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}