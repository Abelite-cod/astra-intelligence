"use client";

import { useState } from "react";
import { Search, Loader2, BookOpen } from "lucide-react";
import { useKnowledgeSearch, type SearchResult } from "@/hooks/use-brand";
import { cn } from "@/lib/utils";

interface KnowledgeSearchProps {
  brandId: string;
}

export function KnowledgeSearch({ brandId }: KnowledgeSearchProps) {
  const [query, setQuery] = useState("");
  const search = useKnowledgeSearch(brandId);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    search.mutate(query);
  }

  const results: SearchResult[] = search.data?.results ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#524D47]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your brand knowledge…"
            className="w-full h-10 pl-9 pr-4 rounded-sm border border-[#3A3530] bg-[#161310] text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={search.isPending || !query.trim()}
          className="flex items-center gap-2 bg-[#C8843A] hover:bg-[#DE913A] text-[#0D0B09] text-sm font-medium px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
        >
          {search.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[#524D47]">
            {results.length} results for &ldquo;{search.data?.query}&rdquo;
          </p>
          {results.map((result, i) => (
            <div
              key={i}
              className="p-4 rounded-sm border border-[#2A2520] bg-[#161310]"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#524D47] shrink-0" />
                  <span className="text-xs text-[#524D47]">
                    Source {i + 1}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-sm border",
                    result.score > 0.8
                      ? "bg-[#1A2420] text-emerald-400 border-emerald-500/20"
                      : result.score > 0.5
                      ? "bg-[#1F1B17] text-[#C8843A] border-[#C8843A]/20"
                      : "bg-[#1F1B17] text-[#6E6860] border-[#2A2520]"
                  )}
                >
                  {Math.round(result.score * 100)}% match
                </span>
              </div>
              <p className="text-sm text-[#B8B2A9] leading-relaxed line-clamp-4">
                {result.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {search.isSuccess && results.length === 0 && (
        <p className="text-sm text-[#524D47] text-center py-6">
          No relevant content found. Try uploading more documents.
        </p>
      )}
    </div>
  );
}
