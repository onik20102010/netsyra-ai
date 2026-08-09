"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Lock, Users, Activity, DollarSign, MessageSquare, TrendingUp, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "onik20102010@gmail.com";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  subscriptionStatus: string;
  messagesToday: number;
  totalConversations: number;
  isActiveNow: boolean;
  joined: string;
  lastActive: string | null;
}

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  activeNow: number;
  paidUsers: number;
  freeUsers: number;
  totalMessages: number;
  messagesToday: number;
  planDistribution: Record<string, number>;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  // Redirect non-admin users away
  useEffect(() => {
    if (!authLoading && user && user.email !== ADMIN_EMAIL) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.status === 401) {
        setAuthError("Unauthorized. Only the admin account can access this page.");
        return;
      }

      if (res.status === 403) {
        setAuthError("Wrong password. Try again.");
        return;
      }

      if (!res.ok) {
        setAuthError("Server error. Please try again.");
        return;
      }

      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users);
      setAuthenticated(true);
    } catch {
      setAuthError("Network error. Please check your connection.");
    } finally {
      setAuthenticating(false);
    }
  };

  const refreshData = async () => {
    setLoadingData(true);
    setDataError("");
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUsers(data.users);
      } else {
        setDataError("Failed to refresh data.");
      }
    } catch {
      setDataError("Network error.");
    } finally {
      setLoadingData(false);
    }
  };

  // ── Loading state ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080809] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  // ── Not admin ──
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#080809] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  // ── Password gate ──
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#080809] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold mb-2">Admin Access</h1>
            <p className="text-white/50 text-sm mb-6">
              Enter the admin password to access the dashboard.
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  autoFocus
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <p className="text-red-400 text-sm">{authError}</p>
              )}

              <button
                type="submit"
                disabled={!password || authenticating}
                className="w-full py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {authenticating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Unlock <ArrowLeft className="w-4 h-4 rotate-180" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ──
  const planColors: Record<string, string> = {
    free: "text-white/50",
    go_plus: "text-blue-400",
    pro: "text-purple-400",
    plus_pro: "text-amber-400",
  };

  const planLabels: Record<string, string> = {
    free: "Free",
    go_plus: "Go Plus",
    pro: "Pro",
    plus_pro: "+ Pro",
  };

  return (
    <div className="min-h-screen bg-[#080809] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold">Admin Dashboard</h1>
              <p className="text-xs text-white/40 hidden sm:block">Netsyra AI — Internal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={refreshData}
              disabled={loadingData}
              className="text-xs sm:text-sm text-white/60 hover:text-white border border-white/[0.1] hover:border-white/[0.2] px-3 py-1.5 sm:py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {loadingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              Refresh
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs sm:text-sm text-white/60 hover:text-white border border-white/[0.1] hover:border-white/[0.2] px-3 py-1.5 sm:py-2 rounded-lg transition"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {dataError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <p className="text-red-400 text-sm">{dataError}</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="Total Users"
            value={stats?.totalUsers ?? "—"}
            color="blue"
          />
          <StatCard
            icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="Active Today"
            value={stats?.activeToday ?? "—"}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="Active Now"
            value={stats?.activeNow ?? "—"}
            color="amber"
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="Paid Users"
            value={stats?.paidUsers ?? "—"}
            color="purple"
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="Messages Today"
            value={stats?.messagesToday ?? "—"}
            color="blue"
          />
          <StatCard
            icon={<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="Total Messages"
            value={stats?.totalMessages ?? "—"}
            color="blue"
          />
          <StatCard
            icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="Free Users"
            value={stats?.freeUsers ?? "—"}
            color="gray"
          />
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 sm:p-4">
            <p className="text-xs text-white/40 mb-2">Plan Distribution</p>
            <div className="space-y-1">
              {stats && Object.entries(stats.planDistribution).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between text-xs">
                  <span className={planColors[plan] || "text-white/50"}>{planLabels[plan] || plan}</span>
                  <span className="text-white/70 font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.08]">
            <h2 className="text-sm sm:text-base font-semibold">Users</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs border-b border-white/[0.05]">
                  <th className="text-left px-4 sm:px-6 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Messages Today</th>
                  <th className="text-left px-4 py-3 font-medium">Conversations</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="px-4 sm:px-6 py-3">
                      <div className="text-white/90">{u.email}</div>
                      {u.name && <div className="text-xs text-white/40">{u.name}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${planColors[u.plan] || "text-white/50"}`}>
                        {planLabels[u.plan] || u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{u.messagesToday}</td>
                    <td className="px-4 py-3 text-white/70">{u.totalConversations}</td>
                    <td className="px-4 py-3">
                      {u.isActiveNow ? (
                        <span className="inline-flex items-center gap-1.5 text-green-400 text-xs">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Active
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {new Date(u.joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/[0.05]">
            {users.map((u) => (
              <div key={u.id} className="px-4 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-white/90 text-sm truncate">{u.email}</div>
                    {u.name && <div className="text-xs text-white/40 truncate">{u.name}</div>}
                  </div>
                  <span className={`text-xs font-medium ml-2 flex-shrink-0 ${planColors[u.plan] || "text-white/50"}`}>
                    {planLabels[u.plan] || u.plan}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>{u.messagesToday} msgs today</span>
                  <span>{u.totalConversations} convos</span>
                  {u.isActiveNow ? (
                    <span className="inline-flex items-center gap-1 text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Active
                    </span>
                  ) : (
                    <span>Inactive</span>
                  )}
                </div>
                <div className="text-xs text-white/30 mt-1">
                  Joined {new Date(u.joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat card component ──
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "green" | "amber" | "purple" | "gray";
}) {
  const colorMap = {
    blue: "bg-blue-600/20 text-blue-400",
    green: "bg-green-600/20 text-green-400",
    amber: "bg-amber-600/20 text-amber-400",
    purple: "bg-purple-600/20 text-purple-400",
    gray: "bg-white/[0.05] text-white/50",
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 sm:p-4">
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-white/40 mb-0.5">{label}</p>
      <p className="text-lg sm:text-2xl font-semibold">{value}</p>
    </div>
  );
}
