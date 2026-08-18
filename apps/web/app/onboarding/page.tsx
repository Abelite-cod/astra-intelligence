"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateBrand, useUpdateBrand } from "@/hooks/use-brand";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Brain, Globe, Mic2, Target, Rocket, CheckCircle2,
  ArrowRight, ArrowLeft, Loader2, Sparkles, Upload,
  Twitter, Linkedin, Link2, X, BookOpen, Zap,
  Building2, Hash, Users, Star
} from "lucide-react";
import { toast } from "sonner";

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: "welcome", label: "Welcome", icon: Sparkles },
  { id: "brand", label: "Brand", icon: Building2 },
  { id: "voice", label: "Voice", icon: Mic2 },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "connect", label: "Connect", icon: Link2 },
  { id: "launch", label: "Launch", icon: Rocket },
];

const TONES = [
  { value: "professional", label: "Professional", desc: "Formal, authoritative, trusted", emoji: "🎯" },
  { value: "casual", label: "Casual", desc: "Friendly, approachable, warm", emoji: "😊" },
  { value: "bold", label: "Bold", desc: "Confident, direct, commanding", emoji: "⚡" },
  { value: "playful", label: "Playful", desc: "Fun, energetic, creative", emoji: "🎨" },
  { value: "educational", label: "Educational", desc: "Informative, clear, expert", emoji: "📚" },
  { value: "inspirational", label: "Inspirational", desc: "Motivating, visionary, uplifting", emoji: "✨" },
];

const INDUSTRIES = [
  "AI / Machine Learning", "SaaS / Software", "FinTech", "HealthTech",
  "E-commerce", "Marketing Agency", "Consulting", "Healthcare",
  "Education", "Legal", "Real Estate", "Manufacturing", "Other",
];

// ── Progress bar ──────────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.slice(0, totalSteps).map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              i < currentStep
                ? "bg-emerald-500 text-white"
                : i === currentStep
                ? "bg-astra-500 text-white ring-4 ring-astra-500/20"
                : "bg-muted text-muted-foreground"
            )}>
              {i < currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
            </div>
            {i < totalSteps - 1 && (
              <div className={cn("w-8 h-0.5 rounded-full transition-all", i < currentStep ? "bg-emerald-500" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [brandId, setBrandId] = useState<string | null>(null);

  // Step 1: Brand basics
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [mission, setMission] = useState("");

  // Step 2: Voice + audience
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");

  // Step 3: Knowledge (handled separately)
  const [docsUploaded, setDocsUploaded] = useState(0);

  // Step 4: Connect socials
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand(brandId ?? "");

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleBrandSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) return;
    try {
      const brand = await createBrand.mutateAsync({
        name: brandName,
        website_url: website,
        industry,
        description,
        mission,
      });
      setBrandId(brand.id);
      setStep(2);
    } catch (err) {
      toast.error("Failed to create brand. Please try again.");
    }
  }

  async function handleVoiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId) return;
    try {
      const kwArray = keywords.split(",").map((k) => k.trim()).filter(Boolean);
      await updateBrand.mutateAsync({
        tone_of_voice: tone,
        target_audience: { description: audience },
        keywords: kwArray,
        onboarded: true,
      });
      setStep(3);
    } catch (err) {
      toast.error("Failed to save brand voice.");
    }
  }

  async function handleSkipKnowledge() {
    setStep(4);
  }

  async function handleSkipConnect() {
    setStep(5);
  }

  async function handleLaunch() {
    router.push("/brand");
  }

  // ── Step 0: Welcome ──────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <OnboardingShell step={0} totalSteps={STEPS.length}>
        <div className="text-center max-w-lg mx-auto">
          {/* Animated logo */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-astra-500 to-purple-500 animate-pulse opacity-20" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-astra-500/30">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">
            Welcome to<br />
            <span className="bg-gradient-to-r from-astra-500 to-purple-500 bg-clip-text text-transparent">
              Astra Intelligence
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Your autonomous AI marketing operating system. Set up takes 3 minutes — then Claude writes, schedules, and publishes content while you focus on growth.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: Brain, label: "Brand Brain", desc: "AI learns your brand permanently" },
              { icon: Sparkles, label: "Claude AI", desc: "Writes on-brand content instantly" },
              { icon: Rocket, label: "Auto-publish", desc: "Scheduled across all platforms" },
            ].map((f) => (
              <div key={f.label} className="bg-card border border-border rounded-2xl p-4 text-left">
                <div className="w-8 h-8 rounded-lg bg-astra-500/10 flex items-center justify-center mb-2">
                  <f.icon className="w-4 h-4 text-astra-500" />
                </div>
                <p className="text-xs font-bold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white text-lg font-bold transition shadow-2xl shadow-astra-500/30"
          >
            Let&apos;s get started <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            Already set up?{" "}
            <button onClick={() => router.push("/brand")} className="text-astra-500 hover:text-astra-600 font-medium transition">
              Go to dashboard →
            </button>
          </p>
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 1: Brand basics ─────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <OnboardingShell step={1} totalSteps={STEPS.length} onBack={() => setStep(0)}>
        <form onSubmit={handleBrandSubmit} className="max-w-lg mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-astra-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-astra-500" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Tell Claude about your brand</h2>
            <p className="text-muted-foreground mt-2">This becomes your AI&apos;s permanent memory. The more detail, the better.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">Company name <span className="text-red-500">*</span></label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                placeholder="e.g. Astra Intelligence"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Website</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 transition"
                >
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">What does your company do? <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="We help B2B SaaS companies automate their marketing with AI. Our platform generates on-brand content, schedules posts, and analyzes performance automatically."
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 resize-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">Mission <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="To make world-class marketing accessible to every company…"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createBrand.isPending || !brandName.trim() || !description.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white font-bold transition disabled:opacity-50 shadow-lg shadow-astra-500/20"
          >
            {createBrand.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
      </OnboardingShell>
    );
  }

  // ── Step 2: Voice + audience ─────────────────────────────────────────────────

  if (step === 2) {
    return (
      <OnboardingShell step={2} totalSteps={STEPS.length} onBack={() => setStep(1)}>
        <form onSubmit={handleVoiceSubmit} className="max-w-xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-astra-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Mic2 className="w-7 h-7 text-astra-500" />
            </div>
            <h2 className="text-2xl font-black text-foreground">How does your brand sound?</h2>
            <p className="text-muted-foreground mt-2">Claude will match this tone in every piece of content.</p>
          </div>

          {/* Tone grid */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-3">Brand voice</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition",
                    tone === t.value
                      ? "border-astra-500 bg-astra-500/5 shadow-sm shadow-astra-500/10"
                      : "border-border hover:border-astra-500/40 hover:bg-accent/50"
                  )}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <p className={cn("text-sm font-bold", tone === t.value ? "text-astra-600" : "text-foreground")}>{t.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target audience */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Target audience <span className="text-muted-foreground font-normal">(recommended)</span>
            </label>
            <textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              rows={3}
              placeholder="B2B SaaS founders and marketing managers at companies with 10–200 employees who struggle with content creation consistency and want to scale their marketing without hiring more staff…"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 resize-none transition"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Brand keywords <span className="text-muted-foreground font-normal">(comma-separated)</span>
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="AI marketing, automation, content generation, B2B growth"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 transition"
            />
          </div>

          <button
            type="submit"
            disabled={updateBrand.isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white font-bold transition disabled:opacity-50 shadow-lg shadow-astra-500/20"
          >
            {updateBrand.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
      </OnboardingShell>
    );
  }

  // ── Step 3: Knowledge base (skippable) ───────────────────────────────────────

  if (step === 3) {
    return (
      <OnboardingShell step={3} totalSteps={STEPS.length} onBack={() => setStep(2)}>
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-astra-500/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Feed your Brand Brain</h2>
            <p className="text-muted-foreground mt-2">Upload PDFs, brand guides, or case studies. Claude reads everything and uses it when writing content.</p>
          </div>

          <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-foreground mb-1">Upload documents later</p>
            <p className="text-xs text-muted-foreground">
              You can upload PDFs, brand guides, and URLs from the Brand Brain page anytime.
            </p>
          </div>

          {/* What to upload suggestions */}
          <div className="bg-astra-500/5 border border-astra-500/20 rounded-2xl p-5">
            <p className="text-sm font-bold text-astra-600 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" /> What to upload for best results
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Brand style guide",
                "Product documentation",
                "Customer case studies",
                "Company blog posts",
                "Competitor analysis",
                "Press releases",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-astra-500 shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                if (brandId) {
                  router.push(`/brand/${brandId}`);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white font-bold transition shadow-lg shadow-astra-500/20"
            >
              <Upload className="w-5 h-5" /> Upload documents now
            </button>
            <button
              onClick={handleSkipKnowledge}
              className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              Skip for now — I&apos;ll add later
            </button>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 4: Connect socials (skippable) ──────────────────────────────────────

  if (step === 4) {
    return (
      <OnboardingShell step={4} totalSteps={STEPS.length} onBack={() => setStep(3)}>
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Connect your social accounts</h2>
            <p className="text-muted-foreground mt-2">Connect LinkedIn and Twitter so Astra can publish directly from the app.</p>
          </div>

          <div className="space-y-3">
            {/* LinkedIn */}
            <div className={cn(
              "flex items-center gap-4 p-5 rounded-2xl border transition",
              linkedinConnected ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
            )}>
              <div className="w-12 h-12 rounded-xl bg-[#0077B5]/10 flex items-center justify-center shrink-0">
                <Linkedin className="w-6 h-6 text-[#0077B5]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">LinkedIn</p>
                <p className="text-xs text-muted-foreground">Publish posts to your LinkedIn profile or company page</p>
              </div>
              {linkedinConnected ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <a
                  href={brandId ? `/api/auth/linkedin?brand_id=${brandId}` : "#"}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#0077B5] border border-[#0077B5]/30 hover:border-[#0077B5] hover:bg-[#0077B5]/5 px-4 py-2 rounded-xl transition"
                >
                  <Link2 className="w-3.5 h-3.5" /> Connect
                </a>
              )}
            </div>

            {/* Twitter */}
            <div className={cn(
              "flex items-center gap-4 p-5 rounded-2xl border transition",
              twitterConnected ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
            )}>
              <div className="w-12 h-12 rounded-xl bg-[#1DA1F2]/10 flex items-center justify-center shrink-0">
                <Twitter className="w-6 h-6 text-[#1DA1F2]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Twitter / X</p>
                <p className="text-xs text-muted-foreground">Publish tweets and threads to your Twitter account</p>
              </div>
              {twitterConnected ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <a
                  href={brandId ? `/api/auth/twitter?brand_id=${brandId}` : "#"}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#1DA1F2] border border-[#1DA1F2]/30 hover:border-[#1DA1F2] hover:bg-[#1DA1F2]/5 px-4 py-2 rounded-xl transition"
                >
                  <Link2 className="w-3.5 h-3.5" /> Connect
                </a>
              )}
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-2xl p-4 flex gap-3">
            <Zap className="w-4 h-4 text-astra-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              You can connect accounts anytime from the <strong>Publish</strong> page. Connecting now lets you immediately publish content after generating it.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSkipConnect}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white font-bold transition shadow-lg shadow-astra-500/20"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleSkipConnect}
              className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              Skip — I&apos;ll connect later
            </button>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 5: Launch ────────────────────────────────────────────────────────────

  return (
    <OnboardingShell step={5} totalSteps={STEPS.length}>
      <div className="max-w-lg mx-auto text-center">
        {/* Celebration */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-astra-500 animate-pulse opacity-20" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-astra-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Rocket className="w-14 h-14 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-foreground mb-4">
          You&apos;re all set! 🎉
        </h2>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          <strong className="text-foreground">{brandName || "Your brand"}</strong> is now powered by Astra Intelligence. Claude knows your brand, your voice, and your audience.
        </p>

        {/* Next steps */}
        <div className="space-y-3 mb-10 text-left">
          {[
            { icon: Sparkles, label: "Generate content", desc: "Create LinkedIn, Twitter & Instagram posts in one click", href: "/content", color: "text-astra-500", bg: "bg-astra-500/10" },
            { icon: Zap, label: "Run AI Agents", desc: "Let 4 specialized agents build a complete campaign", href: "/agents", color: "text-purple-600", bg: "bg-purple-500/10" },
            { icon: BookOpen, label: "Upload documents", desc: "Add brand guides and docs to sharpen the AI's knowledge", href: brandId ? `/brand/${brandId}` : "/brand", color: "text-blue-600", bg: "bg-blue-500/10" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-astra-500/40 hover:shadow-sm transition group"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground group-hover:text-astra-600 transition">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-astra-500 transition" />
            </a>
          ))}
        </div>

        <button
          onClick={handleLaunch}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white text-lg font-black transition shadow-2xl shadow-astra-500/30"
        >
          <Rocket className="w-5 h-5" /> Enter Astra Intelligence
        </button>
      </div>
    </OnboardingShell>
  );
}

// ── Layout shell ──────────────────────────────────────────────────────────────

function OnboardingShell({
  children,
  step,
  totalSteps,
  onBack,
}: {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  onBack?: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-foreground text-lg">Astra</span>
        </div>

        <StepIndicator currentStep={step} totalSteps={totalSteps} />

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Step {Math.min(step + 1, totalSteps)} of {totalSteps}</span>
          <button
            onClick={() => router.push("/brand")}
            className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1"
          >
            Skip setup <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-12">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-8 mx-auto max-w-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
