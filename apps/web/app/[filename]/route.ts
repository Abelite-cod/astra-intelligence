import { NextRequest, NextResponse } from "next/server";

// Serves TikTok domain verification files at the root URL.
// TikTok checks: https://yourdomain.com/tiktok[token].txt
// Expected file content: tiktok-developers-site-verification=[token]
export async function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  if (!params.filename.startsWith("tiktok") || !params.filename.endsWith(".txt")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Extract token: tiktokABCD1234.txt → ABCD1234
  const token = params.filename.replace(/^tiktok/, "").replace(/\.txt$/, "");
  const content = `tiktok-developers-site-verification=${token}`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
  });
}
