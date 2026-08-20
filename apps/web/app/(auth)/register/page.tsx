"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, CheckCircle2, Eye, EyeOff, ArrowRight } from "lucide-react";

const BENEFITS = [
  "Brand Brain — Claude learns your company permanently",
  "4 AI agents working simultaneously",
  "Auto-publish to LinkedIn + Twitter",
  "14-day free trial, no credit card",
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Send welcome email (best-effort, fire and forget)
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome", data: { name: fullName || email.split("@")[0] } }),
      }).catch(() => {});
    }
  }

  async function handleGoogleRegister() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Check your email</h2>
          <p className="text-white/60 text-base leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="text-white font-semibold">{email}</span>.
            <br />Click it to activate your account and start your free trial.
          </p>
          <p className="text-white/35 text-sm mt-6">
            Didn&apos;t get it? Check your spam folder or{" "}
            <button onClick={() => setSuccess(false)} className="text-astra-400 hover:text-astra-300 transition underline">
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Left panel — benefits (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-astra-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-astra-500/10 rounded-full blur-[80px]" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center shadow-lg shadow-astra-500/30">
              <Sparkles className="w-4.5 h-4.5 w-[1.125rem] h-[1.125rem] text-white" />
            </div>
            <span className="font-black text-xl text-white">Astra Intelligence</span>
          </Link>

          <h1 className="text-4xl font-black text-white mb-4 leading-tight">
            Your autonomous
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-astra-400 to-purple-400">
              AI marketing team
            </span>
          </h1>
          <p className="text-white/55 text-lg mb-10 leading-relaxed">
            Start your free trial in 60 seconds. No credit card required.
          </p>

          <div className="space-y-4">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-white/70 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-[1.125rem] h-[1.125rem] text-white" />
          </div>
          <span className="font-black text-xl text-white">Astra</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-black text-white mb-1">Create your account</h2>
            <p className="text-white/50 text-sm mb-7">Start your 14-day free trial — no card needed</p>

            {/* Google */}
            <button
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/15 text-white hover:bg-white/10 transition mb-5 text-sm font-semibold"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-transparent text-white/35 text-xs">or with email</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Alex Johnson"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-astra-500/50 text-sm transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Work email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-astra-500/50 text-sm transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-astra-500/50 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition",
                  "bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-astra-500/20"
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? "Creating account…" : "Create free account"}
              </button>
            </form>

            <p className="text-center text-white/40 text-xs mt-5">
              By signing up you agree to our{" "}
              <Link href="/terms" className="text-white/60 hover:text-white transition underline">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-white/60 hover:text-white transition underline">Privacy Policy</Link>
            </p>
          </div>

          <p className="text-center text-white/40 text-sm mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-astra-400 hover:text-astra-300 font-semibold transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
