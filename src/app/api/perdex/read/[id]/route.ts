import { NextRequest, NextResponse } from "next/server";
import { fetchRead } from "@/action/fetchKomik";
export const runtime = "nodejs";
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try { return NextResponse.json(await fetchRead(params.id), { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }); }
  catch (error) { return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Chapter tidak ditemukan" }, { status: 502 }); }
}
