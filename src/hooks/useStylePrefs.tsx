"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";

export type FontSize = "small" | "medium" | "large";
export type TableEdges = "sharp" | "round";

export interface StylePrefs {
  sectionSpacing: number; // 0-100, default 50
  wordSpacing: number; // 0-100, default 50
  tableEdges: TableEdges;
  fontSize: FontSize;
}

export const DEFAULT_STYLE_PREFS: StylePrefs = {
  sectionSpacing: 50,
  wordSpacing: 50,
  tableEdges: "sharp",
  fontSize: "medium",
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

// ── localStorage helpers ──
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

interface StyleContextValue {
  prefs: StylePrefs;
  loading: boolean;
}

const StyleContext = createContext<StyleContextValue>({
  prefs: DEFAULT_STYLE_PREFS,
  loading: true,
});

export function StylePrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<StylePrefs>(DEFAULT_STYLE_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPrefs(loadPrefs());
    setLoading(false);

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

  return (
    <StyleContext.Provider value={{ prefs, loading }}>
      {children}
    </StyleContext.Provider>
  );
}

export function useStylePrefs() {
  return useContext(StyleContext);
}

// ── Imperative setter (for profile page) ──
export function setStylePrefs(prefs: StylePrefs) {
  savePrefs(prefs);
  // Dispatch custom event so the provider updates in the same tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STYLE_UPDATE_EVENT));
  }
}
