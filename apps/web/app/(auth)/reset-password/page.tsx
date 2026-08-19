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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center shadow-lg shadow-astra-500/30">
            <Sparkles className="w-[1.125rem] h-[1.125rem] text-white" />
          </div>
          <span className="font-black text-xl text-white">Astra Intelligence</span>
        </Link>

        {done ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Password updated!</h2>
            <p className="text-white/55 text-sm">
              Your password has been changed successfully.
              <br />
              Redirecting to your dashboard…
            </p>
          </div>
        ) : !hasSession ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Invalid or expired link</h2>
            <p className="text-white/50 text-sm mb-5">
              This password reset link has expired or already been used.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-astra-500/20"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-astra-500/15 flex items-center justify-center">
                <Lock className="w-5 h-5 text-astra-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Choose a new password</h2>
                <p className="text-white/45 text-sm">Must be at least 8 characters</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-astra-500/50 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Confirm new password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repeat password"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-white/8 border text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-astra-500/50 text-sm transition",
                    confirm && password !== confirm ? "border-red-500/50" : "border-white/15"
                  )}
                />
                {confirm && password !== confirm && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition",
                  "bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-astra-500/20"
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
