"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X, Copy, Check, ThumbsUp } from "lucide-react";

interface IdeTerminalSetupProps {
  setToken: (token: string | null) => void;
}

export function IdeTerminalSetup({ setToken }: IdeTerminalSetupProps) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<"password" | "verify" | "command">("password");
  const [loading, setLoading] = useState(false);
  const [nCode, setNCode] = useState<string | null>(null);
  const [idePassword, setIdePassword] = useState("");
  const [verifyNCode, setVerifyNCode] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [command, setCommand] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch("/api/user/terminal-status");
        const data = (await res.json()) as {
          n_code: string | null;
          ide_password_set: boolean;
          terminal_token: string | null;
        };

        if (data.n_code) {
          setNCode(data.n_code);
        } else {
          const createRes = await fetch("/api/user/n-code", { method: "POST" });
          const createData = (await createRes.json()) as { n_code?: string };
          if (createData.n_code) setNCode(createData.n_code);
        }

        if (data.ide_password_set) {
          setStep("verify");
        }
      } catch (err) {
        console.error("Failed to load terminal setup status", err);
      }
    };

    void loadStatus();
  }, []);

  const copyPassword = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(idePassword);
    } catch {
      // ignore
    }
  }, [idePassword]);

  const copyCommand = useCallback(async () => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [command]);

  const handlePasswordDone = async () => {
    if (!idePassword) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/ide-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: idePassword }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to save IDE password");
        return;
      }

      setNote("copy and save that password because you never able to see it again");
    } catch {
      alert("Failed to save IDE password");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setNote(null);
    setStep("verify");
  };

  const handleVerify = async () => {
    if (!verifyNCode || !verifyPassword) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/ide-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          n_code: verifyNCode,
          ide_password: verifyPassword,
          secure: typeof window !== "undefined" && window.location.protocol === "https:",
        }),
      });

      const data = (await res.json()) as { command?: string; token?: string; error?: string };

      if (!res.ok || !data.command || !data.token) {
        alert(data.error || "check this problem...");
        return;
      }

      setCommand(data.command);
      setToken(data.token);
      setStep("command");
    } catch {
      alert("check this problem...");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "password" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Create IDE password</h2>
              <p className="text-xs text-zinc-400 mt-1">
                This password is fixed and never shown again. Keep it safe.
              </p>
            </div>

            <input
              type="password"
              value={idePassword}
              onChange={(e) => setIdePassword(e.target.value)}
              placeholder="Enter a strong password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />

            <button
              onClick={handlePasswordDone}
              disabled={!idePassword || loading}
              className="w-full bg-white text-black rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Done"}
            </button>

            {note && (
              <div className="space-y-3">
                <p className="text-xs text-amber-400">{note}</p>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                  <code className="flex-1 text-xs text-zinc-300 break-all">{idePassword}</code>
                  <button
                    onClick={copyPassword}
                    className="text-xs text-white hover:text-zinc-300 px-2 py-1 bg-zinc-800 rounded"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={handleContinue}
                  className="w-full bg-zinc-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Connect your terminal</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Netsyra starts a local agent on your machine. The agent runs terminal commands and manages files in your workspace. Your credentials make the connection unique to your account.
              </p>
            </div>

            <input
              value={verifyNCode}
              onChange={(e) => setVerifyNCode(e.target.value)}
              placeholder="Paste your N code"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />

            <input
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder="Paste your IDE password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />

            <button
              onClick={handleVerify}
              disabled={!verifyNCode || !verifyPassword || loading}
              className="w-full bg-white text-black rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Create"}
            </button>
          </div>
        )}

        {step === "command" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-white">Good</h2>
            </div>

            <p className="text-xs text-zinc-400">
              Copy and run this command in PowerShell or CMD to start the local agent and connect your terminal to Netsyra.
            </p>

            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
              <code className="block text-xs text-zinc-300 break-all font-mono mb-2">
                {command}
              </code>
              <button
                onClick={copyCommand}
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 text-white rounded py-2 text-xs font-medium hover:bg-zinc-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy command
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              The agent runs on your computer. It can read, write, and execute commands in your project folder.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
