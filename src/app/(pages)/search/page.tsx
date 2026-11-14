import BreadcumbPath from "@/components/ui/BreadcumbPath";
import { fetchMangaAdvSearch } from "@/action/fetchKomik";
import Navbar from "@/components/Navbar";
import FallbackImage from "@/components/FallbackImage";
import Link from "next/link";
import siteMetadata from "@/lib/seo/siteMetadata";
import { detailHref, type ComicListItem } from "@/lib/komikuMapper";

export async function generateMetadata() {
  return { title: `Pencarian | ${siteMetadata.title}`, description: siteMetadata.description };
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = typeof searchParams?.q === "string" ? searchParams.q.trim().slice(0, 100) : "";
  let rows: ComicListItem[] = [];
  let searchError = false;
  if (query) {
    try { rows = (await fetchMangaAdvSearch(query)).data; }
    catch (error) { console.error("PerDex search failed:", error); searchError = true; }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[60vh] w-[92%] max-w-7xl pb-16 pt-7">
        <BreadcumbPath />
        <div className="mt-6 border-b border-white/[0.07] pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Pencarian</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{query ? <>Hasil untuk <span className="text-violet-200">“{query}”</span></> : "Cari komik favoritmu"}</h1>
          <p className="mt-2 text-sm text-slate-500">{query && !searchError ? `${rows.length} hasil ditemukan` : "Manga, manhwa, dan manhua dalam satu tempat."}</p>
        </div>

        {searchError ? (
          <div className="mt-8 rounded-2xl border border-violet-300/10 bg-[#100d18] px-5 py-10 text-center">
            <h2 className="text-lg font-bold text-white">Pencarian belum bisa dimuat</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Server sumber belum merespons. Periksa koneksi lalu coba lagi beberapa saat.</p>
            <Link href={`/search?q=${encodeURIComponent(query)}`} className="mt-5 inline-flex rounded-full bg-violet-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-400">Coba lagi</Link>
          </div>
        ) : !query ? (
          <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center text-sm text-slate-500">Gunakan tombol <span className="font-semibold text-violet-200">Cari komik</span> di bagian atas untuk memulai pencarian.</div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center"><p className="font-semibold text-slate-200">Komik tidak ditemukan</p><p className="mt-1 text-sm text-slate-500">Coba kata kunci lain atau periksa ejaannya.</p></div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6">
            {rows.map((item, index) => <Link href={detailHref(item.slug || item.manga_slug)} key={`${item.slug}-${index}`} className="group min-w-0">
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.07] bg-[#15111e]"><FallbackImage src={item.banner || "/icon-192x192.png"} fallbackSrc={item.bannerFallback} alt={`Sampul ${item.title}`} width={300} height={420} unoptimized loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" /></div>
              <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-200 group-hover:text-violet-200 sm:text-sm">{item.title || "Tanpa Judul"}</p>
              <p className="mt-1 truncate text-[10px] text-slate-500">{item.chapter || "Chapter terbaru"}</p>
            </Link>)}
          </div>
        )}
      </main>
    </>
  );
}
