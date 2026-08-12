"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBrands } from "@/hooks/use-brand";
import {
  useSocialAccounts,
  useDisconnectAccount,
  usePublishContent,
  useScheduledPosts,
} from "@/hooks/use-publishing";
import { useContentList } from "@/hooks/use-content";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  Twitter, Linkedin, Send, CheckCircle2, XCircle,
  Loader2, Link2, Unlink, ChevronDown, Clock, ExternalLink,
  Zap
} from "lucide-react";
import { toast } from "sonner";

const PLATFORM_CONFIG = {
  twitter: {
    icon: Twitter,
    label: "Twitter / X",
    color: "text-[#1DA1F2]",
    bg: "bg-[#1DA1F2]/10",
    border: "border-[#1DA1F2]/30",
    connectHref: (brandId: string) => `/api/auth/twitter?brand_id=${brandId}`,
  },
  linkedin: {
    icon: Linkedin,
    label: "LinkedIn",
    color: "text-[#0077B5]",
    bg: "bg-[#0077B5]/10",
    border: "border-[#0077B5]/30",
    connectHref: (brandId: string) => `/api/auth/linkedin?brand_id=${brandId}`,
  },
};

function PublishPageInner() {
  const searchParams = useSearchParams();
  const { data: brands = [] } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState("");

  const activeBrandId = selectedBrandId || brands[0]?.id || "";

  const { data: accounts = [] } = useSocialAccounts(activeBrandId);
  const { data: contentList = [] } = useContentList(activeBrandId);
  const { data: scheduledPosts = [] } = useScheduledPosts(activeBrandId);
  const disconnectMutation = useDisconnectAccount(activeBrandId);
  const publishMutation = usePublishContent(activeBrandId);

  // Only show approved content that hasn't been published yet
  const approvedContent = contentList.filter(
    (c) => c.status === "approved"
  );

  const connectedPlatforms = accounts.map((a) => a.platform);

  function getAccount(platform: string) {
    return accounts.find((a) => a.platform === platform);
  }

  async function handlePublish(contentId: string, platform: string) {
    toast.promise(
      publishMutation.mutateAsync({ contentId, platforms: [platform] }),
      {
        loading: `Publishing to ${platform}…`,
        success: (res) => {
          const result = res.results[0];
          return result.status === "published"
            ? `Published to ${platform}! Post ID: ${result.post_id}`
            : `Failed: ${result.error}`;
        },
        error: (e) => e.message,
      }
    );
  }

  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Publish</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect your social accounts and publish approved content with one click.
          </p>
        </div>
        {brands.length > 1 && (
          <div className="relative">
            <select
              value={activeBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* Connection success/error banners */}
      {connected && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-6 text-green-600 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Successfully connected {connected === "twitter" ? "Twitter / X" : "LinkedIn"}!</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-600 text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Connection failed: {error.replace(/_/g, " ")}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Connected accounts */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Connected accounts</h2>

          {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
            const account = getAccount(platform);
            const Icon = config.icon;

            return (
              <div
                key={platform}
                className={cn(
                  "rounded-xl border p-4",
                  account ? cn(config.bg, config.border) : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    account ? config.bg : "bg-muted"
                  )}>
                    <Icon className={cn("w-5 h-5", account ? config.color : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{config.label}</p>
                    {account && (
                      <p className={cn("text-xs font-medium", config.color)}>
                        {account.account_name}
                      </p>
                    )}
                  </div>
                </div>

                {account ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                    <button
                      onClick={() => {
                        toast.promise(disconnectMutation.mutateAsync(account.id), {
                          loading: "Disconnecting…",
                          success: `${config.label} disconnected`,
                          error: "Failed to disconnect",
                        });
                      }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition"
                    >
                      <Unlink className="w-3 h-3" /> Disconnect
                    </button>
                  </div>
                ) : (
                  <a
                    href={activeBrandId ? config.connectHref(activeBrandId) : "#"}
                    className={cn(
                      "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition",
                      "border border-current",
                      config.color,
                      !activeBrandId && "opacity-50 pointer-events-none"
                    )}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Connect {config.label}
                  </a>
                )}
              </div>
            );
          })}

          {/* Setup instructions */}
          {accounts.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <p className="font-semibold mb-1">Setup required</p>
              <p>To connect social accounts, add your OAuth app credentials to .env.local:</p>
              <code className="block mt-2 font-mono bg-amber-100 rounded p-2 text-amber-900 whitespace-pre">{`TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</code>
            </div>
          )}
        </div>

        {/* Right: Approved content + history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Approved content ready to publish */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Ready to publish
              {approvedContent.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({approvedContent.length} approved)
                </span>
              )}
            </h2>

            {approvedContent.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No approved content yet.</p>
                <p className="text-xs mt-1">Go to Content → approve posts → they appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedContent.map((item) => {
                  const platformConfig = PLATFORM_CONFIG[item.platform as keyof typeof PLATFORM_CONFIG];
                  const account = getAccount(item.platform);
                  const isConnected = !!account;
                  const Icon = platformConfig?.icon ?? Zap;

                  return (
                    <div key={item.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          platformConfig?.bg ?? "bg-muted"
                        )}>
                          <Icon className={cn("w-4 h-4", platformConfig?.color ?? "text-muted-foreground")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground capitalize">
                              {item.platform}
                            </span>
                            <span className="text-xs bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-medium">
                              approved
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.body}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        {isConnected ? (
                          <button
                            onClick={() => handlePublish(item.id, item.platform)}
                            disabled={publishMutation.isPending}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              item.platform === "twitter"
                                ? "bg-[#1DA1F2] hover:bg-[#1a91da]"
                                : "bg-[#0077B5] hover:bg-[#006699]"
                            )}
                            style={{
                              background: item.platform === "twitter" ? "#1DA1F2" : "#0077B5"
                            }}
                          >
                            {publishMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Publish now
                          </button>
                        ) : (
                          <a
                            href={activeBrandId ? platformConfig?.connectHref(activeBrandId) ?? "#" : "#"}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            Connect {platformConfig?.label ?? item.platform} to publish
                          </a>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Published history */}
          {scheduledPosts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Publish history
              </h2>
              <div className="space-y-2">
                {scheduledPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-sm">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      post.status === "published" ? "bg-green-500" :
                      post.status === "failed" ? "bg-red-500" :
                      "bg-yellow-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground capitalize">
                        {post.platform}
                        {post.error_message && (
                          <span className="text-xs text-red-500 font-normal ml-2">— {post.error_message}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.status === "published" ? `Published ${formatRelativeTime(post.published_at ?? post.scheduled_at)}` : post.status}
                      </p>
                    </div>
                    {post.platform_post_id && post.platform === "twitter" && (
                      <a
                        href={`https://twitter.com/i/web/status/${post.platform_post_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium shrink-0",
                      post.status === "published" ? "bg-green-500/10 text-green-600" :
                      post.status === "failed" ? "bg-red-500/10 text-red-500" :
                      "bg-yellow-500/10 text-yellow-600"
                    )}>
                      {post.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublishPage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-astra-500 border-t-transparent rounded-full" /></div>}>
      <PublishPageInner />
    </Suspense>
  );
}
