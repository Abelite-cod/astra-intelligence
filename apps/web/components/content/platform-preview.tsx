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
    label: "LinkedIn",
    charLimit: 3000,
    avatarBg: "bg-[#0077B5]",
  },
  twitter: {
    icon: Twitter,
    color: "text-[#1DA1F2]",
    label: "Twitter / X",
    charLimit: 280,
    avatarBg: "bg-[#1DA1F2]",
  },
  instagram: {
    icon: Instagram,
    color: "text-[#E1306C]",
    label: "Instagram",
    charLimit: 2200,
    avatarBg: "bg-[#E1306C]",
  },
};

export function PlatformPreview({ platform, body, hook, cta, hashtags }: PlatformPreviewProps) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  const charCount = body.length;
  const isOverLimit = charCount > config.charLimit;

  return (
    <div className="border border-[#2A2520] rounded-sm overflow-hidden bg-[#1F1B17]">
      {/* Platform header bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2A2520] bg-[#161310]">
        <div className="w-6 h-6 rounded-sm flex items-center justify-center bg-[#1F1B17] border border-[#2A2520]">
          <Icon className="w-3.5 h-3.5 text-[#6E6860]" />
        </div>
        <span className="text-[10px] font-medium text-[#6E6860] uppercase tracking-[0.06em]">{config.label}</span>
        <span className={cn(
          "ml-auto text-[10px] font-mono",
          isOverLimit ? "text-red-400" : "text-[#524D47]"
        )}>
          {charCount}/{config.charLimit}
        </span>
      </div>

      {/* Preview content */}
      <div className="p-4">
        {/* Mock social card */}
        <div className="bg-[#161310] border border-[#2A2520] rounded-sm p-4 space-y-2">
          {/* User row */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-[#2A2520] flex items-center justify-center">
              <Icon className="w-4 h-4 text-[#524D47]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#F5F2EE]">Your Brand</p>
              <p className="text-xs text-[#524D47]">Just now</p>
            </div>
          </div>

          {/* Content */}
          <div className="text-sm text-[#B8B2A9] whitespace-pre-wrap leading-relaxed">
            {body}
          </div>

          {/* Hashtags */}
          {hashtags && hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {hashtags.map((tag) => (
                <span key={tag} className="text-xs font-medium text-[#C8843A]">
                  #{tag.replace(/^#/, "")}
                </span>
              ))}
            </div>
          )}

          {/* Engagement row */}
          <div className="flex items-center gap-4 pt-2 border-t border-[#2A2520] text-xs text-[#524D47]">
            <span>👍 Like</span>
            <span>💬 Comment</span>
            <span>🔁 Share</span>
          </div>
        </div>
      </div>
    </div>
  );
}
