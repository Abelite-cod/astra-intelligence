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
      <body className="min-h-screen flex items-center justify-center bg-[#0D0B09] px-6 font-sans antialiased">
        <div className="text-center max-w-lg">
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 mb-12">
              <div className="w-8 h-8 rounded bg-[#C8843A] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg text-[#F5F2EE]">Astra Intelligence</span>
            </Link>

            <div className="w-16 h-16 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <h1 className="text-2xl font-black text-[#F5F2EE] mb-3">Something went wrong</h1>
            <p className="text-[#6E6860] text-base leading-relaxed mb-8">
              An unexpected error occurred. Our team has been notified.
              {error.digest && (
                <span className="block text-[#524D47] text-xs mt-2 font-mono">
                  Error ID: {error.digest}
                </span>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 bg-[#C8843A] hover:bg-[#A86830] text-white font-semibold px-6 py-3 rounded transition text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 bg-[#161310] hover:bg-[#1F1B17] border border-[#2A2520] text-[#F5F2EE] font-medium px-6 py-3 rounded transition text-sm"
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
