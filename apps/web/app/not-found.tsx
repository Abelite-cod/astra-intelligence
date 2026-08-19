import Link from "next/link";
import { Sparkles, Home, ArrowRight, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6">
      <div className="text-center max-w-lg">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-astra-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg text-white">Astra Intelligence</span>
          </Link>

          {/* 404 */}
          <div className="mb-6">
            <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-astra-400 to-purple-400 mb-2">404</p>
            <h1 className="text-2xl font-black text-white mb-3">Page not found</h1>
            <p className="text-white/50 text-base leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-astra-500/20 text-sm"
            >
              <Home className="w-4 h-4" /> Go to dashboard
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-medium px-6 py-3 rounded-xl transition text-sm"
            >
              <ArrowRight className="w-4 h-4" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
