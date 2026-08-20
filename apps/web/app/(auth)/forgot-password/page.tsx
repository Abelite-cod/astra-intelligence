"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, ArrowLeft, CheckCircle2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const appUrl = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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

        {sent ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Check your email</h2>
            <p className="text-white/55 text-sm leading-relaxed mb-6">
              We sent a password reset link to{" "}
              <span className="text-white font-semibold">{email}</span>.
              <br />
              Click the link to choose a new password.
            </p>
            <p className="text-white/30 text-xs mb-5">
              Didn&apos;t receive it? Check spam or{" "}
              <button onClick={() => setSent(false)} className="text-astra-400 hover:text-astra-300 transition underline">
                try again
              </button>
            </p>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-astra-500/15 flex items-center justify-center">
                <Mail className="w-5 h-5 text-astra-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Forgot your password?</h2>
                <p className="text-white/45 text-sm">We&apos;ll send you a reset link</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-astra-500/50 text-sm transition"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition",
                  "bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-astra-500/20"
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition mt-5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
