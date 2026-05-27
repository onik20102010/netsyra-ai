"use client";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "./PasswordInput";
import GoogleButton from "./GoogleButton";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged in successfully!");
      router.push("/dashboard");
      router.refresh();
    }
  };

const handleGoogleSignIn = async () => {
  const { error } = await signInWithGoogle();
  if (error) {
    toast.error(error.message);
  }
  // No need to redirect manually – Supabase OAuth will redirect the whole page
};

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50 transition-colors"
        />
        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 text-white/60">
            <input
              type="checkbox"
              className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/30"
            />
            <span>Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-purple-400 hover:text-purple-300 transition"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 transition-all disabled:opacity-70"
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black/40 px-2 text-white/40">Or continue with</span>
        </div>
      </div>

      <GoogleButton onClick={handleGoogleSignIn} />

      <p className="text-center text-sm text-white/60">
        Don’t have an account?{" "}
        <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
          Create one
        </Link>
      </p>
    </form>
  );
}