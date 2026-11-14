import Link from "next/link";
import Navbar from "@/components/Navbar";
import { fetchGenres } from "@/action/fetchKomik";
import siteMetadata from "@/lib/seo/siteMetadata";

export async function generateMetadata() {
  return { title: `Genre | ${siteMetadata.title}`, description: "Jelajahi manga, manhwa, dan manhua berdasarkan genre." };
}

export default async function GenrePage() {
  let genres: Array<{ title: string; slug: string }> = [];
  let failed = false;
  try {
    genres = (await fetchGenres()).data;
  } catch (error) {
    console.error("PerDex genre directory failed:", error);
    failed = true;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[60vh] w-[92%] max-w-7xl pb-16 pt-7">
        <div className="mb-8 border-b border-white/[0.07] pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Temukan cerita favorit</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Jelajahi Genre</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Pilih genre seperti Romance, Action, atau Fantasy. Setelah itu, saring hasilnya berdasarkan Manga, Manhwa, atau Manhua.</p>
        </div>

        {failed ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center">
            <p className="font-semibold text-slate-200">Daftar genre belum bisa dimuat</p>
            <p className="mt-2 text-sm text-slate-500">Server sumber belum merespons. Coba muat ulang beberapa saat lagi.</p>
          </div>
        ) : genres.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {genres.map((genre) => (
              <Link key={genre.slug} href={`/genre/${encodeURIComponent(genre.slug)}`} className="group rounded-2xl border border-white/[0.07] bg-[#100d18] p-4 transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-violet-300/[0.06] sm:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-lg text-violet-200">✦</span>
                <span className="mt-4 block text-sm font-bold text-slate-100 group-hover:text-violet-200 sm:text-base">{genre.title}</span>
                <span className="mt-1 block text-[10px] text-slate-500">Lihat komik genre ini →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center text-sm text-slate-500">Belum ada genre untuk ditampilkan.</div>
        )}
      </main>
    </>
  );
}
