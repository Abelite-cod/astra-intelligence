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
  { id: "chat", label: "Ask ASTRA", icon: MessageSquare },
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
        <div className="animate-spin w-5 h-5 border-2 border-[#C8843A] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!brand) {
    return <div className="p-8 text-sm text-[#6E6860]">Brand not found.</div>;
  }

  const score = health?.score ?? 0;
  const scoreColor = score >= 70 ? "text-[#3D7A5A]" : score >= 40 ? "text-[#C8843A]" : "text-[#8A3030]";
  const scoreBg = score >= 70 ? "bg-[#3D7A5A]" : score >= 40 ? "bg-[#C8843A]" : "bg-[#8A3030]";
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
    <div className="p-8 max-w-6xl">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-8 pb-6 border-b border-[#2A2520]">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center text-[#B8B2A9] font-semibold text-lg shrink-0">
              {brand.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">{brand.name}</h1>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] rounded-sm border",
                  brand.onboarded
                    ? "bg-[#0E2A1A] text-[#4D9A6A] border-[#1E4D30]"
                    : "bg-[#2A1E08] text-[#C8943A] border-[#4D3810]"
                )}>
                  {brand.onboarded ? "Brain Active" : "Setup Needed"}
                </span>
              </div>
              <p className="text-sm text-[#928C83] max-w-2xl">
                {brand.description || "No description yet. Click Edit to add one."}
              </p>
              {brand.industry && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#6E6860]" />
                  <span className="text-xs text-[#6E6860]">{brand.industry}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!editing ? (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-sm font-medium border border-[#3A3530] text-[#B8B2A9] px-4 py-2 rounded-sm hover:border-[#524D47] hover:text-[#F5F2EE] bg-transparent transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit brand
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 text-sm font-medium bg-[#C8843A] text-[#0D0B09] px-4 py-2 rounded-sm hover:bg-[#DE913A] transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? <div className="w-3.5 h-3.5 border-2 border-[#0D0B09] border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 text-sm font-medium border border-[#3A3530] text-[#B8B2A9] px-4 py-2 rounded-sm hover:border-[#524D47] hover:text-[#F5F2EE] bg-transparent transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mt-6 pt-6 border-t border-[#2A2520] grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Brand name", placeholder: "e.g. Astra Intelligence" },
              { key: "website_url", label: "Website URL", placeholder: "https://yourbrand.com" },
              { key: "industry", label: "Industry", placeholder: "e.g. AI · SaaS · FinTech" },
              { key: "tone_of_voice", label: "Tone of voice", placeholder: "e.g. professional, bold, friendly" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[#6E6860] mb-1.5">{label}</label>
                <input
                  value={editFields[key] ?? ""}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full h-9 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#6E6860] mb-1.5">Description</label>
              <textarea
                value={editFields.description ?? ""}
                onChange={(e) => setEditFields((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="What does your company do? Who are your customers?"
                className="w-full px-3 py-2 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#6E6860] mb-1.5">Mission</label>
              <textarea
                value={editFields.mission ?? ""}
                onChange={(e) => setEditFields((prev) => ({ ...prev, mission: e.target.value }))}
                rows={2}
                placeholder="What is your company's mission?"
                className="w-full px-3 py-2 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2A2520] border border-[#2A2520] rounded-sm mb-8">
        {/* Brain Health Score */}
        <div className="p-6">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Health Score</p>
          <div className="flex items-end gap-1.5 mb-2">
            <span className={cn("text-3xl font-semibold tracking-tight", scoreColor)}>{score}</span>
            <span className="text-sm text-[#6E6860] mb-1">/100</span>
          </div>
          <div className="w-full bg-[#1F1B17] rounded-full h-1">
            <div className={cn("h-1 rounded-full transition-all", scoreBg)} style={{ width: `${score}%` }} />
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Documents</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{indexedDocs.length}</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Keywords</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{brand.keywords?.length ?? 0}</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-1">Hashtags</p>
          <p className="text-3xl font-semibold text-[#F5F2EE] tracking-tight">{brand.hashtags?.length ?? 0}</p>
        </div>
      </div>

      {/* ── Health reasons ─────────────────────────────────────────────────── */}
      {(health?.reasons?.length ?? 0) > 0 && (
        <div className="border border-[#1E4D30] bg-[#0E2A1A] rounded-sm p-4 mb-8">
          <p className="text-xs font-medium text-[#3D7A5A] mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Brain health factors
          </p>
          <div className="flex flex-wrap gap-2">
            {(health?.reasons ?? []).map((r: string) => (
              <span key={r} className="flex items-center gap-1 text-xs text-[#4D9A6A] border border-[#1E4D30] px-2.5 py-1 rounded-sm">
                <CheckCircle2 className="w-3 h-3" /> {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Brand profile definition list ─────────────────────────────────── */}
      {[
        { icon: Globe, label: "Website", value: brand.website_url, href: brand.website_url },
        { icon: Mic2, label: "Tone of voice", value: brand.tone_of_voice },
        { icon: Building2, label: "Industry", value: brand.industry },
        { icon: Target, label: "Mission", value: brand.mission },
        { icon: Users, label: "Target audience", value: typeof brand.target_audience === "string" ? brand.target_audience : brand.target_audience ? JSON.stringify(brand.target_audience) : null },
      ].filter((item) => item.value).length > 0 && (
        <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17] mb-8">
          {[
            { icon: Globe, label: "Website", value: brand.website_url, href: brand.website_url },
            { icon: Mic2, label: "Tone of voice", value: brand.tone_of_voice },
            { icon: Building2, label: "Industry", value: brand.industry },
            { icon: Target, label: "Mission", value: brand.mission },
            { icon: Users, label: "Target audience", value: typeof brand.target_audience === "string" ? brand.target_audience : brand.target_audience ? JSON.stringify(brand.target_audience) : null },
          ]
            .filter((item) => item.value)
            .map((item) => (
              <div key={item.label} className="flex items-start gap-6 px-4 py-3">
                <div className="flex items-center gap-2 w-36 shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-[#524D47] shrink-0" />
                  <span className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em]">{item.label}</span>
                </div>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#C8843A] hover:text-[#DE913A] transition-colors"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm text-[#F5F2EE]">{item.value}</p>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Keywords + Hashtags */}
      {((brand.keywords && brand.keywords.length > 0) || (brand.hashtags && brand.hashtags.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {brand.keywords && brand.keywords.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-3">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {brand.keywords.slice(0, 8).map((k) => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-sm border border-[#2A2520] text-[#B8B2A9]">{k}</span>
                ))}
                {brand.keywords.length > 8 && (
                  <span className="text-xs text-[#6E6860]">+{brand.keywords.length - 8} more</span>
                )}
              </div>
            </div>
          )}
          {brand.hashtags && brand.hashtags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-3">Brand Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {brand.hashtags.slice(0, 8).map((h) => (
                  <span key={h} className="text-xs px-2 py-0.5 rounded-sm border border-[#2A2520] text-[#B8B2A9]">{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section tabs ───────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#2A2520] mb-6 gap-6">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 transition-colors",
              activeTab === tab.id
                ? "text-[#F5F2EE] border-[#C8843A]"
                : "text-[#6E6860] border-transparent hover:text-[#B8B2A9]"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === "knowledge" && indexedDocs.length > 0 && (
              <span className="text-[10px] font-medium text-[#6E6860] bg-[#1F1B17] border border-[#2A2520] px-1.5 py-0.5 rounded-sm">
                {indexedDocs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="border border-[#2A2520] rounded-sm p-6 space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#6E6860]" />
            <h2 className="text-base font-medium text-[#F5F2EE]">Brand Intelligence Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-4">Brand Overview</p>
              <div className="space-y-3">
                {[
                  { label: "Name", value: brand.name },
                  brand.description ? { label: "About", value: brand.description } : null,
                  brand.mission ? { label: "Mission", value: brand.mission } : null,
                  brand.tone_of_voice ? { label: "Tone", value: brand.tone_of_voice } : null,
                ].filter(Boolean).map((item) => item && (
                  <div key={item.label} className="flex gap-3 border-b border-[#1F1B17] pb-3">
                    <span className="text-xs text-[#6E6860] w-16 shrink-0 pt-0.5">{item.label}</span>
                    <span className="text-sm text-[#F5F2EE]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6E6860] uppercase tracking-[0.06em] mb-4">ASTRA Readiness</p>
              <div className="space-y-2.5">
                {[
                  { label: "Brand profile", done: !!brand.description },
                  { label: "Tone of voice", done: !!brand.tone_of_voice },
                  { label: "Industry set", done: !!brand.industry },
                  { label: "Knowledge base", done: indexedDocs.length > 0 },
                  { label: "Keywords defined", done: (brand.keywords?.length ?? 0) > 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    {item.done
                      ? <CheckCircle2 className="w-4 h-4 text-[#3D7A5A] shrink-0" />
                      : <XCircle className="w-4 h-4 text-[#3A3530] shrink-0" />
                    }
                    <span className={cn("text-sm", item.done ? "text-[#F5F2EE]" : "text-[#6E6860]")}>
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
        <div className="border border-[#2A2520] rounded-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-[#6E6860]" />
            <h2 className="text-base font-medium text-[#F5F2EE]">Knowledge Base</h2>
          </div>
          <p className="text-sm text-[#6E6860] mb-6">
            Upload documents, PDFs, and websites. ASTRA reads everything you add and uses it when generating content.
          </p>
          <KnowledgeUploader brandId={brandId} />
        </div>
      )}

      {activeTab === "chat" && (
        <div className="border border-[#2A2520] rounded-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-[#6E6860]" />
            <h2 className="text-base font-medium text-[#F5F2EE]">Ask your documents</h2>
          </div>
          <p className="text-sm text-[#6E6860] mb-6">
            Ask ASTRA anything about your uploaded documents. Answers are grounded strictly in your knowledge base.
          </p>
          {indexedDocs.length === 0 ? (
            <div className="border border-[#2A2520] border-dashed rounded-sm p-12 text-center">
              <p className="text-sm font-medium text-[#6E6860]">No documents indexed yet</p>
              <p className="text-xs text-[#524D47] mt-1 mb-4">Go to Knowledge Base tab and upload a document first.</p>
              <button
                onClick={() => setActiveTab("knowledge")}
                className="flex items-center gap-1 text-sm text-[#C8843A] hover:text-[#DE913A] font-medium mx-auto transition-colors"
              >
                Upload documents <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <KnowledgeChat brandId={brandId} />
          )}
        </div>
      )}
    </div>
  );
}
