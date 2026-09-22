"use client";

import { useBrands } from "@/hooks/use-brand";
import { BrandSetupWizard } from "@/components/brand/brand-setup-wizard";
import { Brain, Loader2, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export default function BrandPage() {
  const { data: brands = [], isLoading } = useBrands();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-5 h-5 border-2 border-[#C8843A] border-t-transparent rounded-full" />
      </div>
    );
  }

  // No brands yet — show setup wizard
  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-3xl">
        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-[#2A2520]">
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">Brand Brain</h1>
          <p className="mt-1 text-sm text-[#928C83]">
            Your AI&apos;s permanent knowledge base for each brand.
          </p>
        </div>

        {/* Empty state intro */}
        <div className="border border-[#2A2520] border-dashed rounded-sm p-12 text-center mb-8">
          <p className="text-sm font-medium text-[#6E6860]">No brands set up yet</p>
          <p className="text-xs text-[#524D47] mt-1 mb-6">Complete the setup wizard below to train your first Brand Brain.</p>
        </div>

        <BrandSetupWizard />
      </div>
    );
  }

  // Has brands — show brand list
  return (
    <div className="p-8 max-w-4xl">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-[#2A2520] flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5F2EE] tracking-tight">Brand Brain</h1>
          <p className="mt-1 text-sm text-[#928C83]">
            Your AI&apos;s permanent knowledge base for each brand.
          </p>
        </div>
        <Link
          href="/brand/new"
          className="flex items-center gap-2 bg-[#C8843A] text-[#0D0B09] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#DE913A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New brand
        </Link>
      </div>

      {/* Brand list */}
      <div className="border border-[#2A2520] rounded-sm divide-y divide-[#1F1B17]">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brand/${brand.id}`}
            className="flex items-center justify-between px-4 py-4 hover:bg-[#161310] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#1F1B17] border border-[#2A2520] flex items-center justify-center text-[#B8B2A9] font-medium text-sm shrink-0">
                {brand.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#F5F2EE]">{brand.name}</p>
                <p className="text-xs text-[#6E6860] mt-0.5">
                  {brand.industry || "No industry set"}{brand.description ? ` · ${brand.description.slice(0, 60)}${brand.description.length > 60 ? "…" : ""}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-[#524D47] hidden sm:block">
                Created {formatDate(brand.created_at)}
              </span>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] rounded-sm border",
                brand.onboarded
                  ? "bg-[#0E2A1A] text-[#4D9A6A] border-[#1E4D30]"
                  : "bg-[#2A1E08] text-[#C8943A] border-[#4D3810]"
              )}>
                {brand.onboarded ? "Active" : "Setup needed"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#3A3530]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
