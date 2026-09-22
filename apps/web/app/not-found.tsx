import Link from "next/link";
import { Sparkles, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0B09] px-6">
      <div className="text-center max-w-lg">
        <div className="relative">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded bg-[#C8843A] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg text-[#F5F2EE]">Astra Intelligence</span>
          </Link>

          {/* 404 */}
          <div className="mb-6">
            <p className="text-8xl font-black text-[#C8843A] mb-2">404</p>
            <h1 className="text-2xl font-black text-[#F5F2EE] mb-3">Page not found</h1>
            <p className="text-[#6E6860] text-base leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 bg-[#C8843A] hover:bg-[#A86830] text-white font-semibold px-6 py-3 rounded transition text-sm"
            >
              <Home className="w-4 h-4" /> Go to dashboard
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-[#161310] hover:bg-[#1F1B17] border border-[#2A2520] text-[#F5F2EE] font-medium px-6 py-3 rounded transition text-sm"
            >
              <ArrowRight className="w-4 h-4" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
