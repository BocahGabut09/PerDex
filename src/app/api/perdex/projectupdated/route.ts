import { NextResponse } from "next/server";
import { mapComicList } from "@/lib/komikuMapper";
export const runtime = "nodejs";
const API_BASE = (process.env.NEXT_PERDEX_APIURL || "https://komiku-rest-api.onrender.com").replace(/\/+$/, "");
export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/rekomendasi`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(18000) });
    if (!response.ok) throw new Error(`Komiku API merespons ${response.status}`);
    return NextResponse.json({ status: "success", data: mapComicList(await response.json()) }, { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=600" } });
  } catch (error) { return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Gagal mengambil rekomendasi", data: [] }, { status: 502 }); }
}
