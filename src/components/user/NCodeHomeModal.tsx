"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { NCodeModal } from "./NCodeModal";

export function NCodeHomeModal() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [nCode, setNCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user || loading) return;

    const fetchOrCreate = async () => {
      try {
        const statusRes = await fetch("/api/user/terminal-status");
        const status = (await statusRes.json()) as { n_code: string | null };

        if (status.n_code) {
          setNCode(status.n_code);
          setOpen(false);
        } else {
          const res = await fetch("/api/user/n-code", { method: "POST" });
          const data = (await res.json()) as { n_code?: string; error?: string };
          if (data.n_code) {
            setNCode(data.n_code);
            setOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to load N code", err);
      }
    };

    void fetchOrCreate();
  }, [user, loading]);

  const handleDone = () => {
    setOpen(false);
    setDone(true);
    router.push("/dashboard");
  };

  if (done) return null;

  return (
    <NCodeModal
      open={open}
      onClose={() => setOpen(false)}
      nCode={nCode}
      onDone={handleDone}
      showDone={true}
    />
  );
}
