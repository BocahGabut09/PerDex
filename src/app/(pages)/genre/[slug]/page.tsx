import Link from "next/link";
import Navbar from "@/components/Navbar";
import GenreResults from "@/components/GenreResults";
import { fetchGenreComics, fetchGenres } from "@/action/fetchKomik";
import siteMetadata from "@/lib/seo/siteMetadata";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const title = decodeURIComponent(params.slug).replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { title: `${title} | Genre | ${siteMetadata.title}`, description: `Daftar komik genre ${title} di PerDex.` };
}

export default async function GenreDetailPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  let title = slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  let initialItems = [] as Awaited<ReturnType<typeof fetchGenreComics>>["data"];
  let initialHasNext = false;
  let failed = false;

  try {
    const comicsResult = await fetchGenreComics(slug, 1);
    initialItems = comicsResult.data;
    initialHasNext = comicsResult.hasNextPage;
    try {
      const genreResult = await fetchGenres();
      title = genreResult.data.find((item) => item.slug === slug)?.title || comicsResult.genre || title;
    } catch {
      title = comicsResult.genre || title;
    }
  } catch (error) {
    console.error("PerDex genre detail failed:", error);
    failed = true;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[60vh] w-[92%] max-w-7xl pb-16 pt-7">
        <Link href="/genre" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-violet-200">← Semua genre</Link>
        <div className="mb-7 border-b border-white/[0.07] pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Koleksi genre</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Komik {title} dari semua jenis tersedia.</p>
        </div>

        {failed ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center">
            <p className="font-semibold text-slate-200">Komik genre belum bisa dimuat</p>
            <p className="mt-2 text-sm text-slate-500">Server sumber belum merespons atau genre ini sedang tidak tersedia.</p>
            <Link href="/genre" className="mt-5 inline-flex rounded-full bg-violet-500 px-5 py-2.5 text-xs font-bold text-white">Kembali ke genre</Link>
          </div>
        ) : (
          <GenreResults slug={slug} initialItems={initialItems} initialHasNext={initialHasNext} />
        )}
      </main>
    </>
  );
}
