import { NextRequest, NextResponse } from "next/server";
import { fetchMangaByAdvSearch } from "@/action/fetchKomik";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") || "Manhwa";
    const page = Number(req.nextUrl.searchParams.get("page") || 1);
    if (!Number.isInteger(page) || page < 1 || page > 500) return NextResponse.json({ status: "error", message: "Parameter page harus 1-500" }, { status: 400 });
    return NextResponse.json(await fetchMangaByAdvSearch(type, page), { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) { return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Gagal mengambil data" }, { status: 502 }); }
}
