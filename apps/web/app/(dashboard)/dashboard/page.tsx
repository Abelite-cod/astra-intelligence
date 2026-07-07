import { createClient } from "@/lib/supabase/server";
import {
  Brain,
  TrendingUp,
  FileText,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Good morning, {displayName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Your AI marketing intelligence is ready. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Onboarding CTA — shown until brand is configured */}
      <div className="bg-gradient-to-r from-astra-500 to-astra-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold text-sm">Get started</span>
            </div>
            <h2 className="text-xl font-bold mb-1">
              Train your AI Marketing Brain
            </h2>
            <p className="text-white/80 text-sm max-w-lg">
              Upload your brand guidelines, website, products, and goals. Astra
              learns everything about your company and never asks again.
            </p>
          </div>
          <Link
            href="/brand"
            className="flex items-center gap-2 bg-white text-astra-600 font-medium px-4 py-2 rounded-lg text-sm hover:bg-white/90 transition shrink-0 ml-4"
          >
            Set up Brand Brain
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm text-white/70">
          <span>✓ Semantic search across all your docs</span>
          <span>✓ On-brand content every time</span>
          <span>✓ Never loses context</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Posts scheduled",
            value: "0",
            sub: "this week",
            icon: FileText,
            color: "text-blue-500 bg-blue-500/10",
          },
          {
            label: "Active campaigns",
            value: "0",
            sub: "running now",
            icon: Zap,
            color: "text-astra-500 bg-astra-500/10",
          },
          {
            label: "Avg. engagement",
            value: "—",
            sub: "no data yet",
            icon: TrendingUp,
            color: "text-green-500 bg-green-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            href: "/brand",
            icon: Brain,
            title: "Brand Brain",
            desc: "Upload documents and train your AI",
            color: "bg-purple-500/10 text-purple-500",
          },
          {
            href: "/campaigns/new",
            icon: Zap,
            title: "New Campaign",
            desc: "Let AI generate a full campaign strategy",
            color: "bg-astra-500/10 text-astra-500",
          },
          {
            href: "/content",
            icon: FileText,
            title: "Create Content",
            desc: "Generate on-brand posts for any platform",
            color: "bg-blue-500/10 text-blue-500",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-card border border-border rounded-xl p-5 hover:border-astra-500/50 hover:shadow-sm transition group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-astra-600 transition">
              {action.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
