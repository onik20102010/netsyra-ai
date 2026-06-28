"use client";
import { useEffect, useState, useCallback } from "react";

export type TierUsage = {
  model_tier: string;
  messages_used: number;
  reset_at: string;
};

export function useChatUsage() {
  const [usage, setUsage] = useState<TierUsage[]>([]);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchUsage]);

  return { usage, refetch: fetchUsage };
}