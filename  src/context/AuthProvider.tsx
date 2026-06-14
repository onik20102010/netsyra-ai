"use client";

import { createContext, useEffect, useState, useRef, type ReactNode } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  authError: string | null;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  authError: null,
});

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      try {
        const supabase = createClient();
        supabaseRef.current = supabase;

        // Try to get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn("Session error:", sessionError.message);
          // If the refresh token is invalid, sign out silently
          if (sessionError.message.includes("Invalid Refresh Token") || sessionError.message.includes("Already Used")) {
            await supabase.auth.signOut();
          }
          if (!cancelled) {
            setSession(null);
            setUser(null);
            setAuthError(sessionError.message);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (cancelled) return;

          if (event === "TOKEN_REFRESHED") {
            setSession(newSession);
            setUser(newSession?.user ?? null);
          } else if (event === "SIGNED_OUT") {
            setSession(null);
            setUser(null);
            router.push("/login");
          } else if (event === "USER_UPDATED") {
            setSession(newSession);
            setUser(newSession?.user ?? null);
          }
        });

        return () => {
          cancelled = true;
          subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error("Failed to initialize auth:", err.message);
        if (!cancelled) {
          setAuthError(err.message || "Authentication unavailable");
          setLoading(false);
        }
      }
    };

    initAuth();
  }, [router]);

  const signOut = async () => {
    if (!supabaseRef.current) {
      router.push("/login");
      return;
    }
    try {
      await supabaseRef.current.auth.signOut();
      setSession(null);
      setUser(null);
      router.refresh();
      router.push("/login");
    } catch (err: any) {
      console.error("Sign out error:", err.message);
      // Force redirect even if signOut fails
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, authError }}>
      {children}
    </AuthContext.Provider>
  );
}