"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-black text-gray-300 relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-900/20 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-900/20 blur-[120px]"
        />
      </div>

      <header className="relative z-10 flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 select-none">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center p-1 ring-1 ring-gray-500/30">
            <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
          </div>
<span className="text-lg font-bold text-[#4D6BFE] font-mono tracking-tight">
  Netsyra
</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/chat" className="text-sm text-white/60 hover:text-white transition flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            Chat
          </Link>
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

      <main className="relative z-10">{children}</main>
    </div>
  );
}