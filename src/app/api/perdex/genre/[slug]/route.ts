import { NextResponse } from "next/server";
import { fetchGenreComics } from "@/action/fetchKomik";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const pageParam = new URL(request.url).searchParams.get("page");
  const page = Number.parseInt(pageParam || "1", 10);
  if (!Number.isInteger(page) || page < 1 || page > 500) {
    return NextResponse.json({ status: "error", message: "Nomor halaman tidak valid." }, { status: 400 });
  }

  try {
    const result = await fetchGenreComics(params.slug, page);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("PerDex genre API failed:", error);
    return NextResponse.json(
      { status: "error", message: "Genre belum bisa dimuat. Coba lagi beberapa saat." },
      { status: 502 }
    );
  }
}
