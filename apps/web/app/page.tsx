import Link from "next/link";
import {
  ArrowRight, Sparkles, Brain, Bot, Calendar,
  Send, BarChart3, Zap, CheckCircle2, Music2,
  Shield, ChevronRight
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Train your Brand Brain",
    desc: "Upload your brand guide, website, and docs. Claude learns your voice, audience, and products — permanently.",
    icon: Brain,
  },
  {
    num: "02",
    title: "AI Agents go to work",
    desc: "Research, Trend, Writer, and Reviewer agents collaborate. In 60 seconds: researched, written, and reviewed content.",
    icon: Bot,
  },
  {
    num: "03",
    title: "Review & approve",
    desc: "Edit anything you want. Your brand voice, your approval. Schedule for the perfect moment.",
    icon: Sparkles,
  },
  {
    num: "04",
    title: "Publish everywhere",
    desc: "One click publishes to LinkedIn, Twitter, and TikTok simultaneously — with images and videos attached.",
    icon: Send,
  },
];

const FEATURES = [
  { icon: Brain, title: "Brand Brain", desc: "Permanent AI memory of your brand, audience, and products" },
  { icon: Bot, title: "4-Agent Pipeline", desc: "Research → Trend → Writer → Reviewer in under 60 seconds" },
  { icon: Calendar, title: "Campaign Builder", desc: "Full 30-day content calendar from one goal" },
  { icon: Music2, title: "TikTok Studio", desc: "Native TikTok scripts, memory patterns, inbox upload" },
  { icon: BarChart3, title: "Analytics", desc: "Performance data from every platform in one view" },
  { icon: Zap, title: "Auto-Publish", desc: "Scheduled posts with images across LinkedIn, Twitter, TikTok" },
];

const PRICING = [
  {
    name: "Starter",
    price: "$39",
    desc: "For solo founders",
    features: ["1 brand workspace", "100K AI tokens/mo", "LinkedIn + Twitter", "Brand Brain", "Email support"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$149",
    desc: "For growing teams",
    features: ["3 brands", "5 seats", "500K AI tokens/mo", "All platforms + TikTok", "Campaigns & calendar", "Analytics"],
    cta: "Start free trial",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Business",
    price: "$499",
    desc: "For agencies",
    features: ["10 brands", "20 seats", "2M AI tokens/mo", "Multi-agent workflows", "White-label", "Dedicated support"],
    cta: "Start free trial",
    highlight: false,
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden">

      {/* ── Ambient background blobs ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-astra-500/8 blur-[120px]" />
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-purple-500/6 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#69C9D0]/5 blur-[100px]" />
        <div className="absolute bottom-[5%] right-[15%] w-[350px] h-[350px] rounded-full bg-astra-500/5 blur-[80px]" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 px-6 py-4" style={{ background: "rgba(2,8,23,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center shadow-lg shadow-astra-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">Astra Intelligence</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it works", "Pricing"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-white/50 hover:text-white transition">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition hidden sm:block">Sign in</Link>
            <Link href="/register"
              className="text-sm font-semibold bg-white text-[#020817] hover:bg-white/90 px-4 py-2 rounded-xl transition shadow-lg">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-24 pb-20 text-center">
        {/* Spotlight */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[300px] bg-gradient-to-b from-astra-500/60 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
            style={{ background: "radial-gradient(ellipse at top, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm text-white/60 mb-8"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Powered by Claude 3.5 on Amazon Bedrock
          </div>

          {/* Headline */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tighter mb-6">
            <span className="block text-white">Your AI</span>
            <span className="block" style={{
              background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 30%, #ec4899 60%, #f97316 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Marketing OS
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your brand once. Claude learns everything, plans campaigns, generates on-brand content, and publishes to LinkedIn, Twitter, and TikTok — automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/register"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 0 40px rgba(99,102,241,0.3)" }}>
              Start free — no card needed <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base text-white/70 hover:text-white transition"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Sign in
            </Link>
          </div>
          <p className="text-white/25 text-sm">14-day free trial · No credit card · Cancel anytime</p>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(99,102,241,0.1)",
            }}>
            {/* Mock browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="flex-1 ml-2 h-5 rounded-md" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>
            {/* Mock dashboard content */}
            <div className="p-6 grid grid-cols-12 gap-4 min-h-[280px]">
              {/* Sidebar */}
              <div className="col-span-2 space-y-2">
                {["Intelligence Hub", "Brand Brain", "Campaigns", "Content", "Publish", "TikTok Studio", "Analytics", "AI Agents"].map((item, i) => (
                  <div key={item} className="h-5 rounded-md text-[10px] flex items-center px-2"
                    style={{
                      background: i === 0 ? "rgba(99,102,241,0.2)" : "transparent",
                      color: i === 0 ? "#818cf8" : "rgba(255,255,255,0.3)",
                      fontSize: "10px"
                    }}>
                    {item}
                  </div>
                ))}
              </div>
              {/* Main area */}
              <div className="col-span-10 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-7 w-48 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="h-7 w-32 rounded-lg ml-auto" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.4))" }} />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[["Total content", "24", "text-blue-400"], ["Campaigns", "3", "text-astra-400"], ["Scheduled", "8", "text-amber-400"], ["Agent runs", "12", "text-purple-400"]].map(([l, v, c]) => (
                    <div key={l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] text-white/30 mb-1">{l}</p>
                      <p className={`text-xl font-black ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {["LinkedIn · approved", "Twitter · draft", "TikTok · approved"].map((t) => (
                      <div key={t} className="h-6 rounded-lg flex items-center px-2 gap-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[9px] text-white/30">{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[9px] text-white/20 mb-2">Activity</p>
                    <div className="flex items-end gap-1 h-16">
                      {[3, 6, 4, 8, 5, 9, 7, 11, 8, 12, 9, 14].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 5}px`, background: `rgba(99,102,241,${0.2 + i * 0.04})` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 blur-[40px]"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1), rgba(99,102,241,0.15))" }} />
        </div>
      </section>

      {/* ── Trusted by strip ─────────────────────────────────────────────────── */}
      <section className="px-6 py-10 border-y" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-white/25 mb-8">Publishes directly to</p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { name: "LinkedIn", color: "#0077B5" },
              { name: "Twitter / X", color: "#1DA1F2" },
              { name: "TikTok", color: "#EE1D52" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: p.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </div>
            ))}
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white/25"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              + more coming
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs text-white/40 mb-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Our workflow
              <span className="w-px h-3" style={{ background: "rgba(255,255,255,0.15)" }} />
              <span className="text-white/25">4 steps to autonomous marketing</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
              How our platform
              <br />
              <span style={{
                background: "linear-gradient(135deg, #818cf8, #a78bfa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
              }}>makes you unstoppable</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative rounded-2xl p-6 transition hover:scale-[1.02] duration-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                  {/* Large num */}
                  <div className="absolute top-4 right-5 text-6xl font-black select-none"
                    style={{ color: "rgba(255,255,255,0.04)", lineHeight: 1 }}>
                    {step.num}
                  </div>
                  <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <Icon className="w-5 h-5 text-astra-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <ChevronRight className="w-5 h-5 text-white/15" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.03) 50%, transparent 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              Not a writing tool.
              <br />
              <span style={{
                background: "linear-gradient(135deg, #f97316, #ec4899)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
              }}>A marketing system.</span>
            </h2>
            <p className="text-white/35 text-lg max-w-xl mx-auto">
              Astra replaces a 5-person marketing team — Research, Strategy, Writing, Design, and Publishing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const accents = ["#818cf8", "#a78bfa", "#ec4899", "#EE1D52", "#f97316", "#22d3ee"];
              const accent = accents[i % accents.length];
              return (
                <div key={f.title} className="group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-all duration-300"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}25` }}>
                    <Icon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 border-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ["60s", "From goal to reviewed content"],
            ["4", "AI agents working simultaneously"],
            ["3+", "Social platforms auto-published"],
            ["∞", "Brand memory retained forever"],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-4xl md:text-5xl font-black mb-2"
                style={{
                  background: "linear-gradient(135deg, #818cf8, #a78bfa, #ec4899)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                }}>
                {val}
              </p>
              <p className="text-sm text-white/35">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-white/35 text-lg">Start free. Scale when you grow. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING.map((plan) => (
              <div key={plan.name} className="relative rounded-3xl p-7 flex flex-col"
                style={plan.highlight ? {
                  background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.1) 100%)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  boxShadow: "0 0 40px rgba(99,102,241,0.1)",
                } : {
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-black text-white"
                      style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <h3 className="font-black text-white text-lg mb-1">{plan.name}</h3>
                <p className="text-white/35 text-sm mb-5">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-white/35">/mo</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className="w-full text-center py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
                  style={plan.highlight ? {
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    color: "white",
                    boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                  } : {
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                  {plan.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] blur-[100px]"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
            <span className="text-white">Your AI marketing team</span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #ec4899 70%, #f97316 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
            }}>
              is waiting.
            </span>
          </h2>
          <p className="text-white/40 text-lg mb-10 leading-relaxed">
            Setup takes 15 minutes. First campaign in under an hour. Claude handles the rest.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-white transition"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              boxShadow: "0 0 60px rgba(99,102,241,0.35)",
            }}>
            <Sparkles className="w-5 h-5" />
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/20 text-sm mt-4">14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-10 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-white">Astra Intelligence</span>
              <span className="text-white/20 text-sm">— The AI Marketing OS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/25">
              <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
              <Link href="/login" className="hover:text-white/60 transition">Sign in</Link>
              <Link href="/register" className="hover:text-white/60 transition">Get started</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 text-center text-white/15 text-xs"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            © {new Date().getFullYear()} Astra Intelligence. Built to replace your marketing department.
          </div>
        </div>
      </footer>
    </div>
  );
}
