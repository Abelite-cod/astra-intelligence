"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Brain, Megaphone, FileText,
  BarChart3, Bot, Settings, LogOut, Send, Menu, X,
  Sun, Moon, Monitor, Music2
} from "lucide-react";
import { useState, useEffect } from "react";

// Nav groups — same hrefs, same labels, same icons as before
const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Intelligence Hub" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/brand",     icon: Brain,          label: "Brand Brain" },
      { href: "/campaigns", icon: Megaphone,       label: "Campaigns" },
      { href: "/content",   icon: FileText,        label: "Content" },
      { href: "/publish",   icon: Send,            label: "Publish" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/analytics", icon: BarChart3,       label: "Analytics" },
      { href: "/agents",    icon: Bot,             label: "ASTRA Agents" },
      { href: "/tiktok",    icon: Music2,          label: "TikTok Studio" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings",  icon: Settings,        label: "Settings" },
    ],
  },
];

interface SidebarProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  };
}

// ── Theme toggle — flat, no background bubble ─────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const options = [
    { value: "light",  icon: Sun,     label: "Light" },
    { value: "dark",   icon: Moon,    label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 px-4 pb-3">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={cn(
            "flex-1 flex items-center justify-center py-1.5 text-xs transition-colors duration-150",
            theme === value
              ? "text-[var(--color-text-primary)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}

// ── Shared nav content ────────────────────────────────────────────────────────

function NavContent({
  pathname,
  displayName,
  initials,
  email,
  signingOut,
  onSignOut,
  onNavClick,
}: {
  pathname: string;
  displayName: string;
  initials: string;
  email?: string;
  signingOut: boolean;
  onSignOut: () => void;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* ── Logo / wordmark ─────────────────────────────────────────────── */}
      <div className="h-14 flex items-center px-5 border-b border-[var(--color-border-subtle)] shrink-0">
        <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
          Astra
        </span>
        <span className="text-sm font-semibold tracking-tight text-[var(--color-accent)]">
          Intelligence
        </span>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div
            key={group.label}
            className={cn(
              groupIndex > 0 && "mt-1 pt-1 border-t border-[var(--color-border-subtle)]"
            )}
          >
            {/* Group label */}
            <p className="px-5 py-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {group.label}
            </p>

            {/* Nav items */}
            {group.items.map(({ href, icon: Icon, label }) => {
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
                    "flex items-center gap-3 px-5 py-2 text-sm transition-colors duration-150",
                    active
                      ? "border-l-2 border-[var(--color-accent)] bg-[var(--color-bg-hover)] font-medium text-[var(--color-text-primary)] pl-[calc(1.25rem-2px)]"
                      : "border-l-2 border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      active ? "text-[var(--color-accent)]" : "text-current"
                    )}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Theme toggle ────────────────────────────────────────────────── */}
      <ThemeToggle />

      {/* ── User footer ─────────────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-border-subtle)] shrink-0">
        <Link
          href="/settings"
          onClick={onNavClick}
          className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors duration-150"
        >
          {/* Neutral square monogram — no gradient */}
          <div className="w-7 h-7 rounded-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] truncate">
              {email}
            </p>
          </div>
        </Link>

        <button
          onClick={onSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-destructive hover:bg-destructive/10 transition-colors duration-150 border-t border-[var(--color-border-subtle)]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign out</span>
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

  // Derive initials: first letter of first name + first letter of last name (or just first two chars)
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sharedProps = {
    pathname,
    displayName,
    initials,
    email: user.email,
    signingOut,
    onSignOut: handleSignOut,
  };

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ md) ──────────────────────── */}
      <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col h-screen border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
        <NavContent {...sharedProps} />
      </aside>

      {/* ── Mobile top bar (visible < md) ──────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center">
          <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
            Astra
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--color-accent)]">
            Intelligence
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile drawer backdrop — no backdrop-blur ──────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-[220px] flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-subtle)] shadow-lg transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        <NavContent
          {...sharedProps}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
