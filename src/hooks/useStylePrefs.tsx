"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FontSize = "small" | "medium" | "large";
export type TableEdges = "sharp" | "round";
export type ChatTheme = "default" | "dark";

export interface StylePrefs {
  sectionSpacing: number; // 0-100, default 50
  wordSpacing: number; // 0-100, default 50
  tableEdges: TableEdges;
  fontSize: FontSize;
  chatTheme: ChatTheme;
}

export const DEFAULT_STYLE_PREFS: StylePrefs = {
  sectionSpacing: 50,
  wordSpacing: 50,
  tableEdges: "sharp",
  fontSize: "medium",
  chatTheme: "default",
};

const STORAGE_KEY = "netsyra_style_prefs";
const STYLE_UPDATE_EVENT = "netsyra-style-update";

// ── Derived CSS values ──
export function getStyleValues(prefs: StylePrefs) {
  // Section spacing: 0-100 → margin values
  // 0 = compact (0.5rem), 50 = normal (1rem), 100 = spacious (2rem)
  const sectionMargin = `${0.5 + (prefs.sectionSpacing / 100) * 1.5}rem`;

  // Word spacing: 0-100 → letter-spacing + word-spacing
  // 0 = tight (-0.02em), 50 = normal (0em), 100 = wide (0.08em)
  const wordSpacingVal = `${-0.02 + (prefs.wordSpacing / 100) * 0.1}em`;
  const letterSpacingVal = `${-0.01 + (prefs.wordSpacing / 100) * 0.05}em`;

  // Font size
  const fontSizeMap = {
    small: "0.8125rem",   // 13px
    medium: "0.875rem",   // 14px (default)
    large: "1rem",        // 16px
  };
  const fontSize = fontSizeMap[prefs.fontSize];

  // Table edges
  const tableRadius = prefs.tableEdges === "round" ? "0.75rem" : "0";
  const cellRadius = prefs.tableEdges === "round" ? "0.375rem" : "0";

  return {
    sectionMargin,
    wordSpacing: wordSpacingVal,
    letterSpacing: letterSpacingVal,
    fontSize,
    tableRadius,
    cellRadius,
  };
}

// ── Local cache ──
// Supabase is the source of truth. localStorage is only a cache so preferences
// paint instantly on load (and still work while signed out).
function loadPrefs(): StylePrefs {
  if (typeof window === "undefined") return DEFAULT_STYLE_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STYLE_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STYLE_PREFS, ...parsed };
  } catch {
    return DEFAULT_STYLE_PREFS;
  }
}

function savePrefs(prefs: StylePrefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

// ── Supabase persistence ──
/** Reads a user's saved preferences. Returns null when none are stored yet. */
export async function fetchStylePrefs(userId: string): Promise<StylePrefs | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("style_prefs")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.style_prefs) return null;
  const stored = data.style_prefs as Partial<StylePrefs>;
  if (!stored || Object.keys(stored).length === 0) return null;
  return { ...DEFAULT_STYLE_PREFS, ...stored };
}

interface StyleContextValue {
  prefs: StylePrefs;
  loading: boolean;
}

const StyleContext = createContext<StyleContextValue>({
  prefs: DEFAULT_STYLE_PREFS,
  loading: true,
});

export function StylePrefsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [prefs, setPrefs] = useState<StylePrefs>(DEFAULT_STYLE_PREFS);
  const [loading, setLoading] = useState(true);

  // 1. Paint immediately from the cache, and keep tabs/components in sync.
  useEffect(() => {
    setPrefs(loadPrefs());

    // Sync across tabs / windows (native storage event)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setPrefs(loadPrefs());
      }
    };
    // Sync within same tab (custom event from setStylePrefs)
    const onStyleUpdate = () => {
      setPrefs(loadPrefs());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(STYLE_UPDATE_EVENT, onStyleUpdate as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STYLE_UPDATE_EVENT, onStyleUpdate as EventListener);
    };
  }, []);

  // 2. Then load the authoritative copy from Supabase, so preferences follow
  //    the user across devices and survive cleared browser storage.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const remote = await fetchStylePrefs(user.id);
      if (cancelled) return;
      if (remote) {
        setPrefs(remote);
        savePrefs(remote);
        // Notify components that read the cache directly (e.g. the chat page's
        // theme) so they pick up the freshly loaded values without a reload.
        window.dispatchEvent(new CustomEvent(STYLE_UPDATE_EVENT));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <StyleContext.Provider value={{ prefs, loading }}>
      {children}
    </StyleContext.Provider>
  );
}

export function useStylePrefs() {
  return useContext(StyleContext);
}

// ── Imperative setter (for the profile page) ──
/**
 * Saves preferences for the signed-in user.
 *
 * The local cache is updated first so the UI reflects the change instantly,
 * then the values are persisted to the user's profile row. Pass a `userId` to
 * persist; without one (signed out) the change stays local to this browser.
 *
 * Returns an error message when the remote save failed, otherwise null.
 */
export async function setStylePrefs(
  prefs: StylePrefs,
  userId?: string | null
): Promise<string | null> {
  savePrefs(prefs);
  // Dispatch custom event so the provider updates in the same tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STYLE_UPDATE_EVENT));
  }

  if (!userId) return null;

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ style_prefs: prefs })
    .eq("user_id", userId);

  return error ? error.message : null;
}
