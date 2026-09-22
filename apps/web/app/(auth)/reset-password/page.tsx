"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset session from the magic link
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0B09] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded bg-[#C8843A] flex items-center justify-center">
            <Sparkles className="w-[1.125rem] h-[1.125rem] text-white" />
          </div>
          <span className="font-black text-xl text-[#F5F2EE]">Astra Intelligence</span>
        </Link>

        {done ? (
          <div className="bg-[#161310] border border-[#2A2520] rounded p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-[#F5F2EE] mb-2">Password updated!</h2>
            <p className="text-[#6E6860] text-sm">
              Your password has been changed successfully.
              <br />
              Redirecting to your dashboard…
            </p>
          </div>
        ) : !hasSession ? (
          <div className="bg-[#161310] border border-[#2A2520] rounded p-8 text-center">
            <div className="w-12 h-12 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-black text-[#F5F2EE] mb-2">Invalid or expired link</h2>
            <p className="text-[#6E6860] text-sm mb-5">
              This password reset link has expired or already been used.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 bg-[#C8843A] hover:bg-[#A86830] text-white text-sm font-semibold px-5 py-2.5 rounded transition"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <div className="bg-[#161310] border border-[#2A2520] rounded p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-[#C8843A]/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#C8843A]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#F5F2EE]">Choose a new password</h2>
                <p className="text-[#6E6860] text-sm">Must be at least 8 characters</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B8B2A9] mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded border border-[#3A3530] bg-[#0D0B09] text-[#F5F2EE] placeholder-[#524D47] focus:outline-none focus:ring-1 focus:ring-[#C8843A] text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6860] hover:text-[#B8B2A9] transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B8B2A9] mb-1.5">Confirm new password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repeat password"
                  className={cn(
                    "w-full px-4 py-2.5 rounded border bg-[#0D0B09] text-[#F5F2EE] placeholder-[#524D47] focus:outline-none focus:ring-1 focus:ring-[#C8843A] text-sm transition",
                    confirm && password !== confirm ? "border-red-400" : "border-[#3A3530]"
                  )}
                />
                {confirm && password !== confirm && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded font-bold text-white text-sm transition",
                  "bg-[#C8843A] hover:bg-[#A86830]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {loading ? "Updating password…" : "Update password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
