"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Original, copyright‑free SVG icons ──────────────────

/** Plus button – a simple cross */
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="2" x2="8" y2="14" />
    <line x1="2" y1="8" x2="14" y2="8" />
  </svg>
);

/** Compass / auto-pilot – for Auto routing */
const AutoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.5" />
    <polygon points="8,4 9.5,8 8,12 6.5,8" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** Lightning bolt – for N Fast */
const FastIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.5 1L3 9h4.5L7 15l7-8H9L9.5 1z" />
  </svg>
);

/** Processor chip – for N Plus */
const PlusModelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="10" height="10" rx="1.5" />
    <line x1="6" y1="1" x2="6" y2="3" />
    <line x1="10" y1="1" x2="10" y2="3" />
    <line x1="6" y1="13" x2="6" y2="15" />
    <line x1="10" y1="13" x2="10" y2="15" />
    <line x1="1" y1="6" x2="3" y2="6" />
    <line x1="1" y1="10" x2="3" y2="10" />
    <line x1="13" y1="6" x2="15" y2="6" />
    <line x1="13" y1="10" x2="15" y2="10" />
    <rect x="6" y="6" width="4" height="4" rx="0.5" />
  </svg>
);

/** Brain – for N Pro */
const ProIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 4c0-2 2-3 3-3s3 1 3 3c0 1.5-1 2-1 3" strokeLinecap="round" />
    <path d="M4 7c-1 0-2 1-2 2s1 2 2 2" />
    <path d="M12 7c1 0 2 1 2 2s-1 2-2 2" />
    <path d="M5 11c0 1 .5 2 1.5 2h3c1 0 1.5-1 1.5-2" strokeLinecap="round" />
    <circle cx="5.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Globe – for N Live */
const LiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <ellipse cx="8" cy="8" rx="3" ry="6" />
    <line x1="2" y1="8" x2="14" y2="8" />
    <line x1="8" y1="2" x2="8" y2="14" />
  </svg>
);

/** Code brackets – for N Code */
const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polyline points="5,5 2,8 5,11" />
    <polyline points="11,5 14,8 11,11" />
    <line x1="6" y1="3" x2="10" y2="13" />
  </svg>
);

/** Spark star – for N AAI */
const AaiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 1l1 5h5l-4 3 2 5-4-3-4 3 2-5-4-3h5z" strokeLinejoin="round" />
  </svg>
);

/** Crown – for N NI (Premium) */
const NiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4l3 2 2-3 2 3 3-2 2 10H2z" strokeLinejoin="round" />
    <path d="M2 14h12" strokeLinecap="round" />
  </svg>
);

/** Diamond – for N + Pro (Ultimate) */
const PlusProIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M8 1L14 6L8 15L2 6Z" />
    <line x1="2" y1="6" x2="14" y2="6" />
  </svg>
);

/** Right arrow – for "More" */
const ChevronRightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="4,2 8,6 4,10" />
  </svg>
);

/** Left arrow – for "Back" */
const ChevronLeftIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="8,2 4,6 8,10" />
  </svg>
);

// ── Model definitions ──────────────────────────────
const basicModels = [
  { id: "auto", name: "Auto", icon: AutoIcon, desc: "Picks the best model" },
  { id: "fast", name: "N Fast", icon: FastIcon, desc: "Instant" },
  { id: "plus", name: "N Plus", icon: PlusModelIcon, desc: "Balanced" },
  { id: "pro", name: "N Pro", icon: ProIcon, desc: "Deep reasoning" },
  { id: "go_plus", name: "N Go Plus", icon: PlusModelIcon, desc: "Enhanced AI" },
];

const advancedModels = [
  { id: "code", name: "N Code", icon: CodeIcon, desc: "Expert coding" },
  { id: "aai", name: "N AAI", icon: AaiIcon, desc: "Autonomous AI" },
  { id: "ni", name: "N NI", icon: NiIcon, desc: "Premium model" },
  { id: "plus_pro", name: "N + Pro", icon: PlusProIcon, desc: "Ultimate AI" },
];

// ── Component ──────────────────────────────────────
export default function ModelSelector({
  selected,
  onSelect,
  upward = false,
  isPro = false,
  allowedTiers,
}: {
  selected: string;
  onSelect: (id: string) => void;
  upward?: boolean;
  isPro?: boolean;
  allowedTiers?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const checkScreen = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, [checkScreen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAdvanced(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setShowAdvanced(false);
  };

  // Filter models based on allowed tiers — 'auto' is available for multi-tier plans (free)
  const filteredBasicModels = allowedTiers
    ? basicModels.filter(m =>
        m.id === "auto" ? allowedTiers.length > 1 : allowedTiers.includes(m.id)
      )
    : basicModels;
  const filteredAdvancedModels = allowedTiers
    ? advancedModels.filter(m => allowedTiers.includes(m.id))
    : advancedModels;

  const allModels = [...filteredBasicModels, ...filteredAdvancedModels];
  const currentModel = allModels.find((m) => m.id === selected) || filteredBasicModels[0];

  // Use filtered models based on allowed tiers
  const displayBasicModels = filteredBasicModels;
  const displayAdvancedModels = filteredAdvancedModels;

  const renderModelButton = (model: (typeof allModels)[0]) => {
    const isLockedBySubscription = model.id === "ni" && !isPro;

    return (
      <button
        key={model.id}
        type="button"
        onClick={() => {
          if (!isLockedBySubscription) handleSelect(model.id);
        }}
        disabled={isLockedBySubscription}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
          selected === model.id
            ? "bg-indigo-50 text-indigo-700 font-medium"
            : isLockedBySubscription
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-50"
        } ${isMobile ? "py-3 text-base" : ""}`}
      >
        <model.icon />
        <div className="text-left flex-1">
          <div className="font-medium text-xs sm:text-sm">{model.name}</div>
          <div className="text-[10px] sm:text-xs text-gray-400">
            {isLockedBySubscription ? "Pro only" : model.desc}
          </div>
        </div>
        {isLockedBySubscription && <span className="text-xs text-gray-400">🔒</span>}
      </button>
    );
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 shadow-sm transition-all"
        title="Select model"
      >
        <PlusIcon />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: upward ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: upward ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 rounded-2xl border border-gray-200 bg-white shadow-2xl p-2
              ${isMobile
                ? "fixed left-4 right-4 bottom-20 mx-auto max-w-sm"
                : `w-56 ${upward ? "bottom-full mb-2" : "top-full mt-2"} left-0`
              }
            `}
          >
            {allModels.length === 1 ? (
              // Single-model plan (Go Plus, Pro, + Pro) – just show the one model
              allModels.map(renderModelButton)
            ) : (
              <>
                <p className="text-xs text-gray-400 px-3 py-1">Select Model</p>
                {displayBasicModels.map(renderModelButton)}

                {displayAdvancedModels.length > 0 && (
                  <>
                    {isMobile ? (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400 px-3 py-1">Advanced</p>
                        {displayAdvancedModels.map(renderModelButton)}
                      </div>
                    ) : !showAdvanced ? (
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(true)}
                        className="w-full mt-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition"
                      >
                        <span>More</span>
                        <ChevronRightIcon />
                      </button>
                    ) : (
                      <div className="absolute left-full top-0 ml-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2">
                        <button
                          type="button"
                          onClick={() => setShowAdvanced(false)}
                          className="w-full flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 rounded-lg transition mb-1"
                        >
                          <ChevronLeftIcon />
                          Back
                        </button>
                        {displayAdvancedModels.map(renderModelButton)}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}