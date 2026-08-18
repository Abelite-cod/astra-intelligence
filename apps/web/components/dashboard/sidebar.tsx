"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Brain, Megaphone, FileText,
  BarChart3, Bot, Settings, Zap, LogOut, Send, Menu, X
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Intelligence Hub" },
  { href: "/brand", icon: Brain, label: "Brand Brain" },
  { href: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/content", icon: FileText, label: "Content" },
  { href: "/publish", icon: Send, label: "Publish" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/agents", icon: Bot, label: "AI Agents" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  };
}

// ── Shared nav content ────────────────────────────────────────────────────────

function NavContent({
  pathname,
  displayName,
  email,
  signingOut,
  onSignOut,
  onNavClick,
}: {
  pathname: string;
  displayName: string;
  email?: string;
  signingOut: boolean;
  onSignOut: () => void;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-astra-500/20">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-lg text-foreground">Astra</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-astra-500/10 text-astra-600 border border-astra-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-border pt-3 shrink-0">
        <Link
          href="/settings"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent transition"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {displayName[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </Link>
        <button
          onClick={onSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition mt-1"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );
}

// ── Main Sidebar export ───────────────────────────────────────────────────────

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName =
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ md) ──────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card h-full shrink-0">
        <NavContent
          pathname={pathname}
          displayName={displayName}
          email={user.email}
          signingOut={signingOut}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── Mobile top bar (visible < md) ──────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-card border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-base text-foreground">Astra</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl hover:bg-accent transition text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile drawer backdrop ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-accent transition text-muted-foreground hover:text-foreground"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        <NavContent
          pathname={pathname}
          displayName={displayName}
          email={user.email}
          signingOut={signingOut}
          onSignOut={handleSignOut}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
