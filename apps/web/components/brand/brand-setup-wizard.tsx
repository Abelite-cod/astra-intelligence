"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
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
  { id: "basics", label: "Basics" },
  { id: "audience", label: "Audience" },
  { id: "voice", label: "Voice" },
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
        <div className="w-12 h-12 bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center mx-auto mb-4 rounded-sm">
          <CheckCircle2 className="w-6 h-6 text-[#C8843A]" />
        </div>
        <h2 className="text-xl font-semibold text-[#F5F2EE] mb-2">Brand Brain activated</h2>
        <p className="text-[#6E6860] text-sm mb-6">
          Now upload your documents to complete the knowledge base.
        </p>
        <button
          onClick={() => router.push(`/brand/${brandId}/knowledge`)}
          className="inline-flex items-center gap-2 bg-[#C8843A] hover:bg-[#DE913A] text-[#0D0B09] font-medium px-5 py-2.5 rounded-sm text-sm transition-colors"
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
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm",
              step === i
                ? "text-[#F5F2EE] font-medium"
                : i < step
                  ? "text-[#C8843A]"
                  : "text-[#524D47]"
            )}>
              <span className={cn(
                "w-5 h-5 rounded-sm flex items-center justify-center text-xs font-medium border",
                step === i
                  ? "border-[#C8843A] text-[#C8843A] bg-transparent"
                  : i < step
                    ? "border-[#C8843A] bg-[#C8843A] text-[#0D0B09]"
                    : "border-[#3A3530] text-[#524D47]"
              )}>
                {i < step ? "✓" : i + 1}
              </span>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 bg-[#2A2520]" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Basics */}
      {step === 0 && (
        <form onSubmit={handleBasics} className="bg-[#0D0B09] border border-[#2A2520] rounded-sm">
          <div className="p-6 border-b border-[#2A2520]">
            <h2 className="text-base font-semibold text-[#F5F2EE] mb-0.5">Tell us about your brand</h2>
            <p className="text-[#6E6860] text-sm">This becomes ASTRA&apos;s permanent memory.</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">
                Brand / company name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Acme Corp"
                className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">
                Website URL
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">
                Industry
              </label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="SaaS, Healthcare, Finance…"
                className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">
                What does your company do?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="We help B2B SaaS companies automate their marketing…"
                className="px-3 py-2.5 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">
                Mission
              </label>
              <input
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="To make marketing accessible to every company…"
                className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
              />
            </div>
          </div>

          <div className="p-4 border-t border-[#2A2520] flex justify-end">
            <button
              type="submit"
              disabled={createBrand.isPending || !name.trim()}
              className="flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors disabled:opacity-50"
            >
              {createBrand.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 1: Audience */}
      {step === 1 && (
        <form onSubmit={handleAudience} className="bg-[#0D0B09] border border-[#2A2520] rounded-sm">
          <div className="p-6 border-b border-[#2A2520]">
            <h2 className="text-base font-semibold text-[#F5F2EE] mb-0.5">Who are your customers?</h2>
            <p className="text-[#6E6860] text-sm">ASTRA will target every message to the right person.</p>
          </div>

          <div className="p-6">
            <div>
              <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">
                Describe your target audience
              </label>
              <textarea
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                rows={4}
                placeholder="B2B SaaS founders and marketing managers at companies with 10–200 employees who struggle with content creation and consistency…"
                className="px-3 py-2.5 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full resize-none"
              />
            </div>
          </div>

          <div className="p-4 border-t border-[#2A2520] flex justify-between">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="border border-[#3A3530] text-[#B8B2A9] px-4 py-2 text-sm font-medium rounded-sm hover:border-[#524D47] hover:text-[#F5F2EE] bg-transparent transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              className="bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Voice */}
      {step === 2 && (
        <form onSubmit={handleVoice} className="bg-[#0D0B09] border border-[#2A2520] rounded-sm">
          <div className="p-6 border-b border-[#2A2520]">
            <h2 className="text-base font-semibold text-[#F5F2EE] mb-0.5">How does your brand sound?</h2>
            <p className="text-[#6E6860] text-sm">ASTRA will match this tone in every piece of content.</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-sm border text-left transition-colors",
                    tone === t.value
                      ? "border-[#C8843A] bg-[#1F1B17]"
                      : "border-[#2A2520] hover:border-[#3A3530] bg-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "w-3.5 h-3.5 rounded-sm border-2 shrink-0",
                      tone === t.value
                        ? "border-[#C8843A] bg-[#C8843A]"
                        : "border-[#3A3530]"
                    )}
                  />
                  <div>
                    <p className={cn(
                      "font-medium text-sm",
                      tone === t.value ? "text-[#F5F2EE]" : "text-[#B8B2A9]"
                    )}>{t.label}</p>
                    <p className="text-xs text-[#6E6860]">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-[#2A2520] flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border border-[#3A3530] text-[#B8B2A9] px-4 py-2 text-sm font-medium rounded-sm hover:border-[#524D47] hover:text-[#F5F2EE] bg-transparent transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={updateBrand.isPending}
              className="flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors disabled:opacity-50"
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
