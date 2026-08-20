import { NextRequest, NextResponse } from "next/server";

// Serves TikTok domain verification files for Privacy Policy URL verification.
// TikTok checks: https://yourdomain.com/privacy/[verification-file].txt
export async function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  // Only serve known TikTok verification files
  if (!params.filename.startsWith("tiktok") || !params.filename.endsWith(".txt")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // The verification content is the filename without extension
  const token = params.filename.replace(".txt", "");

  return new NextResponse(token, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
  });
}
