"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Check, Sun, Globe, BarChart3, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userGoal: string;
  userInstructions: string;
  onSave: (name: string, goal: string, instructions: string) => void;
}

type UsageStats = {
  messagesToday: number;
  totalMessages: number;
};

export default function ProfileModal({
  isOpen,
  onClose,
  userName,
  userGoal,
  userInstructions,
  onSave,
}: ProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(userName);
  const [goal, setGoal] = useState(userGoal || "");
  const [instructions, setInstructions] = useState(userInstructions || "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "usage">("profile");
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch usage data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchUsage = async () => {
      const { count: totalCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split("T")[0];
      const { count: todayCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      setUsage({
        messagesToday: todayCount || 0,
        totalMessages: totalCount || 0,
      });
    };
    fetchUsage();
  }, [isOpen, supabase]);

  // Reset form fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(userName);
      setGoal(userGoal || "");
      setInstructions(userInstructions || "");
    }
  }, [isOpen, userName, userGoal, userInstructions]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    await onSave(name.trim(), goal, instructions.trim());
    setSaving(false);
    onClose();
    toast.success("Profile updated!");
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Centered modal – narrower width */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header + tabs */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setActiveTab("profile")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                        activeTab === "profile"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab("usage")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                        activeTab === "usage"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Usage
                    </button>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === "profile" ? (
                  <>
                    {/* Avatar */}
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {(name || userName || "U").charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Name input */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                        <User className="w-4 h-4 text-indigo-500" /> Display Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave();
                        }}
                      />
                    </div>

                    {/* Custom Instructions */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                        <svg
                          className="w-4 h-4 text-indigo-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        Custom Instructions
                      </label>
                      <p className="text-xs text-gray-400 mb-2">
                        Tell the AI how to respond (e.g. "Always reply in Spanish").
                      </p>
                      <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="e.g. Always use bullet points and keep answers short."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none resize-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition"
                      />
                    </div>

                    {/* Theme & Language */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Sun className="w-4 h-4 text-gray-400" /> Theme
                        </span>
                        <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                          Light
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" /> Language
                        </span>
                        <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                          English
                        </span>
                      </div>
                    </div>

                    {/* Save button */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                          Saving…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Save Changes
                        </span>
                      )}
                    </button>

                    {/* Subscription button */}
                    <Link
                      href="/billing/subscription"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Upgrade to Premium</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  /* Usage Dashboard */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs text-indigo-600 font-medium">Today</span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-700">
                          {usage?.messagesToday || 0}
                        </p>
                        <p className="text-xs text-indigo-400">messages</p>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-purple-600 font-medium">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          {usage?.totalMessages || 0}
                        </p>
                        <p className="text-xs text-purple-400">messages</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 text-center py-2">
                      All features are unlimited — text LLM, web search, dive deep, and image analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}