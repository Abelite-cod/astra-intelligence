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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your brand knowledge…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={search.isPending || !query.trim()}
          className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
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
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {results.length} results for &ldquo;{search.data?.query}&rdquo;
          </p>
          {results.map((result, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Source {i + 1}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    result.score > 0.8
                      ? "bg-green-500/10 text-green-600"
                      : result.score > 0.5
                      ? "bg-yellow-500/10 text-yellow-600"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {Math.round(result.score * 100)}% match
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                {result.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {search.isSuccess && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No relevant content found. Try uploading more documents.
        </p>
      )}
    </div>
  );
}
