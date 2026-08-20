"use client";

import { useState } from "react";
import { useBrands } from "@/hooks/use-brand";
import {
  useGenerateTikTok, useTikTokMemory, useAnalyzeTikTokPosts,
  useTikTokRespondQueue, useAddToRespondQueue
} from "@/hooks/use-tiktok";
import { useContentList } from "@/hooks/use-content";
import { TikTokMemoryPanel } from "@/components/tiktok/tiktok-memory-panel";
import { TikTokContentCard } from "@/components/tiktok/tiktok-content-card";
import { cn } from "@/lib/utils";
import {
  Music2, Sparkles, Loader2, ChevronDown, Brain, Upload,
  Play, Plus, Target, MessageSquare, ArrowRight, CheckCircle2,
  AlertCircle, Trash2, Info
} from "lucide-react";
import { toast } from "sonner";

type Tab = "strategy" | "import" | "patterns" | "respond";
type ImportMethod = "urls" | "text" | "manual";

export default function TikTokStudioPage() {
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("strategy");

  const activeBrandId = selectedBrandId || brands[0]?.id || "";

  const { data: patterns = [] } = useTikTokMemory(activeBrandId);
  const { data: contentList = [] } = useContentList(activeBrandId);
  const { data: respondQueue = [] } = useTikTokRespondQueue(activeBrandId);

  const generateMutation = useGenerateTikTok(activeBrandId);
  const analyzeMutation = useAnalyzeTikTokPosts(activeBrandId);
  const addToQueueMutation = useAddToRespondQueue(activeBrandId);

  // TikTok content only
  const tiktokContent = contentList.filter((c) => c.platform === "tiktok").slice(0, 5);

  // Strategy tab state
  const [brief, setBrief] = useState("");

  // Import tab state
  const [importMethod, setImportMethod] = useState<ImportMethod>("text");
  const [importText, setImportText] = useState("");
  const [manualText, setManualText] = useState("");

  // Respond tab state
  const [originalUrl, setOriginalUrl] = useState("");
  const [responseType, setResponseType] = useState<"duet" | "stitch">("stitch");
  const [responseAngle, setResponseAngle] = useState("agree_and_add");
  const [userContext, setUserContext] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!brief.trim() || !activeBrandId) return;
    toast.promise(
      generateMutation.mutateAsync({ brief }),
      {
        loading: "Claude is writing your TikTok script…",
        success: "TikTok script created ✓ — check Content Library",
        error: (e) => e.message,
      }
    );
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const posts: Array<Record<string, string>> = [];

    if (importMethod === "text") {
      // Parse pasted text — each post separated by "---" or double newline
      const chunks = importText.split(/\n---\n|\n\n/).filter((c) => c.trim());
      chunks.forEach((chunk) => {
        const lines = chunk.split("\n");
        const post: Record<string, string> = {};
        lines.forEach((line) => {
          if (line.startsWith("Views:")) post.views = line.replace("Views:", "").trim();
          else if (line.startsWith("Likes:")) post.likes = line.replace("Likes:", "").trim();
          else if (line.startsWith("Comments:")) post.comments = line.replace("Comments:", "").trim();
          else if (line.startsWith("Shares:")) post.shares = line.replace("Shares:", "").trim();
          else post.caption = (post.caption ? post.caption + "\n" : "") + line;
        });
        if (post.caption) posts.push(post);
      });
    } else if (importMethod === "manual") {
      posts.push({ caption: manualText });
    }

    if (!posts.length) {
      toast.error("No posts found to analyze. Check your format.");
      return;
    }

    toast.promise(
      analyzeMutation.mutateAsync({ posts, import_method: importMethod }),
      {
        loading: `Claude is analyzing ${posts.length} posts…`,
        success: (res) => `${res.patterns_created} patterns extracted ✓`,
        error: (e) => e.message,
      }
    );
  }

  async function handleAddToQueue(e: React.FormEvent) {
    e.preventDefault();
    if (!originalUrl.trim()) return;
    toast.promise(
      addToQueueMutation.mutateAsync({
        original_url: originalUrl,
        response_type: responseType,
        response_angle: responseAngle,
        user_context: userContext || undefined,
      }).then(() => {
        setOriginalUrl("");
        setUserContext("");
      }),
      {
        loading: "Adding to queue…",
        success: "Added to respond queue ✓",
        error: (e) => e.message,
      }
    );
  }

  async function handleGenerateResponse(item: { original_url: string; response_type: string; response_angle?: string }) {
    toast.promise(
      generateMutation.mutateAsync({
        brief: `Respond to this TikTok video`,
        response_type: item.response_type,
        original_url: item.original_url,
        response_angle: item.response_angle,
      }),
      {
        loading: "Generating response script…",
        success: "Response script created ✓",
        error: (e) => e.message,
      }
    );
  }

  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Set up Brand Brain first</h2>
        <p className="text-muted-foreground mb-4">TikTok Studio needs your brand context to work.</p>
        <a href="/brand" className="inline-flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm">
          Set up Brand Brain <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EE1D52]/20 to-[#69C9D0]/20 flex items-center justify-center">
            <Music2 className="w-6 h-6 text-[#EE1D52]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">TikTok Studio</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              TikTok-native content generation with brand memory
            </p>
          </div>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit mb-6">
        {[
          { id: "strategy" as const, label: "Generate", icon: Sparkles },
          { id: "import" as const, label: "Import History", icon: Upload },
          { id: "patterns" as const, label: `Patterns (${patterns.length})`, icon: Brain },
          { id: "respond" as const, label: `Respond (${respondQueue.filter((r) => r.status !== "published").length})`, icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ STRATEGY TAB ═══ */}
      {activeTab === "strategy" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  TikTok content brief
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={4}
                  placeholder="What do you want to create a TikTok about? Be specific — 'Show how Astra generates a 30-day campaign in 60 seconds'"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#EE1D52]/30 resize-none"
                />
              </div>

              {patterns.length > 0 && (
                <div className="bg-[#EE1D52]/5 border border-[#EE1D52]/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#EE1D52] mb-1">
                    <Brain className="w-3.5 h-3.5" /> {patterns.length} brand patterns active
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Claude will use your proven hooks, formats, and audience knowledge to make this TikTok-native.
                  </p>
                </div>
              )}

              {patterns.length === 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
                    <AlertCircle className="w-3.5 h-3.5" /> No brand memory yet
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Content will still be TikTok-native but not brand-specific. Import history to improve results.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={generateMutation.isPending || !brief.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm transition bg-gradient-to-r from-[#EE1D52] to-[#69C9D0] hover:from-[#d01947] hover:to-[#5bb8bf] disabled:opacity-50 shadow-lg"
              >
                {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generateMutation.isPending ? "Writing TikTok script…" : "Generate TikTok script"}
              </button>
            </form>
          </div>

          {/* Recent TikTok content */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Recent TikTok content</h2>
            {tiktokContent.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl text-muted-foreground text-sm gap-2">
                <Music2 className="w-8 h-8 opacity-30" />
                <p className="font-semibold">No TikTok content yet</p>
                <p className="text-xs">Generate your first TikTok script above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tiktokContent.map((item) => (
                  <TikTokContentCard key={item.id} item={item} />
                ))}
                {contentList.filter((c) => c.platform === "tiktok").length > 5 && (
                  <a href="/content" className="text-xs text-astra-500 hover:text-astra-600 font-semibold transition flex items-center gap-1">
                    View all TikTok content <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ IMPORT TAB ═══ */}
      {activeTab === "import" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-base font-bold text-foreground mb-1">Feed Astra your TikTok history</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Claude analyzes your past posts and extracts reusable patterns — hooks, formats, topics, CTAs. These improve every future generation.
            </p>

            {/* Import method selector */}
            <div className="flex gap-2 mb-5">
              {[
                { id: "text" as const, label: "Paste captions + stats" },
                { id: "manual" as const, label: "Write manually" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setImportMethod(m.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition",
                    importMethod === m.id
                      ? "bg-astra-500 text-white"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleImport} className="space-y-4">
              {importMethod === "text" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">
                    Paste your TikTok captions (with optional performance data)
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={10}
                    placeholder={`Post 1 caption text here — what did you say in the video?
Views: 45000
Likes: 3847
Comments: 412
Shares: 1203

---

Post 2 caption text here
Views: 12000
Likes: 890`}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate posts with <code className="bg-muted px-1 rounded">---</code> on its own line. Performance data is optional but improves pattern quality.
                  </p>
                </div>
              )}

              {importMethod === "manual" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">
                    Describe your TikTok style and what works for your brand
                  </label>
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    rows={6}
                    placeholder="Our best TikToks start with a provocative question like 'Why are you still doing X manually?'. We use 30-second videos with text overlays. Our audience is B2B founders who hate corporate language. Soft CTAs like 'link in bio' work much better than 'subscribe'."
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={analyzeMutation.isPending || (!importText.trim() && !manualText.trim())}
                className="flex items-center gap-2 bg-gradient-to-r from-astra-500 to-purple-500 hover:from-astra-600 hover:to-purple-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-astra-500/20 disabled:opacity-50"
              >
                {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {analyzeMutation.isPending ? "Claude is extracting patterns…" : "Extract patterns"}
              </button>
            </form>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 border border-border rounded-2xl p-5">
            <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Best content to import
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Your 10 best-performing videos", "A mix of high + low performers", "Videos from the last 90 days", "Any series that built momentum"].map((tip) => (
                <div key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-astra-500 shrink-0 mt-0.5" /> {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PATTERNS TAB ═══ */}
      {activeTab === "patterns" && (
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Brand TikTok Memory</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {patterns.length} patterns · Injected into every TikTok generation
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <Info className="w-3.5 h-3.5" />
              High confidence = used in generation
            </div>
          </div>
          <TikTokMemoryPanel brandId={activeBrandId} />
        </div>
      )}

      {/* ═══ RESPOND TAB ═══ */}
      {activeTab === "respond" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-1">Respond to a video</h2>
                <p className="text-xs text-muted-foreground">Turn trending content into growth opportunities for your brand.</p>
              </div>

              <form onSubmit={handleAddToQueue} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">TikTok video URL</label>
                  <input
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@creator/video/123..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Response type</label>
                  <div className="flex gap-2">
                    {["stitch", "duet"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setResponseType(type as "duet" | "stitch")}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition",
                          responseType === type
                            ? "bg-astra-500 text-white"
                            : "border border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {responseType === "stitch"
                      ? "Clip 1-5 seconds of the original as your setup, then respond"
                      : "Side-by-side split screen reacting to the original in real-time"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Response angle</label>
                  {[
                    { id: "agree_and_add", label: "Agree + add value", desc: "Validate their point, then add your layer" },
                    { id: "respectful_counter", label: "Respectful counter", desc: "Disagree with data/experience behind you" },
                    { id: "problem_solution", label: "Solve the problem", desc: "They describe a problem you solve" },
                    { id: "expert_expansion", label: "Expert expansion", desc: "Deep-dive on something they only touched" },
                  ].map((angle) => (
                    <button
                      key={angle.id}
                      type="button"
                      onClick={() => setResponseAngle(angle.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl border text-left mb-1.5 transition",
                        responseAngle === angle.id
                          ? "border-astra-500 bg-astra-500/5"
                          : "border-border hover:border-astra-500/40"
                      )}
                    >
                      <div className={cn("w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0",
                        responseAngle === angle.id ? "border-astra-500 bg-astra-500" : "border-muted-foreground"
                      )} />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{angle.label}</p>
                        <p className="text-xs text-muted-foreground">{angle.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Context (optional)</label>
                  <input
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    placeholder="e.g. This creator has 500K followers in our niche"
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addToQueueMutation.isPending || !originalUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-astra-500 hover:bg-astra-600 text-white text-sm font-bold transition disabled:opacity-50"
                >
                  {addToQueueMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add to queue
                </button>
              </form>
            </div>
          </div>

          {/* Queue */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold text-foreground mb-3">Response queue ({respondQueue.length})</h2>
            {respondQueue.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-foreground">No videos in queue</p>
                <p className="text-sm mt-1">Add a TikTok video URL to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {respondQueue.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-4 bg-card border border-border rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-foreground capitalize">{item.response_type}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground capitalize">{item.response_angle?.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.original_url}</p>
                      {item.original_creator && (
                        <p className="text-xs text-foreground font-medium">{item.original_creator}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-semibold capitalize",
                        item.status === "queued" ? "bg-amber-500/10 text-amber-600" :
                        item.status === "draft" ? "bg-blue-500/10 text-blue-600" :
                        item.status === "published" ? "bg-emerald-500/10 text-emerald-600" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {item.status}
                      </span>
                      {item.status === "queued" && (
                        <button
                          onClick={() => handleGenerateResponse(item)}
                          disabled={generateMutation.isPending}
                          className="text-xs font-semibold text-astra-500 hover:text-astra-600 transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> Generate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
