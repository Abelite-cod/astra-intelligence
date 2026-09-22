"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const BRAND_FEATURES = [
  "AI-powered content creation",
  "Multi-platform publishing",
  "Real-time analytics",
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

  // ── Success state ──
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0B09] px-6">
        <div className="w-full max-w-sm text-center">
          <div
            className="w-12 h-12 flex items-center justify-center mx-auto mb-6
              bg-[#0E2A1A] border border-[#1E4D30] rounded-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-[#4DAA74]" />
          </div>
          <h2 className="text-xl font-semibold text-[#F5F2EE] tracking-tight mb-2">
            Check your email
          </h2>
          <p className="text-sm text-[#928C83] leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="text-[#B8B2A9] font-medium">{email}</span>.
            <br />
            Click it to activate your account.
          </p>
          <p className="mt-6 text-sm text-[#524D47]">
            Didn&apos;t get it?{" "}
            <button
              onClick={() => setSuccess(false)}
              className="text-[#B8B2A9] hover:text-[#F5F2EE] transition-colors underline underline-offset-2"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0D0B09]">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between h-screen w-[40%] flex-shrink-0 p-12 border-r border-[#2A2520] bg-[#161310]">
        {/* Logo */}
        <Link href="/">
          <span className="text-base font-semibold text-[#F5F2EE]">Astra</span>
          <span className="text-base font-semibold text-[#C8843A]">Intelligence</span>
        </Link>

        {/* Brand statement */}
        <div className="space-y-6">
          <p className="text-2xl font-semibold text-[#F5F2EE] leading-snug tracking-tight">
            Marketing intelligence<br />that thinks ahead.
          </p>
          <ul className="space-y-3">
            {BRAND_FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#928C83]">
                <span className="w-1 h-1 rounded-full bg-[#C8843A] flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Legal footnote */}
        <p className="text-xs text-[#524D47]">
          © 2024 Astra Intelligence. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col items-center justify-center min-h-screen lg:min-h-0 flex-1 px-6 py-12">
        {/* Mobile logo (hidden on desktop) */}
        <div className="lg:hidden mb-10">
          <Link href="/">
            <span className="text-base font-semibold text-[#F5F2EE]">Astra</span>
            <span className="text-base font-semibold text-[#C8843A]">Intelligence</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-[#F5F2EE] tracking-tight">Create account</h1>
            <p className="mt-1.5 text-sm text-[#928C83]">Start your free trial — no credit card needed</p>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full flex items-center justify-center gap-3 h-10 px-3 mb-5
              bg-[#161310] border border-[#3A3530] rounded-sm
              text-sm text-[#B8B2A9] hover:text-[#F5F2EE] hover:border-[#524D47]
              transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A2520]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#0D0B09] text-xs text-[#524D47]">or with email</span>
            </div>
          </div>

          {/* Registration form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="block text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em]"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Alex Johnson"
                className="w-full h-10 px-3
                  bg-[#161310]
                  border border-[#3A3530]
                  rounded-sm
                  text-sm text-[#F5F2EE]
                  placeholder:text-[#524D47]
                  focus:outline-none focus:border-[#C8843A]
                  transition-colors"
              />
            </div>

            {/* Work email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em]"
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full h-10 px-3
                  bg-[#161310]
                  border border-[#3A3530]
                  rounded-sm
                  text-sm text-[#F5F2EE]
                  placeholder:text-[#524D47]
                  focus:outline-none focus:border-[#C8843A]
                  transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full h-10 px-3 pr-10
                    bg-[#161310]
                    border border-[#3A3530]
                    rounded-sm
                    text-sm text-[#F5F2EE]
                    placeholder:text-[#524D47]
                    focus:outline-none focus:border-[#C8843A]
                    transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#524D47] hover:text-[#928C83] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="bg-[#8A3030]/10 border border-[#8A3030]/30 rounded-sm p-3 text-sm text-[#D97070]"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-10 flex items-center justify-center gap-2",
                "bg-[#C8843A] text-[#0D0B09] text-sm font-medium rounded-sm",
                "hover:bg-[#DE913A] transition-colors mt-2",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Creating account…" : "Create free account"}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-[#524D47]">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-[#6E6860] hover:text-[#B8B2A9] transition-colors underline underline-offset-2">
              Terms
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-[#6E6860] hover:text-[#B8B2A9] transition-colors underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>

          {/* Footer link */}
          <p className="mt-5 text-center text-sm text-[#6E6860]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#B8B2A9] hover:text-[#F5F2EE] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
