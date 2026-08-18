"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBrands } from "@/hooks/use-brand";
import { useGenerateCampaign, useSaveCampaign } from "@/hooks/use-campaign";
import type { CalendarDay } from "@/types/campaign";
import { cn } from "@/lib/utils";
import {
  Sparkles, Loader2, ChevronDown, Zap, Calendar,
  Twitter, Linkedin, Instagram, Mail, BookOpen,
  Check, ArrowRight, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  linkedin: { icon: Linkedin, color: "text-[#0077B5]", bg: "bg-[#0077B5]/10" },
  twitter: { icon: Twitter, color: "text-[#1DA1F2]", bg: "bg-[#1DA1F2]/10" },
  instagram: { icon: Instagram, color: "text-[#E1306C]", bg: "bg-[#E1306C]/10" },
  email: { icon: Mail, color: "text-amber-600", bg: "bg-amber-500/10" },
  blog: { icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
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
        "w-full text-left p-3 rounded-xl border transition group",
        selected
          ? "border-astra-500 bg-astra-500/5"
          : "border-border bg-card hover:border-astra-500/40 hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-bold text-muted-foreground w-5">D{day.day}</span>
        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center shrink-0", pc.bg)}>
          <Icon className={cn("w-3 h-3", pc.color)} />
        </div>
        <span className={cn("text-xs font-medium capitalize", pc.color)}>{day.platform}</span>
        {selected && <Check className="w-3 h-3 text-astra-500 ml-auto" />}
      </div>
      <p className="text-xs text-foreground font-medium leading-snug line-clamp-2">{day.topic}</p>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{day.hook}</p>
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
        loading: `Claude is planning your ${duration}-day campaign…`,
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
      <div className="p-8 max-w-2xl mx-auto text-center">
        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Set up Brand Brain first</h2>
        <p className="text-muted-foreground mb-4">The Campaign Builder needs your brand context to generate relevant content.</p>
        <a href="/brand" className="inline-flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
          Set up Brand Brain <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // ── Step: Saved ────────────────────────────────────────────────────────────
  if (step === "saved") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Campaign saved!</h1>
        <p className="text-muted-foreground mb-6">
          Your 30-day campaign is ready. Go to Content to start generating and approving individual posts.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/content"
            className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
          >
            Generate content <ArrowRight className="w-4 h-4" />
          </a>
          <button
            onClick={() => { setStep("config"); setCalendar([]); setGoal(""); }}
            className="flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition"
          >
            <RotateCcw className="w-4 h-4" /> New campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter one goal. AI generates your full 30-day content strategy.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Config step ─────────────────────────────────────────────────────── */}
      {step === "config" && (
        <div className="max-w-2xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Campaign goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="What do you want to achieve with this campaign?"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {GOAL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGoal(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:border-astra-500/50 hover:text-astra-600 transition text-muted-foreground"
                  >
                    {s.length > 45 ? s.slice(0, 45) + "…" : s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Duration</label>
              <div className="flex gap-3">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium transition",
                      duration === d
                        ? "border-astra-500 bg-astra-500/5 text-astra-600"
                        : "border-border text-muted-foreground hover:border-astra-500/40"
                    )}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_CONFIG).map(([p, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition capitalize",
                        platforms.includes(p)
                          ? cn("border-astra-500 bg-astra-500/5", cfg.color)
                          : "border-border text-muted-foreground hover:border-astra-500/40"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" /> {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={generateMutation.isPending || !goal.trim() || platforms.length === 0}
              className={cn(
                "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-white text-sm transition",
                "bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Planning {duration}-day calendar…</>
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
          {/* Stats bar */}
          <div className="flex items-center gap-6 p-4 bg-card border border-border rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground">Goal</p>
              <p className="text-sm font-semibold text-foreground truncate max-w-xs">{goal}</p>
            </div>
            <div className="border-l border-border pl-6">
              <p className="text-xs text-muted-foreground">Posts</p>
              <p className="text-sm font-bold text-foreground">{calendar.length}</p>
            </div>
            <div className="border-l border-border pl-6">
              <p className="text-xs text-muted-foreground">Platforms</p>
              <div className="flex gap-1.5 mt-0.5">
                {platforms.map((p) => {
                  const cfg = PLATFORM_CONFIG[p];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  return <Icon key={p} className={cn("w-4 h-4", cfg.color)} />;
                })}
              </div>
            </div>
            <div className="ml-auto flex gap-3">
              <button
                onClick={() => { setStep("config"); setCalendar([]); }}
                className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm hover:bg-accent transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Regenerate
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Save campaign
              </button>
            </div>
          </div>

          {/* Calendar grid — 4 weeks */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {weeks.map((weekDays, wi) => (
              <div key={wi}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
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
            <div className="fixed bottom-6 right-6 w-80 bg-card border border-border rounded-2xl shadow-xl p-5 z-50">
              <div className="flex items-center gap-2 mb-3">
                {(() => {
                  const cfg = PLATFORM_CONFIG[selectedDay.platform] ?? PLATFORM_CONFIG.linkedin;
                  const Icon = cfg.icon;
                  return (
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.bg)}>
                      <Icon className={cn("w-4 h-4", cfg.color)} />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-semibold text-foreground">Day {selectedDay.day}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selectedDay.platform} · {selectedDay.content_type}</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">TOPIC</p>
                  <p className="text-foreground">{selectedDay.topic}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">HOOK</p>
                  <p className="text-foreground italic">"{selectedDay.hook}"</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">GOAL</p>
                  <p className="text-foreground">{selectedDay.goal}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
