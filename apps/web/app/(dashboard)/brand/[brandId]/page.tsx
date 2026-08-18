"use client";

import { useState } from "react";
import { useBrand, useBrandHealthScore, useUpdateBrand, useKnowledgeDocs } from "@/hooks/use-brand";
import { KnowledgeUploader } from "@/components/brand/knowledge-uploader";
import { KnowledgeChat } from "@/components/brand/knowledge-chat";
import {
  Brain, BarChart2, Globe, Mic2, Loader2, CheckCircle2,
  Pencil, Save, XCircle, Building2, Tag, Hash,
  Target, Users, BookOpen, MessageSquare, Zap,
  TrendingUp, FileText, X, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BrandPageProps {
  params: { brandId: string };
}

const SECTION_TABS = [
  { id: "overview", label: "Overview", icon: Brain },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "chat", label: "Ask AI", icon: MessageSquare },
];

export default function BrandDetailPage({ params }: BrandPageProps) {
  const { brandId } = params;
  const { data: brand, isLoading } = useBrand(brandId);
  const { data: health } = useBrandHealthScore(brandId);
  const { data: docs = [] } = useKnowledgeDocs(brandId);
  const updateMutation = useUpdateBrand(brandId);

  const [activeTab, setActiveTab] = useState<"overview" | "knowledge" | "chat">("overview");
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return <div className="p-8 text-center text-muted-foreground">Brand not found.</div>;
  }

  const score = health?.score ?? 0;
  const scoreColor = score >= 70 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-red-500";
  const scoreBg = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  const indexedDocs = docs.filter((d) => d.status === "indexed" || d.type === "url");

  function startEdit() {
    setEditFields({
      name: brand?.name ?? "",
      description: brand?.description ?? "",
      mission: brand?.mission ?? "",
      tone_of_voice: brand?.tone_of_voice ?? "",
      industry: brand?.industry ?? "",
      website_url: brand?.website_url ?? "",
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditFields({});
  }

  function saveEdit() {
    toast.promise(
      updateMutation.mutateAsync(editFields).then(() => {
        setEditing(false);
        setEditFields({});
      }),
      { loading: "Saving…", success: "Brand updated ✓", error: "Failed to save" }
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* ── Hero Header ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-astra-500/10 via-background to-purple-500/5 border border-border rounded-3xl p-7">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Brand avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-astra-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-astra-500/20">
              <span className="text-2xl font-bold text-white">
                {brand.name?.charAt(0)?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{brand.name}</h1>
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-semibold",
                  brand.onboarded
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                )}>
                  {brand.onboarded ? "Brain Active" : "Setup Needed"}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                {brand.description || "No description yet. Click Edit to add one."}
              </p>
              {brand.industry && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{brand.industry}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!editing ? (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-sm font-medium border border-border bg-background hover:bg-accent px-4 py-2 rounded-xl transition"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit brand
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-astra-500 hover:bg-astra-600 text-white px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 text-sm font-medium border border-border bg-background hover:bg-accent px-4 py-2 rounded-xl transition"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Brand name", placeholder: "e.g. Astra Intelligence" },
              { key: "website_url", label: "Website URL", placeholder: "https://yourbrand.com" },
              { key: "industry", label: "Industry", placeholder: "e.g. AI · SaaS · FinTech" },
              { key: "tone_of_voice", label: "Tone of voice", placeholder: "e.g. professional, bold, friendly" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                <input
                  value={editFields[key] ?? ""}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
              <textarea
                value={editFields.description ?? ""}
                onChange={(e) => setEditFields((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="What does your company do? Who are your customers?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mission</label>
              <textarea
                value={editFields.mission ?? ""}
                onChange={(e) => setEditFields((prev) => ({ ...prev, mission: e.target.value }))}
                rows={2}
                placeholder="What is your company's mission?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-astra-500/40 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Brain Health Score */}
        <div className="bg-card border border-border rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Health Score</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className={cn("text-3xl font-bold", scoreColor)}>{score}</span>
            <span className="text-sm text-muted-foreground mb-1">/100</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className={cn("h-1.5 rounded-full transition-all", scoreBg)} style={{ width: `${score}%` }} />
          </div>
        </div>

        {[
          { label: "Documents", value: indexedDocs.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Keywords", value: brand.keywords?.length ?? 0, icon: Tag, color: "text-purple-600", bg: "bg-purple-500/10" },
          { label: "Hashtags", value: brand.hashtags?.length ?? 0, icon: Hash, color: "text-pink-600", bg: "bg-pink-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.bg)}>
                <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Health reasons ─────────────────────────────────────────────────────── */}
      {(health?.reasons?.length ?? 0) > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Brain health factors
          </p>
          <div className="flex flex-wrap gap-2">
            {(health?.reasons ?? []).map((r: string) => (
              <span key={r} className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Brand Profile Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Globe, label: "Website", value: brand.website_url, href: brand.website_url },
          { icon: Mic2, label: "Tone of voice", value: brand.tone_of_voice },
          { icon: Building2, label: "Industry", value: brand.industry },
          { icon: Target, label: "Mission", value: brand.mission },
          { icon: Users, label: "Target audience", value: typeof brand.target_audience === "string" ? brand.target_audience : brand.target_audience ? JSON.stringify(brand.target_audience) : null },
        ]
          .filter((item) => item.value)
          .map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-2xl p-4 hover:border-border/80 transition">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</span>
              </div>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-astra-500 hover:text-astra-600 transition truncate block"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-sm font-medium text-foreground line-clamp-2">{item.value}</p>
              )}
            </div>
          ))}

        {/* Keywords */}
        {brand.keywords && brand.keywords.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {brand.keywords.slice(0, 8).map((k) => (
                <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 font-medium">{k}</span>
              ))}
              {brand.keywords.length > 8 && (
                <span className="text-xs text-muted-foreground">+{brand.keywords.length - 8} more</span>
              )}
            </div>
          </div>
        )}

        {/* Hashtags */}
        {brand.hashtags && brand.hashtags.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Hash className="w-3.5 h-3.5 text-pink-600" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand Hashtags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {brand.hashtags.slice(0, 8).map((h) => (
                <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-700 font-medium">{h}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Section Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === "knowledge" && indexedDocs.length > 0 && (
              <span className="bg-astra-500/15 text-astra-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {indexedDocs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-astra-500" />
            <h2 className="text-base font-bold text-foreground">Brand Intelligence Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Brand Overview</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">Name:</span> {brand.name}</p>
                {brand.description && <p><span className="font-semibold text-foreground">About:</span> {brand.description}</p>}
                {brand.mission && <p><span className="font-semibold text-foreground">Mission:</span> {brand.mission}</p>}
                {brand.tone_of_voice && <p><span className="font-semibold text-foreground">Tone:</span> {brand.tone_of_voice}</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">AI Readiness</p>
              <div className="space-y-2.5">
                {[
                  { label: "Brand profile", done: !!brand.description },
                  { label: "Tone of voice", done: !!brand.tone_of_voice },
                  { label: "Industry set", done: !!brand.industry },
                  { label: "Knowledge base", done: indexedDocs.length > 0 },
                  { label: "Keywords defined", done: (brand.keywords?.length ?? 0) > 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center",
                      item.done ? "bg-emerald-500/20" : "bg-muted"
                    )}>
                      {item.done
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        : <XCircle className="w-3 h-3 text-muted-foreground" />
                      }
                    </div>
                    <span className={cn("text-xs", item.done ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "knowledge" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-astra-500" />
              <h2 className="text-base font-bold text-foreground">Knowledge Base</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Upload documents, PDFs, and websites. Claude reads everything you add and uses it when generating content.
            </p>
            <KnowledgeUploader brandId={brandId} />
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-astra-500" />
              <h2 className="text-base font-bold text-foreground">Ask your documents</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Ask Claude anything about your uploaded documents. Answers are grounded strictly in your knowledge base.
            </p>
            {indexedDocs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-foreground">No documents indexed yet</p>
                <p className="text-sm mt-1">Go to Knowledge Base tab and upload a document first.</p>
                <button
                  onClick={() => setActiveTab("knowledge")}
                  className="mt-3 flex items-center gap-1 text-sm text-astra-500 hover:text-astra-600 font-medium mx-auto transition"
                >
                  Upload documents <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <KnowledgeChat brandId={brandId} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
