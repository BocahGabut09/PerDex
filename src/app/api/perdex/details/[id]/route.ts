import { NextRequest, NextResponse } from "next/server";
import { fetchDetail } from "@/action/fetchKomik";
export const runtime = "nodejs";
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try { return NextResponse.json(await fetchDetail(params.id), { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=600" } }); }
  catch (error) { return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Detail komik tidak ditemukan" }, { status: 502 }); }
}
