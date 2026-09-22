import Link from "next/link";
import { ArrowRight, Brain, Bot, Calendar, Send, BarChart3, Zap, CheckCircle2, Music2 } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Train your Brand Brain",
    desc: "Upload your brand guide, website, and docs. Astra learns your voice, audience, and products — permanently.",
  },
  {
    num: "02",
    title: "Agents go to work",
    desc: "Research, Trend, Writer, and Reviewer agents collaborate. In 60 seconds: researched, written, and reviewed content.",
  },
  {
    num: "03",
    title: "Review & approve",
    desc: "Edit anything you want. Your brand voice, your approval. Schedule for the perfect moment.",
  },
  {
    num: "04",
    title: "Publish everywhere",
    desc: "One click publishes to LinkedIn, Twitter, and TikTok simultaneously — with images and videos attached.",
  },
];

const FEATURES = [
  { icon: Brain,    title: "Brand Brain",      desc: "Permanent Astra memory of your brand, audience, and products" },
  { icon: Bot,      title: "4-Agent Pipeline", desc: "Research → Trend → Writer → Reviewer in under 60 seconds" },
  { icon: Calendar, title: "Campaign Builder", desc: "Full 30-day content calendar from one goal" },
  { icon: Music2,   title: "TikTok Studio",    desc: "Native TikTok scripts, memory patterns, inbox upload" },
  { icon: BarChart3,title: "Analytics",         desc: "Performance data from every platform in one view" },
  { icon: Zap,      title: "Auto-Publish",      desc: "Scheduled posts with images across LinkedIn, Twitter, TikTok" },
];

const STATS = [
  { val: "60s",  label: "From goal to reviewed content" },
  { val: "4",    label: "Agents working simultaneously" },
  { val: "3+",   label: "Platforms auto-published" },
  { val: "∞",    label: "Brand memory retained" },
];

const PRICING = [
  {
    name: "Starter",
    price: "$39",
    desc: "For solo founders",
    features: ["1 brand workspace", "100K Astra tokens/mo", "LinkedIn + Twitter", "Brand Brain", "Email support"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$149",
    desc: "For growing teams",
    features: ["3 brands", "5 seats", "500K Astra tokens/mo", "All platforms + TikTok", "Campaigns & calendar", "Analytics"],
    cta: "Start free trial",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Business",
    price: "$499",
    desc: "For agencies",
    features: ["10 brands", "20 seats", "2M Astra tokens/mo", "Multi-agent workflows", "White-label", "Dedicated support"],
    cta: "Start free trial",
    highlight: false,
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F2EE] overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-14 border-b border-[#1F1B17] bg-[#0D0B09]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-full flex items-center justify-between">
          {/* Logo — two-tone wordmark */}
          <Link href="/" className="flex items-center gap-0">
            <span className="text-base font-semibold tracking-tight text-[#F5F2EE]">Astra</span>
            <span className="text-base font-semibold tracking-tight text-[#C8843A]">Intelligence</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: "Features",     href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Pricing",      href: "#pricing" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-[#6E6860] hover:text-[#F5F2EE] transition-colors duration-150"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:block text-sm text-[#6E6860] hover:text-[#F5F2EE] transition-colors duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-[#C8843A] text-[#0D0B09] px-4 py-1.5 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors duration-150"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pt-24 pb-28 md:pt-32 md:pb-36">
        <div className="max-w-6xl mx-auto">
          {/* Eyebrow */}
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#C8843A] font-medium mb-6">
            AI-powered marketing intelligence
          </p>

          {/* H1 */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#F5F2EE] leading-[1.08] mb-6 max-w-3xl">
            Marketing intelligence
            <br />
            for modern brands.
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-[#B8B2A9] font-normal max-w-xl leading-relaxed mb-10">
            Upload your brand once. Astra learns everything, plans campaigns, generates on-brand content, and publishes to LinkedIn, Twitter, and TikTok — automatically.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-6 py-2.5 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors duration-150"
            >
              Start free — no card needed
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="text-sm text-[#B8B2A9] hover:text-[#F5F2EE] transition-colors duration-150"
            >
              Sign in to your account
            </Link>
          </div>

          {/* Micro-copy */}
          <p className="text-xs text-[#524D47]">14-day free trial · No credit card · Cancel anytime</p>

          {/* Divider */}
          <hr className="mt-16 border-t border-[#2A2520]" />
        </div>
      </section>

      {/* ── Platforms strip ──────────────────────────────────────────────────── */}
      <section className="border-b border-[#2A2520] bg-[#161310]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#6E6860] shrink-0 whitespace-nowrap">
            Publishes to
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {[
              { name: "LinkedIn",   color: "#0077B5" },
              { name: "Twitter / X", color: "#B8B2A9" },
              { name: "TikTok",     color: "#EE1D52" },
            ].map((p, i) => (
              <span
                key={p.name}
                className="text-sm font-medium"
                style={{ color: p.color }}
              >
                {p.name}
              </span>
            ))}
            <span className="text-sm text-[#524D47]">+ more coming</span>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 md:px-12 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="mb-16">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#6E6860] mb-4">
              Our workflow
            </p>
            <h2 className="text-3xl font-semibold text-[#F5F2EE] tracking-tight mb-3 max-w-lg">
              Four steps to autonomous marketing.
            </h2>
            <p className="text-base text-[#928C83] max-w-md leading-relaxed">
              From brand setup to published content — Astra handles the heavy lifting end to end.
            </p>
          </div>

          {/* Steps — editorial numbered list */}
          <div className="space-y-0">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.num} className="border-t border-[#2A2520] pt-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 md:gap-12 items-start">
                  {/* Large ghost number */}
                  <div
                    className="text-6xl font-bold leading-none select-none"
                    style={{ color: "#2A2520" }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#F5F2EE] mb-2 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#928C83] leading-relaxed max-w-prose">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-[#2A2520]" />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 md:px-12 py-24 md:py-32 border-t border-[#2A2520]">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="mb-16">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#6E6860] mb-4">
              Capabilities
            </p>
            <h2 className="text-3xl font-semibold text-[#F5F2EE] tracking-tight mb-3 max-w-lg">
              Not a writing tool. A marketing system.
            </h2>
            <p className="text-base text-[#928C83] max-w-md leading-relaxed">
              Astra replaces a 5-person marketing team — Research, Strategy, Writing, Design, and Publishing.
            </p>
          </div>

          {/* Features grid — open grid with top-border items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="border-t border-[#2A2520] pt-6 pb-8 pr-0 md:pr-8"
                >
                  <Icon className="w-4 h-4 text-[#6E6860] mb-4" />
                  <h3 className="text-base font-medium text-[#F5F2EE] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#B8B2A9] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#2A2520] border-b border-b-[#2A2520] bg-[#161310]">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520]">
            {STATS.map((s) => (
              <div key={s.label} className="py-12 px-6 first:pl-0 last:pr-0 text-center">
                <p className="text-5xl font-bold text-[#F5F2EE] tracking-tight mb-2">
                  {s.val}
                </p>
                <p className="text-sm text-[#6E6860] uppercase tracking-wide leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 md:px-12 py-24 md:py-32 border-t border-[#2A2520]">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="mb-16">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#6E6860] mb-4">
              Pricing
            </p>
            <h2 className="text-3xl font-semibold text-[#F5F2EE] tracking-tight mb-3">
              Simple, honest pricing.
            </h2>
            <p className="text-base text-[#928C83] leading-relaxed">
              Start free. Scale when you grow. Cancel anytime.
            </p>
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#2A2520]">
            {PRICING.map((plan, i) => (
              <div
                key={plan.name}
                className={[
                  "p-7 flex flex-col",
                  i < 2 ? "border-b md:border-b-0 md:border-r border-[#2A2520]" : "",
                  plan.highlight ? "bg-[#161310]" : "",
                ].join(" ")}
              >
                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[#F5F2EE]">{plan.name}</h3>
                    {plan.badge && (
                      <span className="text-[10px] uppercase tracking-[0.08em] font-medium text-[#C8843A] border border-[#C8843A]/40 px-1.5 py-0.5 rounded-sm">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6E6860]">{plan.desc}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6 border-b border-[#2A2520] pb-6">
                  <span className="text-4xl font-bold text-[#F5F2EE] tracking-tight">{plan.price}</span>
                  <span className="text-sm text-[#6E6860]">/mo</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[#B8B2A9]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#3D7A5A]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/register"
                  className={[
                    "w-full text-center py-2.5 text-sm font-medium rounded-sm transition-colors duration-150 flex items-center justify-center gap-2",
                    plan.highlight
                      ? "bg-[#C8843A] text-[#0D0B09] hover:bg-[#DE913A]"
                      : "border border-[#2A2520] text-[#B8B2A9] hover:text-[#F5F2EE] hover:border-[#3A3530]",
                  ].join(" ")}
                >
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-24 md:py-32 border-t border-[#2A2520] bg-[#161310]">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#6E6860] mb-6">
            Get started
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#F5F2EE] tracking-tight leading-[1.08] mb-4 max-w-xl">
            Your Astra marketing team is waiting.
          </h2>
          <p className="text-base text-[#928C83] mb-10 max-w-md leading-relaxed">
            Setup takes 15 minutes. First campaign in under an hour. Astra handles the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-6 py-2.5 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors duration-150"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-[#524D47] self-center">14-day free trial · No credit card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="px-6 md:px-12 py-10 border-t border-[#2A2520]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-0">
              <span className="text-sm font-semibold tracking-tight text-[#F5F2EE]">Astra</span>
              <span className="text-sm font-semibold tracking-tight text-[#C8843A]">Intelligence</span>
              <span className="text-[#524D47] text-sm ml-2">— The AI Marketing OS</span>
            </div>

            {/* Footer links */}
            <div className="flex items-center gap-6 text-sm text-[#6E6860]">
              <Link href="/privacy" className="hover:text-[#B8B2A9] transition-colors duration-150">Privacy</Link>
              <Link href="/terms"   className="hover:text-[#B8B2A9] transition-colors duration-150">Terms</Link>
              <Link href="/login"   className="hover:text-[#B8B2A9] transition-colors duration-150">Sign in</Link>
              <Link href="/register" className="hover:text-[#B8B2A9] transition-colors duration-150">Get started</Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1F1B17] text-[#524D47] text-xs">
            © {new Date().getFullYear()} Astra Intelligence. Built to replace your marketing department.
          </div>
        </div>
      </footer>
    </div>
  );
}
