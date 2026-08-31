"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Palette,
  Home,
  LayoutDashboard,
  Clock,
  FileText,
  Code2,
  Menu,
  X,
  User,
  Target,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { StylePrefs, DEFAULT_STYLE_PREFS, FontSize, TableEdges, ChatTheme, setStylePrefs as persistStylePrefs } from "@/hooks/useStylePrefs";

// ── Sidebar nav items (matches history page) ──
const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home, active: false },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: false },
  { label: "Recent Chats", href: "/history", icon: Clock, active: false },
  { label: "CV Builder", href: "https://netsyraai.com/cv-builder/index.html", icon: FileText, external: true, active: false },
  { label: "IDE", href: "/ide", icon: Code2, active: false },
];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [userInstructions, setUserInstructions] = useState("");
  const [stylePrefs, setLocalStylePrefs] = useState<StylePrefs>(DEFAULT_STYLE_PREFS);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, goal, custom_instructions, style_prefs")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.name || "");
        setUserGoal(data.goal || "");
        setUserInstructions(data.custom_instructions || "");
        // Style prefs are stored on the profile row so they persist across
        // devices; fall back to defaults when the user hasn't set them yet.
        const stored = data.style_prefs as Partial<StylePrefs> | null;
        if (stored && Object.keys(stored).length > 0) {
          setLocalStylePrefs({ ...DEFAULT_STYLE_PREFS, ...stored });
        }
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
        style_prefs: stylePrefs,
      },
      { onConflict: "user_id" }
    );
    if (error) {
      toast.error("Failed to save profile.");
      return;
    }
    // The upsert above is the durable copy; this refreshes the local cache and
    // notifies the app so chat restyles immediately.
    await persistStylePrefs(stylePrefs);
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Reusable sidebar content ──
  const sidebarContent = (
    <>
      <Link
        href="/chat"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Chat
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const content = (
            <span
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                item.active
                  ? "bg-white/5 text-white border border-white/10"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </span>
          );
          return item.external ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </a>
          ) : (
            <Link key={item.label} href={item.href}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <p className="text-xs mt-3 px-3 text-gray-500">Netsyra AI</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-black text-gray-300">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-[260px] z-10 bg-black/80 backdrop-blur-xl border-r border-white/5 p-6 flex-col">
        <div className="mb-8 pb-6 border-b border-white/5">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent"
          >
            Netsyra AI
          </Link>
        </div>
        {sidebarContent}
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-[260px] max-w-[80vw] z-50 bg-black/95 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col md:hidden animate-[slideInLeft_0.2s_ease]">
            <div className="mb-8 pb-6 border-b border-white/5 flex items-center justify-between">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent"
              >
                Netsyra AI
              </Link>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main Content Area ── */}
      <div className="md:ml-[260px] relative z-10 flex-1 overflow-y-auto min-h-screen">
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 flex items-center justify-between md:justify-end px-4 sm:px-8 py-4 border-b border-white/5 backdrop-blur-sm bg-black/40">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs sm:text-sm text-white/40 truncate max-w-[140px] sm:max-w-none">
            supportnetsyra@gmail.com
          </span>
        </header>

        {/* ── Main ── */}
        <main className="relative z-10 px-4 sm:px-8 py-6 sm:py-12 max-w-2xl mx-auto">
          {/* ── Page Title + Avatar ── */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-white">
                Profile
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your personal preferences
              </p>
            </div>
            {/* Avatar */}
            <div className="flex-shrink-0 p-0.5 rounded-full bg-gradient-to-r from-gray-400 to-gray-200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black flex items-center justify-center text-xl sm:text-2xl font-semibold text-gray-200">
                {getInitials(displayName)}
              </div>
            </div>
          </div>

          {loading ? (
            /* ── Loading skeleton ── */
            <div className="space-y-4 animate-pulse">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-10 bg-white/10 rounded-lg" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-10 bg-white/10 rounded-lg" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="h-4 bg-white/10 rounded w-2/5" />
                <div className="h-24 bg-white/10 rounded-lg" />
              </div>
              <div className="h-11 bg-white/10 rounded-xl w-full" />
            </div>
          ) : (
            /* ── Form ── */
            <div className="space-y-4 sm:space-y-6">
              {/* ── Display Name ── */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-5 space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <User className="w-4 h-4 text-gray-500" />
                  Display name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/20 transition"
                  placeholder="Your name"
                />
              </div>

              {/* ── Goal ── */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-5 space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Target className="w-4 h-4 text-gray-500" />
                  Goal
                </label>
                <input
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/20 transition"
                  placeholder="e.g., Learn to code"
                />
              </div>

              {/* ── Custom Instructions ── */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-5 space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Custom instructions
                </label>
                <textarea
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/20 transition"
                  placeholder="Tell us how you'd like Netsyra to respond..."
                />
              </div>

              {/* ── Chat Theme ── */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-200">Chat Theme</h3>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500">Appearance</label>
                  <div className="flex gap-2">
                    {(["default", "dark"] as ChatTheme[]).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => {
                          const next = { ...stylePrefs, chatTheme: theme };
                          setLocalStylePrefs(next);
                          persistStylePrefs(next);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition border ${
                          stylePrefs.chatTheme === theme
                            ? "bg-white/15 text-white border-white/30"
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-200"
                        }`}
                      >
                        {theme === "default" ? "Default (Light)" : "Dark"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Style Preferences ── */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-200">Response Style</h3>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500">Font size</label>
                  <div className="flex gap-2">
                    {(["small", "medium", "large"] as FontSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          const next = { ...stylePrefs, fontSize: size };
                          setLocalStylePrefs(next);
                          persistStylePrefs(next);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition border ${
                          stylePrefs.fontSize === size
                            ? "bg-white/15 text-white border-white/30"
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-200"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Edges */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500">Table edges</label>
                  <div className="flex gap-2">
                    {(["sharp", "round"] as TableEdges[]).map((edge) => (
                      <button
                        key={edge}
                        onClick={() => {
                          const next = { ...stylePrefs, tableEdges: edge };
                          setLocalStylePrefs(next);
                          persistStylePrefs(next);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition border ${
                          stylePrefs.tableEdges === edge
                            ? "bg-white/15 text-white border-white/30"
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-200"
                        }`}
                      >
                        {edge}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Spacing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">Space between sections</label>
                    <span className="text-xs text-gray-600">
                      {stylePrefs.sectionSpacing < 33 ? "Compact" : stylePrefs.sectionSpacing > 66 ? "Spacious" : "Normal"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={stylePrefs.sectionSpacing}
                    onChange={(e) => {
                      const next = { ...stylePrefs, sectionSpacing: parseInt(e.target.value) };
                      setLocalStylePrefs(next);
                      persistStylePrefs(next);
                    }}
                    className="w-full accent-gray-400"
                  />
                </div>

                {/* Word Spacing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">Space between words</label>
                    <span className="text-xs text-gray-600">
                      {stylePrefs.wordSpacing < 33 ? "Tight" : stylePrefs.wordSpacing > 66 ? "Wide" : "Normal"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={stylePrefs.wordSpacing}
                    onChange={(e) => {
                      const next = { ...stylePrefs, wordSpacing: parseInt(e.target.value) };
                      setLocalStylePrefs(next);
                      persistStylePrefs(next);
                    }}
                    className="w-full accent-gray-400"
                  />
                </div>
              </div>

              {/* ── Save Button ── */}
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] active:scale-95"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
