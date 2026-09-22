import { NextResponse } from "next/server";

console.log("🔥 TEST ROUTE LOADED");

export async function GET() {
  console.log("🔥 TEST ROUTE HIT");
  return NextResponse.json({ ok: true });
}