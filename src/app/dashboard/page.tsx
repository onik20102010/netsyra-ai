"use client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Home, MessageSquare } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Email display */}
      <p className="text-sm text-gray-400 mb-8">
        Signed in as{" "}
        <span className="text-gray-600 font-medium">{user?.email}</span>
      </p>

      {/* Buttons */}
      <div className="w-full max-w-xs space-y-3">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <Home className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">Home</span>
        </Link>
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium">Chat</span>
        </Link>
      </div>
    </div>
  );
}