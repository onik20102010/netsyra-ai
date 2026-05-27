"use client";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset email sent!");
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold text-white">Check your email</h3>
        <p className="text-white/60">
          We’ve sent a password reset link to <strong>{email}</strong>.
        </p>
        <Link href="/login" className="text-purple-400 hover:text-purple-300 text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        required
        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
      />
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 transition-all disabled:opacity-70"
      >
        {loading ? "Sending..." : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-white/60">
        <Link href="/login" className="text-purple-400 hover:text-purple-300">
          Back to login
        </Link>
      </p>
    </form>
  );
}