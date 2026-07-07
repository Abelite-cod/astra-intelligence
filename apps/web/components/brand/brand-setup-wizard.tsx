"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Globe, Target, Mic2, Package, Users, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useCreateBrand, useUpdateBrand } from "@/hooks/use-brand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "professional", label: "Professional", desc: "Formal, authoritative" },
  { value: "casual", label: "Casual", desc: "Friendly, approachable" },
  { value: "bold", label: "Bold", desc: "Confident, direct" },
  { value: "playful", label: "Playful", desc: "Fun, energetic" },
  { value: "educational", label: "Educational", desc: "Informative, clear" },
];

const STEPS = [
  { id: "basics", label: "Basics", icon: Brain },
  { id: "audience", label: "Audience", icon: Target },
  { id: "voice", label: "Voice", icon: Mic2 },
  { id: "done", label: "Done", icon: CheckCircle2 },
];

export function BrandSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [brandId, setBrandId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [mission, setMission] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand(brandId ?? "");

  async function handleBasics(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const brand = await createBrand.mutateAsync({
      name,
      website_url: website,
      industry,
      description,
      mission,
    });
    setBrandId(brand.id);
    setStep(1);
  }

  async function handleAudience(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleVoice(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId) return;

    await updateBrand.mutateAsync({
      tone_of_voice: tone,
      target_audience: { description: audience },
      onboarded: true,
    });

    toast.success("Brand Brain activated! Now add your knowledge documents.");
    setStep(3);
  }

  if (step === 3) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Brand Brain activated!</h2>
        <p className="text-muted-foreground mb-6">
          Now upload your documents to complete the knowledge base.
        </p>
        <button
          onClick={() => router.push(`/brand/${brandId}/knowledge`)}
          className="inline-flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-medium px-6 py-3 rounded-xl transition"
        >
          Add knowledge documents
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.slice(0, 3).map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition",
                i < step
                  ? "bg-green-500 text-white"
                  : i === step
                  ? "bg-astra-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-sm",
                i === step ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
            {i < 2 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 0: Basics */}
      {step === 0 && (
        <form onSubmit={handleBasics} className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Tell us about your brand</h2>
            <p className="text-muted-foreground text-sm">This becomes your AI&apos;s permanent memory.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Brand / company name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Acme Corp"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Website URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="SaaS, Healthcare, Finance…"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">What does your company do?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="We help B2B SaaS companies automate their marketing…"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Mission</label>
            <input
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="To make marketing accessible to every company…"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={createBrand.isPending || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {createBrand.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      )}

      {/* Step 1: Audience */}
      {step === 1 && (
        <form onSubmit={handleAudience} className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Who are your customers?</h2>
            <p className="text-muted-foreground text-sm">Your AI will target every message to the right person.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Describe your target audience
            </label>
            <textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              rows={4}
              placeholder="B2B SaaS founders and marketing managers at companies with 10–200 employees who struggle with content creation and consistency…"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground text-sm hover:bg-accent transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-medium py-2.5 rounded-xl transition"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Voice */}
      {step === 2 && (
        <form onSubmit={handleVoice} className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">How does your brand sound?</h2>
            <p className="text-muted-foreground text-sm">Your AI will match this tone in every piece of content.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border text-left transition",
                  tone === t.value
                    ? "border-astra-500 bg-astra-500/5"
                    : "border-border hover:border-astra-500/40"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 shrink-0",
                    tone === t.value
                      ? "border-astra-500 bg-astra-500"
                      : "border-muted-foreground"
                  )}
                />
                <div>
                  <p className="font-medium text-sm text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground text-sm hover:bg-accent transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={updateBrand.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50"
            >
              {updateBrand.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Activate Brand Brain <CheckCircle2 className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
