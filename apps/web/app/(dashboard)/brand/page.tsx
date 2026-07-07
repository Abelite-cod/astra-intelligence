"use client";

import { useBrands } from "@/hooks/use-brand";
import { BrandSetupWizard } from "@/components/brand/brand-setup-wizard";
import { Brain, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export default function BrandPage() {
  const { data: brands = [], isLoading } = useBrands();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No brands yet — show setup wizard
  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-astra-500/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-astra-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Set up your Brand Brain</h1>
          <p className="text-muted-foreground">
            Your AI learns everything about your company and never forgets.
          </p>
        </div>
        <BrandSetupWizard />
      </div>
    );
  }

  // Has brands — show brand list
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brand Brain</h1>
          <p className="text-muted-foreground mt-1">
            Your AI&apos;s permanent knowledge base for each brand.
          </p>
        </div>
        <Link
          href="/brand/new"
          className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New brand
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brand/${brand.id}`}
            className="group p-5 rounded-xl border border-border bg-card hover:border-astra-500/50 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-astra-500/10 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-astra-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-astra-600 transition truncate">
                  {brand.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {brand.industry || "No industry set"}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                  brand.onboarded
                    ? "bg-green-500/10 text-green-600"
                    : "bg-yellow-500/10 text-yellow-600"
                )}
              >
                {brand.onboarded ? "Active" : "Setup needed"}
              </span>
            </div>

            {brand.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {brand.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Created {formatDate(brand.created_at)}</span>
              <span className="text-astra-500 group-hover:underline">Open →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
