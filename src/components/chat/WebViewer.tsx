"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, ExternalLink, Loader2 } from "lucide-react";

interface WebViewerProps {
  url: string;
  onClose: () => void;
}

export default function WebViewer({ url, onClose }: WebViewerProps) {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasOpenedTab = useRef(false); // prevent duplicate new tabs

  const safeUrl = url.startsWith("http://") || url.startsWith("https://") ? url : "";
  const displayUrl = safeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Invalid URL → close immediately (do nothing further)
  if (!safeUrl) {
    return null;
  }

  // 1.5‑second time‑out: if iframe hasn't loaded, open in new tab & close
  useEffect(() => {
    if (!safeUrl) return;

    timerRef.current = setTimeout(() => {
      if (loading && !hasOpenedTab.current) {
        hasOpenedTab.current = true;
        // Open in new tab
        window.open(safeUrl, "_blank", "noopener,noreferrer");
        // Close the container
        onClose();
      }
    }, 1500); // 1.5 seconds – fast, but enough for most embeddable sites

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [safeUrl, loading, onClose]);

  const handleIframeLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(false);
  };

  // If the iframe somehow errors (rare), treat as failure
  const handleIframeError = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!hasOpenedTab.current) {
      hasOpenedTab.current = true;
      window.open(safeUrl, "_blank", "noopener,noreferrer");
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden bg-white dark:bg-gray-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[250px] sm:max-w-md">
            {displayUrl}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="relative" style={{ height: "400px" }}>
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        )}

        {/* Iframe – only visible after load */}
        <iframe
          ref={iframeRef}
          src={safeUrl}
          className="w-full h-full border-none"
          style={{ visibility: loading ? "hidden" : "visible" }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={`Embedded view: ${displayUrl}`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </motion.div>
  );
}