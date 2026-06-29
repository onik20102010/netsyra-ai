"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [userInstructions, setUserInstructions] = useState("");
  const [loading, setLoading] = useState(true);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, goal, custom_instructions")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.name || "");
        setUserGoal(data.goal || "");
        setUserInstructions(data.custom_instructions || "");
      }
      setLoading(false);
    };
    loadProfile();
  }, [user, supabase]);

  // Save handler
  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        name: displayName,
        goal: userGoal,
        custom_instructions: userInstructions,
      },
      { onConflict: "user_id" }
    );
    if (error) {
      toast.error("Failed to save profile.");
      return;
    }
    toast.success("Profile saved!");
  };

  // Compute avatar initials
  const getInitials = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "?";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Glass card */}
        <div className="bg-white/75 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-indigo-500/10 p-7 md:p-8 space-y-6 transition-all duration-300 hover:shadow-indigo-500/20 hover:-translate-y-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => router.back()}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-medium transition-all hover:-translate-x-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">Profile</h1>
              <p className="text-sm text-slate-500 font-medium -mt-0.5">Manage your personal preferences</p>
            </div>
            {/* Avatar with ring */}
            <div className="flex-shrink-0 p-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 transition-transform duration-300 hover:-rotate-3">
              <div className="w-[72px] h-[72px] md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-2xl font-semibold text-indigo-600">
                {getInitials(displayName)}
              </div>
            </div>
          </div>

          {loading ? (
            /* Loading skeleton */
            <div className="space-y-4 pt-1 animate-pulse">
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200/70 rounded w-1/4" />
                <div className="h-10 bg-slate-200/60 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200/70 rounded w-1/3" />
                <div className="h-10 bg-slate-200/60 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200/70 rounded w-2/5" />
                <div className="h-24 bg-slate-200/60 rounded-xl" />
              </div>
              <div className="h-11 bg-slate-200/60 rounded-xl w-full" />
            </div>
          ) : (
            /* Form */
            <div className="space-y-5 pt-1">
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Display name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/60 bg-white/70 backdrop-blur-sm text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="Your name"
                />
              </div>

              {/* Goal */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                  Goal
                </label>
                <input
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/60 bg-white/70 backdrop-blur-sm text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="e.g., Learn to code"
                />
              </div>

              {/* Custom Instructions */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>
                  Custom instructions
                </label>
                <textarea
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/60 bg-white/70 backdrop-blur-sm text-slate-800 placeholder:text-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="Tell us how you'd like Netsyra to respond..."
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}