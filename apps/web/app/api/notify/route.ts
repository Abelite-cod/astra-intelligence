// POST /api/notify
// Sends transactional email notifications via Resend.
// Body: { type, data }
// Types: content_approved | post_published | agent_completed | welcome

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Astra Intelligence <notifications@astra-intelligence.com>";

type NotifyPayload =
  | { type: "content_approved"; data: { content_id: string; platform: string; preview: string } }
  | { type: "post_published"; data: { platform: string; post_url?: string } }
  | { type: "agent_completed"; data: { goal: string; posts_created: number; duration_ms: number } }
  | { type: "welcome"; data: { name: string } };

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    // Silently skip if Resend not configured — don't error the app
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json() as NotifyPayload;
  const userEmail = user.email;
  const userName = user.user_metadata?.full_name ?? userEmail?.split("@")[0] ?? "there";

  if (!userEmail) return NextResponse.json({ error: "No email" }, { status: 400 });

  try {
    let subject = "";
    let html = "";

    switch (payload.type) {
      case "content_approved": {
        const { platform, preview } = payload.data;
        subject = `✅ Content approved for ${platform}`;
        html = emailTemplate({
          title: "Content Approved",
          body: `Your ${platform} post has been approved and is ready to publish.`,
          preview: `"${preview.slice(0, 120)}…"`,
          cta: { label: "Publish now", href: `${process.env.NEXT_PUBLIC_APP_URL}/publish` },
          userName,
        });
        break;
      }

      case "post_published": {
        const { platform, post_url } = payload.data;
        subject = `🚀 Post published to ${platform}!`;
        html = emailTemplate({
          title: "Post Published",
          body: `Your content is now live on ${platform}.`,
          preview: post_url ? `View your post on ${platform}` : undefined,
          cta: post_url ? { label: "View post", href: post_url } : { label: "View analytics", href: `${process.env.NEXT_PUBLIC_APP_URL}/analytics` },
          userName,
        });
        break;
      }

      case "agent_completed": {
        const { goal, posts_created, duration_ms } = payload.data;
        subject = `🤖 Agent pipeline complete — ${posts_created} posts ready`;
        html = emailTemplate({
          title: "Agent Pipeline Complete",
          body: `Your 4-agent workflow finished in ${(duration_ms / 1000).toFixed(1)}s. ${posts_created} posts were generated for: "${goal}"`,
          preview: "Review and approve your new content in the Content Library.",
          cta: { label: "Review content", href: `${process.env.NEXT_PUBLIC_APP_URL}/content` },
          userName,
        });
        break;
      }

      case "welcome": {
        const { name } = payload.data;
        subject = `Welcome to Astra Intelligence, ${name}!`;
        html = emailTemplate({
          title: `Welcome, ${name}!`,
          body: "Your autonomous AI marketing system is ready. Start by setting up your Brand Brain — it's how Claude learns your company.",
          preview: "Set up takes 3 minutes. First campaign in under an hour.",
          cta: { label: "Set up Brand Brain", href: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding` },
          userName: name,
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject,
      html,
    });

    return NextResponse.json({ sent: true, id: result.data?.id });
  } catch (error) {
    console.error("[notify]", error);
    // Don't surface email errors to the user — notifications are best-effort
    return NextResponse.json({ sent: false, error: String(error) }, { status: 200 });
  }
}

// ── Email template ────────────────────────────────────────────────────────────

function emailTemplate({
  title,
  body,
  preview,
  cta,
  userName,
}: {
  title: string;
  body: string;
  preview?: string;
  cta: { label: string; href: string };
  userName: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#a855f7);display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:white;font-weight:900;font-size:18px;">⚡</span>
        </div>
        <span style="color:white;font-size:20px;font-weight:900;">Astra Intelligence</span>
      </div>
    </div>

    <!-- Card -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:20px;padding:32px;">
      <h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 12px 0;">${title}</h1>
      <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px 0;">Hi ${userName},</p>
      <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:0 0 20px 0;">${body}</p>
      ${preview ? `<div style="background:#0f172a;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 24px 0;"><p style="color:#94a3b8;font-size:14px;font-style:italic;margin:0;">${preview}</p></div>` : ""}
      <a href="${cta.href}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px;">${cta.label} →</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#475569;font-size:12px;margin:0;">You're receiving this because you have an Astra Intelligence account.</p>
      <p style="color:#475569;font-size:12px;margin:4px 0 0 0;">© ${new Date().getFullYear()} Astra Intelligence</p>
    </div>
  </div>
</body>
</html>`;
}
