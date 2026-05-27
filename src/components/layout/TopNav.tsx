"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Sparkles, Code } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TopNav() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 select-none"
    >
      <div className="mx-4 mt-3 sm:mx-6 sm:mt-4">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Left – Logo + Name */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-black flex items-center justify-center p-1">
              <img
                src="/logo.png"
                alt="Netsyra"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">
              Netsyra
            </span>
          </Link>

          {/* Right – Nav Links + User */}
          <div className="flex items-center gap-2">
            <Link href="/chat">
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-3 sm:px-4 text-sm transition-all"
              >
                <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Netsyra Chat</span>
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
                <span className="hidden sm:inline">CV-Builder Pro</span>
              </Button>
            </a>

            {/* Code IDE button – works on Vercel after IDE build is copied to public/ide */}
            <a
              href="/ide/index.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-3 sm:px-4 text-sm transition-all"
              >
                <Code className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Code IDE</span>
              </Button>
            </a>

            {/* Separator */}
            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

            {/* User Section */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm text-white/70 max-w-[100px] truncate">
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
                <span className="hidden sm:inline">Login Now</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}