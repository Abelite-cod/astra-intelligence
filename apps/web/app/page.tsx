import Link from "next/link";
import {
  ArrowRight, Zap, Brain, TrendingUp, Bot, BarChart3, Sparkles,
  CheckCircle2, Twitter, Linkedin, Calendar, FileText, Send,
  MessageSquare, Star, Shield, Clock, ChevronDown, Globe,
  Users, Target, Image, Play
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    title: "Brand Brain",
    desc: "Upload your brand guide, website, and docs once. Claude reads everything and remembers it forever — every piece of content is perfectly on-brand.",
    gradient: "from-purple-500/20 to-astra-500/20",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15",
  },
  {
    icon: Bot,
    title: "4-Agent Pipeline",
    desc: "Research Agent finds insights. Trend Agent spots what's viral. Writer Agent creates content. Reviewer Agent scores and improves it. All in under 60 seconds.",
    gradient: "from-astra-500/20 to-blue-500/20",
    iconColor: "text-astra-400",
    iconBg: "bg-astra-500/15",
  },
  {
    icon: Calendar,
    title: "30-Day Campaign Builder",
    desc: "Give AI one goal. Get a complete 30-day content calendar across all platforms — with topics, hooks, and goals for every single post.",
    gradient: "from-blue-500/20 to-emerald-500/20",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  {
    icon: Image,
    title: "AI Image Generation",
    desc: "Claude analyzes your post and creates a targeted visual brief. Our image AI renders stunning, on-brand visuals that make people stop scrolling.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
  },
  {
    icon: Send,
    title: "Auto-Publish & Schedule",
    desc: "Approve content, set a time, done. Astra publishes directly to LinkedIn and Twitter — with images attached — at exactly the right moment.",
    gradient: "from-teal-500/20 to-purple-500/20",
    iconColor: "text-teal-400",
    iconBg: "bg-teal-500/15",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track content performance, agent runs, approval rates, and publishing history in one clean view. Know what's working and why.",
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/15",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Train your Brand Brain",
    desc: "Upload your brand guide, competitor analysis, customer personas, and past content. Claude learns your voice and never forgets it.",
    icon: Brain,
  },
  {
    step: "02",
    title: "Set your goal",
    desc: "Type what you want to achieve: 'Generate leads from CTOs', 'Launch new product', 'Build thought leadership'. One sentence is enough.",
    icon: Target,
  },
  {
    step: "03",
    title: "AI agents get to work",
    desc: "Research, Trend, Writer, and Reviewer agents collaborate. In 60 seconds you get reviewed, scored, on-brand content for every platform.",
    icon: Bot,
  },
  {
    step: "04",
    title: "Review, approve, publish",
    desc: "Edit anything you want. Approve what's great. Schedule for the optimal time or publish immediately. Astra handles the rest.",
    icon: CheckCircle2,
  },
];

const STATS = [
  { value: "4", label: "AI agents working simultaneously" },
  { value: "60s", label: "From goal to reviewed content" },
  { value: "5+", label: "Platforms supported" },
  { value: "∞", label: "Brand memory retained" },
];

const PRICING = [
  {
    name: "Starter",
    price: "$39",
    period: "/mo",
    desc: "For solo founders and creators",
    features: [
      "1 brand workspace",
      "Brand Brain (10 docs)",
      "Claude AI content generation",
      "LinkedIn + Twitter",
      "Content scheduling",
      "100K AI tokens/month",
      "Email support",
    ],
    cta: "Start free trial",
    highlight: false,
    trial: "14-day free trial",
  },
  {
    name: "Pro",
    price: "$149",
    period: "/mo",
    desc: "For growing marketing teams",
    features: [
      "3 brand workspaces",
      "5 team seats",
      "Multi-agent pipeline",
      "All platforms + Instagram",
      "Campaigns & calendar",
      "Analytics dashboard",
      "500K AI tokens/month",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
    badge: "Most Popular",
    trial: "14-day free trial",
  },
  {
    name: "Business",
    price: "$499",
    period: "/mo",
    desc: "For agencies and enterprises",
    features: [
      "10 brand workspaces",
      "20 team seats",
      "Custom AI workflows",
      "White-label reports",
      "CRM integration",
      "2M AI tokens/month",
      "SLA guarantee",
      "Dedicated support",
    ],
    cta: "Start free trial",
    highlight: false,
    trial: "14-day free trial",
  },
];

const FAQS = [
  {
    q: "How is Astra different from ChatGPT or other AI writing tools?",
    a: "ChatGPT is a blank canvas — you have to give it all the context every time. Astra permanently learns your brand, monitors your market, manages your entire content workflow, and publishes directly to social media. It's a marketing operating system, not a writing assistant.",
  },
  {
    q: "How does the Brand Brain work?",
    a: "You upload PDFs, brand guides, website content, or any documents. Claude (Amazon Bedrock) reads everything and uses it as permanent context for all content generation. Ask it questions about your own docs, generate content that references specific products, or let it write in your exact voice.",
  },
  {
    q: "Which platforms can Astra publish to?",
    a: "Currently LinkedIn and Twitter/X with direct OAuth publishing. Instagram and Facebook are on the roadmap.",
  },
  {
    q: "What AI model powers Astra?",
    a: "Astra uses Claude 3.5 Sonnet via Amazon Bedrock for all text generation — one of the world's most capable language models. Image generation uses Pollinations.ai.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes — all plans include a 14-day free trial. No credit card required to start.",
  },
];

// ── Components ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-white/10 rounded-2xl p-5 bg-white/5 hover:border-white/20 transition cursor-pointer">
      <summary className="flex items-center justify-between font-semibold text-white list-none">
        <span>{q}</span>
        <ChevronDown className="w-4 h-4 text-white/40 group-open:rotate-180 transition-transform shrink-0 ml-4" />
      </summary>
      <p className="mt-3 text-white/60 text-sm leading-relaxed">{a}</p>
    </details>
  );
}

// ── Main landing page ─────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center shadow-lg shadow-astra-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg">Astra Intelligence</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/60 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition">How it works</a>
            <a href="#pricing" className="text-sm text-white/60 hover:text-white transition">Pricing</a>
            <a href="#faq" className="text-sm text-white/60 hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-astra-500/20"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-20 pb-24 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-astra-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-astra-500/10 border border-astra-500/30 rounded-full px-4 py-1.5 text-sm text-astra-300 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by Claude 3.5 on Amazon Bedrock</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
            The AI that runs
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-astra-400 via-purple-400 to-pink-400">
              your entire marketing
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your brand. Astra learns everything, runs 4 specialized AI agents, generates campaigns, creates on-brand content with images, and publishes — automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition shadow-2xl shadow-astra-500/30"
            >
              Start free — no card needed
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition border border-white/15"
            >
              Sign in
            </Link>
          </div>

          <p className="text-white/35 text-sm">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-12 border-y border-white/10 bg-white/3">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-astra-400 to-purple-400 mb-1">{s.value}</p>
                <p className="text-white/50 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-astra-500/10 border border-astra-500/20 rounded-full px-3 py-1 text-xs text-astra-300 mb-4">
              <Zap className="w-3 h-3" /> Platform capabilities
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              Not a writing tool.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-astra-400 to-purple-400">A marketing system.</span>
            </h2>
            <p className="text-white/55 text-lg max-w-xl mx-auto">
              Astra replaces a 5-person marketing team — not just a copywriter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`bg-gradient-to-br ${f.gradient} border border-white/10 rounded-2xl p-6 hover:border-white/20 transition group`}
              >
                <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{f.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24 border-t border-white/10 bg-white/3">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-xs text-purple-300 mb-4">
              <Play className="w-3 h-3" /> Setup to publish in under an hour
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              How Astra works
            </h2>
            <p className="text-white/55 text-lg max-w-xl mx-auto">
              Four simple steps to a fully autonomous marketing system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="relative border border-white/10 rounded-2xl p-6 bg-white/5 hover:border-white/20 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-astra-500/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-astra-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-astra-400 font-mono">{step.step}</span>
                        <h3 className="font-bold text-white">{step.title}</h3>
                      </div>
                      <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-white/20 text-xl">→</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Platform logos strip ─────────────────────────────────────────── */}
      <section className="px-6 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/30 text-sm mb-8 uppercase tracking-widest font-semibold">Publishes directly to</p>
          <div className="flex flex-wrap justify-center gap-10">
            {[
              { icon: Linkedin, label: "LinkedIn", color: "text-[#0077B5]" },
              { icon: Twitter, label: "Twitter / X", color: "text-[#1DA1F2]" },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.label} className="flex items-center gap-2.5 text-white/40 hover:text-white/60 transition">
                  <Icon className={`w-6 h-6 ${p.color}`} />
                  <span className="font-semibold">{p.label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2.5 text-white/25">
              <Globe className="w-5 h-5" />
              <span className="text-sm">+ more coming</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24 border-t border-white/10 bg-white/3">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs text-emerald-300 mb-4">
              <Shield className="w-3 h-3" /> 14-day free trial on all plans
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              Simple, honest pricing
            </h2>
            <p className="text-white/55 text-lg">Start free. Scale when you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-6 flex flex-col relative ${
                  plan.highlight
                    ? "bg-gradient-to-br from-astra-500 to-purple-600 border-2 border-astra-400 shadow-2xl shadow-astra-500/30"
                    : "bg-white/6 border border-white/12 hover:border-white/20 transition"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-astra-600 text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-black text-xl mb-1">{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.highlight ? "text-white/80" : "text-white/50"}`}>
                    {plan.desc}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black">{plan.price}</span>
                    <span className={`${plan.highlight ? "text-white/70" : "text-white/40"} text-lg`}>{plan.period}</span>
                  </div>
                  <p className={`text-xs mt-1.5 ${plan.highlight ? "text-white/60" : "text-white/35"}`}>
                    {plan.trial}
                  </p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-white/90" : "text-astra-400"}`} />
                      <span className={plan.highlight ? "text-white/90" : "text-white/70"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`text-center py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-white text-astra-600 hover:bg-white/95 shadow-lg"
                      : "bg-white/10 text-white hover:bg-white/18 border border-white/15"
                  }`}
                >
                  {plan.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-white/30 text-sm mt-8">
            All prices in USD. Billed monthly. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 rounded-full px-3 py-1 text-xs text-white/50 mb-4">
              <MessageSquare className="w-3 h-3" /> Frequently asked questions
            </div>
            <h2 className="text-4xl font-black tracking-tight">Got questions?</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 border-t border-white/10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-astra-500/8 via-transparent to-purple-500/8 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-astra-500/10 border border-astra-500/20 rounded-full px-3 py-1 text-xs text-astra-300 mb-6">
            <Clock className="w-3 h-3" /> First campaign in under an hour
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight">
            Ready to hire your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-astra-400 to-purple-400">
              AI marketing team?
            </span>
          </h2>
          <p className="text-white/55 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Set up your Brand Brain in 15 minutes. Let Claude generate your first campaign. Publish to LinkedIn and Twitter in under an hour.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white font-bold px-10 py-4 rounded-2xl text-lg transition shadow-2xl shadow-astra-500/30"
            >
              <Sparkles className="w-5 h-5" />
              Get started free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="px-6 py-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-white">Astra Intelligence</span>
              <span className="text-white/25 text-sm">— The AI Marketing OS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/35">
              <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
              <Link href="/login" className="hover:text-white/60 transition">Sign in</Link>
              <Link href="/register" className="hover:text-white/60 transition">Get started</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/8 text-center text-white/25 text-xs">
            © {new Date().getFullYear()} Astra Intelligence. Built to replace your marketing department.
          </div>
        </div>
      </footer>
    </div>
  );
}
