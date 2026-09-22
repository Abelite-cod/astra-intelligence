"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Zap } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
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
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0B09] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded bg-[#C8843A] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#F5F2EE]">Astra</span>
        </div>
        <div className="bg-[#161310] border border-[#2A2520] rounded p-8">
          <h1 className="text-2xl font-bold text-[#F5F2EE] mb-1">Set new password</h1>
          <p className="text-[#6E6860] text-sm mb-6">Choose a strong password for your account.</p>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#B8B2A9] mb-1.5">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 rounded border border-[#3A3530] bg-[#0D0B09] text-[#F5F2EE] placeholder-[#524D47] focus:outline-none focus:ring-1 focus:ring-[#C8843A] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B8B2A9] mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
                className="w-full px-3.5 py-2.5 rounded border border-[#3A3530] bg-[#0D0B09] text-[#F5F2EE] placeholder-[#524D47] focus:outline-none focus:ring-1 focus:ring-[#C8843A] text-sm"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded font-medium text-white text-sm bg-[#C8843A] hover:bg-[#A86830] transition disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
