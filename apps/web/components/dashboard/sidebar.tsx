"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Brain,
  Megaphone,
  FileText,
  BarChart3,
  Bot,
  Settings,
  Zap,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Intelligence Hub" },
  { href: "/brand", icon: Brain, label: "Brand Brain" },
  { href: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/content", icon: FileText, label: "Content" },
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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

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
    <aside className="w-60 flex flex-col border-r border-border bg-card h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-astra-500 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg text-foreground">Astra</span>
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
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-astra-500/10 text-astra-600 dark:text-astra-400"
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
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-astra-500 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {displayName[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-1"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
