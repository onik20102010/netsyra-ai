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

  // Only create the client on the client side
  useEffect(() => {
    try {
      const supabase = createClient();
      supabaseRef.current = supabase;

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (err: any) {
      console.error("Failed to initialize Supabase client:", err);
      setAuthError(err.message || "Authentication unavailable");
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    if (!supabaseRef.current) {
      router.push("/login");
      return;
    }
    await supabaseRef.current.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, authError }}>
      {children}
    </AuthContext.Provider>
  );
}