import { NextResponse } from "next/server";
import { fetchLastUpdated } from "@/action/fetchKomik";

export async function GET() {
  try {
    const result = await fetchLastUpdated(1);
    const rows = Array.isArray(result?.data) ? result.data : [];
    if (!rows.length) {
      return NextResponse.json({ status: "empty", message: "Belum ada komik untuk diacak." }, { status: 404 });
    }
    const item = rows[Math.floor(Math.random() * rows.length)];
    return NextResponse.json({ status: "success", data: item }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("PerDex random comic failed:", error);
    return NextResponse.json({ status: "error", message: "Komik acak belum bisa dimuat." }, { status: 502 });
  }
}
