import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.GOOGLE_GEMINI_API_KEY || "";
  return NextResponse.json({
    hasKey: !!key,
    keyLength: key.length,
    keyPrefix: key.slice(0, 8),
    keySuffix: key.slice(-4),
  });
}
