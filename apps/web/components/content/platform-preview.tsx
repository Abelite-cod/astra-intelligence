"use client";

import { cn } from "@/lib/utils";
import { Linkedin, Twitter, Instagram } from "lucide-react";

interface PlatformPreviewProps {
  platform: "linkedin" | "twitter" | "instagram";
  body: string;
  hook?: string;
  cta?: string;
  hashtags?: string[];
}

const PLATFORM_CONFIG = {
  linkedin: {
    icon: Linkedin,
    color: "text-[#0077B5]",
    bg: "bg-[#0077B5]/5 border-[#0077B5]/20",
    label: "LinkedIn",
    charLimit: 3000,
    avatar: "bg-[#0077B5]",
  },
  twitter: {
    icon: Twitter,
    color: "text-[#1DA1F2]",
    bg: "bg-[#1DA1F2]/5 border-[#1DA1F2]/20",
    label: "Twitter / X",
    charLimit: 280,
    avatar: "bg-[#1DA1F2]",
  },
  instagram: {
    icon: Instagram,
    color: "text-[#E1306C]",
    bg: "bg-[#E1306C]/5 border-[#E1306C]/20",
    label: "Instagram",
    charLimit: 2200,
    avatar: "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]",
  },
};

export function PlatformPreview({ platform, body, hook, cta, hashtags }: PlatformPreviewProps) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  const charCount = body.length;
  const isOverLimit = charCount > config.charLimit;

  return (
    <div className={cn("rounded-xl border p-4", config.bg)}>
      {/* Platform header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.avatar)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className={cn("font-semibold text-sm", config.color)}>{config.label}</span>
        <span className={cn(
          "ml-auto text-xs font-mono",
          isOverLimit ? "text-red-500" : "text-muted-foreground"
        )}>
          {charCount}/{config.charLimit}
        </span>
      </div>

      {/* Mock social card */}
      <div className="bg-background border border-border rounded-lg p-4 space-y-2">
        {/* User row */}
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-full", config.avatar)} />
          <div>
            <p className="text-sm font-semibold text-foreground">Your Brand</p>
            <p className="text-xs text-muted-foreground">Just now</p>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {body}
        </div>

        {/* Hashtags */}
        {hashtags && hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {hashtags.map((tag) => (
              <span key={tag} className={cn("text-xs font-medium", config.color)}>
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}

        {/* Engagement row */}
        <div className="flex items-center gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
          <span>👍 Like</span>
          <span>💬 Comment</span>
          <span>🔁 Share</span>
        </div>
      </div>
    </div>
  );
}
