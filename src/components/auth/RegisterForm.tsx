"use client";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "./PasswordInput";
import GoogleButton from "./GoogleButton";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, name);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm.");
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <Input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
        />
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
        />
        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />
        <PasswordInput
          placeholder="Confirm password"
          value={confirm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
          required
        />
        <div className="flex items-center space-x-2 text-sm text-white/60">
          <input
            type="checkbox"
            required
            className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/30"
          />
          <span>
            I agree to the{" "}
            <Link href="#" className="text-purple-400 hover:text-purple-300">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-purple-400 hover:text-purple-300">
              Privacy Policy
            </Link>
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 transition-all disabled:opacity-70"
      >
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black/40 px-2 text-white/40">Or continue with</span>
        </div>
      </div>

      <GoogleButton onClick={handleGoogleSignUp} />

      <p className="text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}