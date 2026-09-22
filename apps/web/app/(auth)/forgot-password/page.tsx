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
    <div className="min-h-screen flex items-center justify-center bg-[#0D0B09] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded bg-[#C8843A] flex items-center justify-center">
            <Sparkles className="w-[1.125rem] h-[1.125rem] text-white" />
          </div>
          <span className="font-black text-xl text-[#F5F2EE]">Astra Intelligence</span>
        </Link>

        {sent ? (
          <div className="bg-[#161310] border border-[#2A2520] rounded p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-[#F5F2EE] mb-2">Check your email</h2>
            <p className="text-[#6E6860] text-sm leading-relaxed mb-6">
              We sent a password reset link to{" "}
              <span className="text-[#F5F2EE] font-semibold">{email}</span>.
              <br />
              Click the link to choose a new password.
            </p>
            <p className="text-[#524D47] text-xs mb-5">
              Didn&apos;t receive it? Check spam or{" "}
              <button onClick={() => setSent(false)} className="text-[#C8843A] hover:text-[#DE913A] transition underline">
                try again
              </button>
            </p>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-[#6E6860] hover:text-[#F5F2EE] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        ) : (
          <div className="bg-[#161310] border border-[#2A2520] rounded p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded bg-[#C8843A]/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#C8843A]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#F5F2EE]">Forgot your password?</h2>
                <p className="text-[#6E6860] text-sm">We&apos;ll send you a reset link</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B8B2A9] mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 rounded border border-[#3A3530] bg-[#0D0B09] text-[#F5F2EE] placeholder-[#524D47] focus:outline-none focus:ring-1 focus:ring-[#C8843A] text-sm transition"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded font-bold text-white text-sm transition",
                  "bg-[#C8843A] hover:bg-[#A86830]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-[#524D47] hover:text-[#B8B2A9] transition mt-5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
