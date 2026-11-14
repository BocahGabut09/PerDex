import Navbar from "@/components/Navbar";
import AnotherCard from "@/components/AnotherCard";
import Loadmore from "@/components/Loadmore";
import { fetchMangaByAdvSearch } from "@/action/fetchKomik";
import siteMetadata from "@/lib/seo/siteMetadata";
import type { ComicListItem } from "@/lib/komikuMapper";

export async function generateMetadata() {
  return { title: "Manga | " + siteMetadata.title, description: siteMetadata.description };
}

export default async function CategoryPage() {
  let rows: ComicListItem[] = [];
  let failed = false;
  try { rows = (await fetchMangaByAdvSearch("manga", 1)).data; }
  catch (error) { console.error("PerDex Manga list failed:", error); failed = true; }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[60vh] w-[92%] max-w-7xl pb-16 pt-7">
        <div className="mb-7 border-b border-white/[0.07] pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Jelajahi koleksi</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Manga</h1>
          <p className="mt-2 text-sm text-slate-500">Jelajahi pilihan manga yang tersedia di PerDex.</p>
        </div>
        {failed ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center"><p className="font-semibold text-slate-200">Daftar komik belum bisa dimuat</p><p className="mt-2 text-sm text-slate-500">Server sumber belum merespons. Coba muat ulang beberapa saat lagi.</p></div>
        ) : rows.length ? (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6">{rows.map((item, index) => <AnotherCard index={index} data={item} key={item.slug || index} />)}</div>
            <Loadmore />
          </>
        ) : <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center text-sm text-slate-500">Belum ada komik untuk ditampilkan.</div>}
      </main>
    </>
  );
}
