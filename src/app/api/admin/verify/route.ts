import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqpvzlazjgmjdziwyfkl.supabase.co").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Df7ceGSSrkmywySqQuGiRw_1hIXSgE_";
const ADMIN_EMAIL = "brooscraft9@gmail.com";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!accessToken) return NextResponse.json({ authorized: false }, { status: 401 });

  try {
    // Ask Supabase Auth to validate the signed access token; never trust a client-supplied email.
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ authorized: false }, { status: 401 });

    const user = await response.json();
    const email = String(user?.email || "").trim().toLowerCase();
    const provider = String(user?.app_metadata?.provider || "").toLowerCase();
    const hasGoogleIdentity = Array.isArray(user?.identities)
      && user.identities.some((identity: { provider?: string }) => String(identity?.provider || "").toLowerCase() === "google");
    const isGoogle = provider === "google" || hasGoogleIdentity;
    const isConfirmed = Boolean(user?.email_confirmed_at);
    const authorized = email === ADMIN_EMAIL && isGoogle && isConfirmed;

    return NextResponse.json(
      { authorized, email: authorized ? ADMIN_EMAIL : undefined },
      { status: authorized ? 200 : 403, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ authorized: false, message: "Pemeriksaan admin gagal." }, { status: 503 });
  }
}
