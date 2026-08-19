"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Sparkles, RefreshCw, Home, AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 font-sans antialiased">
        <div className="text-center max-w-lg">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/8 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 mb-12">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg text-white">Astra Intelligence</span>
            </Link>

            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <h1 className="text-2xl font-black text-white mb-3">Something went wrong</h1>
            <p className="text-white/50 text-base leading-relaxed mb-8">
              An unexpected error occurred. Our team has been notified.
              {error.digest && (
                <span className="block text-white/25 text-xs mt-2 font-mono">
                  Error ID: {error.digest}
                </span>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-astra-500/20 text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-medium px-6 py-3 rounded-xl transition text-sm"
              >
                <Home className="w-4 h-4" /> Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
