import Link from "next/link";
import { ArrowRight, Zap, Brain, TrendingUp, Bot, BarChart3, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Brand Brain",
    desc: "Upload your documents, website, and brand guidelines. Your AI learns everything about your company permanently.",
  },
  {
    icon: Bot,
    title: "Multi-Agent System",
    desc: "Research, Trend, Writer, Reviewer, and Publisher agents work together like a coordinated marketing team.",
  },
  {
    icon: Sparkles,
    title: "Content Factory",
    desc: "One brief becomes LinkedIn posts, Twitter threads, Instagram captions, email newsletters, and blog drafts.",
  },
  {
    icon: TrendingUp,
    title: "Trend Intelligence",
    desc: "Every morning, AI scans competitors, news, and search trends — then tells you exactly what to post.",
  },
  {
    icon: BarChart3,
    title: "Analytics Brain",
    desc: "Not likes and impressions. Revenue attributed, leads generated, ROI per campaign.",
  },
  {
    icon: Zap,
    title: "Learning Loop",
    desc: "Every post that runs teaches the system. Astra gets smarter the more you use it.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$39",
    period: "/mo",
    desc: "For solo founders and creators",
    features: ["1 brand", "Brand Brain", "Content generation", "3 platforms", "100K AI tokens/mo"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/mo",
    desc: "For growing marketing teams",
    features: ["3 brands", "5 seats", "Campaigns + calendar", "All platforms", "Analytics dashboard", "500K AI tokens/mo"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$499",
    period: "/mo",
    desc: "For agencies and enterprises",
    features: ["10 brands", "20 seats", "Multi-agent workflows", "Competitor intelligence", "CRM integration", "2M AI tokens/mo"],
    cta: "Start free trial",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-astra-950 via-slate-900 to-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-astra-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Astra Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-astra-500 hover:bg-astra-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-astra-500/10 border border-astra-500/30 rounded-full px-4 py-1.5 text-sm text-astra-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Your Autonomous AI Chief Marketing Officer
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            The AI that runs
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-astra-400 to-purple-400">
              your marketing
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            Upload your brand. Astra learns everything, monitors your market
            daily, generates campaigns, creates on-brand content, and learns
            from every result — automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition"
            >
              Start free — no card needed
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-8 py-3.5 rounded-xl text-lg transition border border-white/20"
            >
              Sign in
            </Link>
          </div>
          <p className="text-white/40 text-sm mt-4">
            14-day free trial · No credit card · Cancel anytime
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-8 border-y border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/40 text-sm mb-6">
            Replaces your entire marketing stack
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-white/30 text-sm font-medium">
            {["Strategy → Research → Planning → Content → Design → Approval → Publishing → Analytics → Optimization"].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Not a writing tool. A marketing system.
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Astra replaces a 5-person marketing team — not just a copywriter.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-astra-500/40 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-astra-500/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-astra-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, honest pricing</h2>
            <p className="text-white/60 text-lg">
              Start free. Scale when you grow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-astra-500 border-2 border-astra-400"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.highlight ? "text-white/80" : "text-white/50"}`}>
                    {plan.desc}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className={plan.highlight ? "text-white/70" : "text-white/40"}>
                      {plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={plan.highlight ? "text-white" : "text-astra-400"}>✓</span>
                      <span className={plan.highlight ? "text-white/90" : "text-white/70"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`text-center py-2.5 rounded-lg font-medium text-sm transition ${
                    plan.highlight
                      ? "bg-white text-astra-600 hover:bg-white/90"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-white/10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">
            Ready to hire your AI marketing team?
          </h2>
          <p className="text-white/60 text-lg mb-8">
            Set up your brand brain in 15 minutes. Your first campaign in an hour.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-semibold px-10 py-4 rounded-xl text-lg transition"
          >
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/10 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} Astra Intelligence. Built to replace your marketing department.
      </footer>
    </div>
  );
}
