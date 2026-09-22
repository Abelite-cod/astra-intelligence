"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBrands } from "@/hooks/use-brand";
import { useGenerateCampaign, useSaveCampaign } from "@/hooks/use-campaign";
import type { CalendarDay } from "@/types/campaign";
import { cn } from "@/lib/utils";
import {
  Sparkles, ChevronDown, Zap, Calendar,
  Twitter, Linkedin, Instagram, Mail, BookOpen,
  Check, ArrowRight, RotateCcw, Music2, X
} from "lucide-react";
import { toast } from "sonner";

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  linkedin:  { icon: Linkedin,  color: "text-[#0077B5]" },
  twitter:   { icon: Twitter,   color: "text-[#1DA1F2]" },
  instagram: { icon: Instagram, color: "text-[#E1306C]" },
  email:     { icon: Mail,      color: "text-[#6E6860]" },
  blog:      { icon: BookOpen,  color: "text-[#6E6860]" },
  tiktok:    { icon: Music2,    color: "text-[#EE1D52]" },
};

const GOAL_SUGGESTIONS = [
  "Launch our new AI marketing platform to B2B founders",
  "Build thought leadership in the AI industry",
  "Generate leads from marketing managers and CMOs",
  "Increase brand awareness among SaaS companies",
  "Educate our audience about marketing automation",
  "Drive sign-ups for our free trial",
];

const WEEK_LABELS = ["Week 1 — Awareness", "Week 2 — Education", "Week 3 — Proof", "Week 4 — Conversion"];

function DayCard({
  day,
  selected,
  onClick,
}: {
  day: CalendarDay;
  selected: boolean;
  onClick: () => void;
}) {
  const pc = PLATFORM_CONFIG[day.platform] ?? PLATFORM_CONFIG.linkedin;
  const Icon = pc.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-sm border transition-colors",
        selected
          ? "border-[#C8843A] bg-[#1F1B17]"
          : "border-[#2A2520] bg-[#161310] hover:border-[#3A3530] hover:bg-[#1F1B17]"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-[#524D47] w-6">D{day.day}</span>
        <Icon className={cn("w-3.5 h-3.5", pc.color)} />
        <span className="text-xs font-medium text-[#6E6860] capitalize">{day.platform}</span>
        {selected && <Check className="w-3 h-3 text-[#C8843A] ml-auto" />}
      </div>
      <p className="text-xs text-[#F5F2EE] font-medium leading-snug line-clamp-2">{day.topic}</p>
      <p className="text-xs text-[#6E6860] mt-1 line-clamp-1 italic">{day.hook}</p>
    </button>
  );
}

export default function CampaignsNewPage() {
  const router = useRouter();
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(30);
  const [platforms, setPlatforms] = useState<string[]>(["linkedin", "twitter"]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [step, setStep] = useState<"config" | "preview" | "saved">("config");
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);

  const activeBrandId = selectedBrandId || brands[0]?.id || "";
  const generateMutation = useGenerateCampaign();
  const saveMutation = useSaveCampaign(activeBrandId);

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim() || !activeBrandId) return;

    toast.promise(
      generateMutation.mutateAsync({ brand_id: activeBrandId, goal, duration, platforms })
        .then((res) => {
          setCalendar(res.calendar);
          setStep("preview");
          return res;
        }),
      {
        loading: `ASTRA is planning your ${duration}-day campaign…`,
        success: (res) => `${res.total_posts} posts planned across ${res.platforms.length} platforms`,
        error: (e) => e.message,
      }
    );
  }

  async function handleSave() {
    toast.promise(
      saveMutation.mutateAsync({
        brand_id: activeBrandId,
        goal,
        platforms,
        calendar,
        start_date: new Date().toISOString().split("T")[0],
      }).then((res) => {
        setSavedCampaignId(res.campaign_id);
        setStep("saved");
        return res;
      }),
      {
        loading: "Saving campaign to your library…",
        success: (res) => `${res.posts_created} posts saved to your campaign`,
        error: (e) => e.message,
      }
    );
  }

  // Group calendar into weeks
  const weeks = [0, 1, 2, 3].map((w) =>
    calendar.filter((d) => d.day > w * 7 && d.day <= (w + 1) * 7)
  );

  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="border border-[#2A2520] border-dashed rounded-sm p-16 text-center">
          <p className="text-sm font-medium text-[#6E6860]">Brand Brain required</p>
          <p className="text-xs text-[#524D47] mt-1 mb-4">The Campaign Builder needs your brand context to generate relevant content.</p>
          <a
            href="/brand"
            className="inline-flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors"
          >
            Set up Brand Brain <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // ── Step: Saved ────────────────────────────────────────────────────────────
  if (step === "saved") {
    return (
      <div className="p-8 max-w-2xl">
        <div className="border border-[#1E4D30] bg-[#0E2A1A] rounded-sm p-12 text-center">
          <div className="w-12 h-12 rounded-sm bg-[#1E4D30] flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-[#4D9A6A]" />
          </div>
          <h1 className="text-xl font-semibold text-[#F5F2EE] mb-2">Campaign saved</h1>
          <p className="text-sm text-[#6E6860] mb-6">
            Your {duration}-day campaign is ready. Go to Content to start generating and approving individual posts.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/content"
              className="flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors"
            >
              Generate content <ArrowRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => { setStep("config"); setCalendar([]); setGoal(""); }}
              className="flex items-center gap-2 border border-[#3A3530] text-[#B8B2A9] px-4 py-2 text-sm font-medium rounded-sm hover:border-[#524D47] hover:text-[#F5F2EE] bg-transparent transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> New campaign
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-[#2A2520] flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">Campaign Builder</h1>
          <p className="mt-1 text-sm text-[#928C83]">
            Enter one goal. ASTRA generates your full {duration}-day content strategy.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none h-9 pl-3 pr-8 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] focus:border-[#C8843A] focus:outline-none"
            >
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6860] pointer-events-none" />
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-8">
        {["Configure", "Preview", "Save"].map((label, i) => {
          const stepKeys = ["config", "preview", "saved"];
          const isActive = stepKeys[i] === step;
          const isPast = stepKeys.indexOf(step) > i;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-sm flex items-center justify-center text-xs font-medium border",
                isActive ? "border-[#C8843A] text-[#C8843A] bg-transparent" :
                isPast ? "border-[#3D7A5A] bg-[#0E2A1A] text-[#4D9A6A]" :
                "border-[#2A2520] text-[#524D47]"
              )}>
                {isPast ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={cn(
                "text-sm",
                isActive ? "text-[#F5F2EE] font-medium" : isPast ? "text-[#6E6860]" : "text-[#524D47]"
              )}>{label}</span>
              {i < 2 && <div className="w-8 h-px bg-[#2A2520] ml-2" />}
            </div>
          );
        })}
      </div>

      {/* ── Config step ─────────────────────────────────────────────────────── */}
      {step === "config" && (
        <div className="max-w-2xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-2">Campaign goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="What do you want to achieve with this campaign?"
                className="w-full px-3 py-2 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none resize-none"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {GOAL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGoal(s)}
                    className="text-xs px-2.5 py-1 rounded-sm border border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9] bg-transparent transition-colors"
                  >
                    {s.length > 45 ? s.slice(0, 45) + "…" : s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-2">Duration</label>
              <div className="flex gap-2">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      "px-4 py-2 rounded-sm border text-sm font-medium transition-colors",
                      duration === d
                        ? "border-[#C8843A] text-[#C8843A] bg-transparent"
                        : "border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9]"
                    )}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_CONFIG).map(([p, cfg]) => {
                  const Icon = cfg.icon;
                  const selected = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-sm border text-sm font-medium transition-colors capitalize",
                        selected
                          ? cn("border-[#C8843A] text-[#F5F2EE]")
                          : "border-[#2A2520] text-[#6E6860] hover:border-[#3A3530] hover:text-[#B8B2A9]"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", selected ? cfg.color : "text-[#6E6860]")} />
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={generateMutation.isPending || !goal.trim() || platforms.length === 0}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-sm font-medium text-[#0D0B09] text-sm transition-colors bg-[#C8843A] hover:bg-[#DE913A] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" />
                  Planning {duration}-day calendar…
                </>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate {duration}-day campaign</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── Preview step ────────────────────────────────────────────────────── */}
      {step === "preview" && calendar.length > 0 && (
        <div className="space-y-6">
          {/* Stats/actions bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520] border border-[#2A2520] rounded-sm">
            <div className="p-4">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Goal</p>
              <p className="text-sm font-medium text-[#F5F2EE] truncate max-w-[200px]">{goal}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Posts</p>
              <p className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">{calendar.length}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Platforms</p>
              <div className="flex gap-1.5 mt-1">
                {platforms.map((p) => {
                  const cfg = PLATFORM_CONFIG[p];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  return <Icon key={p} className={cn("w-4 h-4", cfg.color)} />;
                })}
              </div>
            </div>
            <div className="p-4 flex items-center gap-2">
              <button
                onClick={() => { setStep("config"); setCalendar([]); }}
                className="flex items-center gap-1.5 border border-[#3A3530] text-[#B8B2A9] px-3 py-1.5 rounded-sm text-xs font-medium hover:border-[#524D47] hover:text-[#F5F2EE] bg-transparent transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Regenerate
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-1.5 bg-[#C8843A] text-[#0D0B09] px-3 py-1.5 rounded-sm text-xs font-medium hover:bg-[#DE913A] transition-colors disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" />
                ) : <Calendar className="w-3.5 h-3.5" />}
                Save campaign
              </button>
            </div>
          </div>

          {/* Calendar grid — 4 weeks */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {weeks.map((weekDays, wi) => (
              <div key={wi}>
                <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-3">
                  {WEEK_LABELS[wi]}
                </p>
                <div className="space-y-2">
                  {weekDays.map((day) => (
                    <DayCard
                      key={day.day}
                      day={day}
                      selected={selectedDay?.day === day.day}
                      onClick={() => setSelectedDay(selectedDay?.day === day.day ? null : day)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Day detail panel */}
          {selectedDay && (
            <div className="fixed bottom-6 right-6 w-80 bg-[#1F1B17] border border-[#2A2520] rounded-sm shadow-lg p-5 z-50">
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const cfg = PLATFORM_CONFIG[selectedDay.platform] ?? PLATFORM_CONFIG.linkedin;
                  const Icon = cfg.icon;
                  return (
                    <div className="w-7 h-7 rounded-sm bg-[#2A2520] flex items-center justify-center">
                      <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-medium text-[#F5F2EE]">Day {selectedDay.day}</p>
                  <p className="text-xs text-[#6E6860] capitalize">{selectedDay.platform} · {selectedDay.content_type}</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="ml-auto text-[#6E6860] hover:text-[#F5F2EE] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm border-t border-[#2A2520] pt-4">
                <div>
                  <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Topic</p>
                  <p className="text-[#F5F2EE]">{selectedDay.topic}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Hook</p>
                  <p className="text-[#B8B2A9] italic">"{selectedDay.hook}"</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Goal</p>
                  <p className="text-[#F5F2EE]">{selectedDay.goal}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
