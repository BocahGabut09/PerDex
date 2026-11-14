import { NextRequest, NextResponse } from "next/server";
import { fetchSearch } from "@/action/fetchKomik";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q) return NextResponse.json({ status: "success", data: [] });
    if (q.length > 100) return NextResponse.json({ status: "error", message: "Pencarian maksimal 100 karakter" }, { status: 400 });
    return NextResponse.json(await fetchSearch(q), { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" } });
  } catch (error) { return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Pencarian gagal" }, { status: 502 }); }
}
