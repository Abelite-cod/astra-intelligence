"use client";

import { useBrand, useBrandHealthScore } from "@/hooks/use-brand";
import { KnowledgeUploader } from "@/components/brand/knowledge-uploader";
import { KnowledgeChat } from "@/components/brand/knowledge-chat";
import { Brain, BarChart2, Globe, Mic2, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandPageProps {
  params: { brandId: string };
}

export default function BrandDetailPage({ params }: BrandPageProps) {
  const { brandId } = params;
  const { data: brand, isLoading } = useBrand(brandId);
  const { data: health } = useBrandHealthScore(brandId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-8 text-center text-muted-foreground">Brand not found.</div>
    );
  }

  const score = health?.score ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-astra-500/10 flex items-center justify-center shrink-0">
          <Brain className="w-6 h-6 text-astra-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{brand.name}</h1>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                brand.onboarded
                  ? "bg-green-500/10 text-green-600"
                  : "bg-yellow-500/10 text-yellow-600"
              )}
            >
              {brand.onboarded ? "Brain Active" : "Setup Needed"}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {brand.description || "No description yet."}
          </p>
        </div>
      </div>

      {/* Brain Health Score */}
      {health && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Brain Health Score</span>
            </div>
            <span
              className={cn(
                "text-2xl font-bold",
                score >= 70 ? "text-green-500" : score >= 40 ? "text-yellow-500" : "text-red-500"
              )}
            >
              {score}/100
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-3">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${score}%` }}
            />
          </div>
          {health.reasons?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {health.reasons.map((r: string) => (
                <span key={r} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-green-500" /> {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brand details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Globe, label: "Website", value: brand.website_url || "—" },
          { icon: Mic2, label: "Tone of voice", value: brand.tone_of_voice || "—" },
          { icon: Brain, label: "Industry", value: brand.industry || "—" },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Knowledge Base */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload documents, PDFs, and websites. Your AI learns from everything you add.
        </p>
        <KnowledgeUploader brandId={brandId} />
      </div>

      {/* Chat with documents */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Ask your documents</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Ask questions about any uploaded document. The AI reads your files and answers from the content.
        </p>
        <KnowledgeChat brandId={brandId} />
      </div>
    </div>
  );
}
