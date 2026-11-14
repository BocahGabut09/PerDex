import FallbackImage from "@/components/FallbackImage";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Synopsis from "@/components/Synopsis";
import Bookmark from "@/components/Bookmark";
import CarouselDetails from "@/components/swiper/CarouselDetails";
import PopoverCustomAnimation from "@/components/ui/PopOver";
import { detailsDataProps } from "./dataType";
import ComicFeaturePanel from "@/components/ComicFeaturePanel";
import SimilarComics from "@/components/SimilarComics";

export default function Details({ dataDetails, id }: { dataDetails: detailsDataProps; id: string }) {
  const comic = dataDetails.data;
  const image = comic.banner || "/icon-192x192.png";
  // The source returns the newest chapter first; start reading from the oldest chapter.
  const firstChapter = comic.chapter_list?.[comic.chapter_list.length - 1]?.chapter_slug;

  return (
    <>
    <Navbar />
    <main className="mx-auto min-h-screen w-[92%] max-w-6xl pb-16 pt-6 sm:pt-8">
      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-violet-200">← <span>Kembali ke beranda</span></Link>
      <section className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#100d18]">
        <div className="relative h-44 overflow-hidden sm:h-64">
          <FallbackImage src={image} fallbackSrc={comic.bannerFallback} alt="" fill unoptimized priority referrerPolicy="no-referrer" className="object-cover opacity-35 blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100d18] via-[#100d18]/65 to-[#100d18]/20" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#100d18] to-transparent" />
        </div>

        <div className="relative -mt-24 px-4 pb-6 sm:-mt-32 sm:px-8 sm:pb-9">
          <div className="grid gap-6 sm:grid-cols-[190px_1fr] sm:items-end">
            <div className="mx-auto w-36 overflow-hidden rounded-2xl border border-white/15 bg-[#191424] shadow-2xl shadow-black/50 sm:mx-0 sm:w-full">
              <FallbackImage src={image} fallbackSrc={comic.bannerFallback} alt={`Sampul ${comic.title}`} width={360} height={500} unoptimized priority referrerPolicy="no-referrer" className="aspect-[3/4] w-full object-cover" />
            </div>
            <div className="min-w-0 text-center sm:pb-1 sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Detail komik</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">{comic.title}</h1>
              <p className="mt-2 text-sm text-slate-400">{comic.author} <span className="px-1.5 text-slate-700">•</span> {comic.published}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {[comic.type, comic.status, `★ ${comic.rating}`, `${comic.chapter_list?.length || 0} Chapter`].filter(Boolean).map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full border border-violet-300/15 bg-violet-300/[0.08] px-3 py-1.5 text-[11px] font-semibold text-violet-100">{tag}</span>)}
              </div>
              <div className="mt-5 flex items-center justify-center gap-2 sm:justify-start">
                {firstChapter ? <Link href={`/baca-chapter/${encodeURIComponent(firstChapter)}`} className="rounded-full bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400">Mulai membaca →</Link> : <span className="rounded-full bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-slate-500">Chapter belum tersedia</span>}
                <Bookmark image={image} rating={comic.rating} title={comic.title} totalChapter={comic.chapter_list?.length || 0} />
                <PopoverCustomAnimation />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 border-t border-white/[0.07] pt-6 lg:grid-cols-[1fr_260px]">
            <div>
              <h2 className="text-lg font-bold text-white">Sinopsis</h2>
              <div className="mt-2 text-sm leading-7 text-slate-400"><Synopsis synopsis={comic.description} /></div>
              {comic.genres?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter berdasarkan genre">
                  {comic.genres.map((genre, index) => {
                    const genreSlug = genre
                      .normalize("NFKD")
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "");
                    return (
                      <Link
                        key={`${genre}-${index}`}
                        href={`/genre/${encodeURIComponent(genreSlug)}`}
                        title={`Lihat semua komik genre ${genre}`}
                        className="rounded-lg border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1.5 text-xs font-medium text-violet-100 transition hover:border-violet-300/40 hover:bg-violet-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                      >
                        {genre} <span aria-hidden="true" className="ml-1 text-violet-300">↗</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <aside className="grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.07] bg-black/15 p-4 lg:grid-cols-1">
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Status</p><p className="mt-1 text-sm font-semibold text-slate-200">{comic.status || "Tidak diketahui"}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Penulis</p><p className="mt-1 text-sm font-semibold text-slate-200">{comic.author || "Tidak diketahui"}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Tahun rilis</p><p className="mt-1 text-sm font-semibold text-slate-200">{comic.published || "-"}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Total chapter</p><p className="mt-1 text-sm font-semibold text-slate-200">{comic.chapter_list?.length || 0}</p></div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Daftar bacaan</p><h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Daftar chapter</h2></div><span className="text-xs text-slate-500">{comic.chapter_list?.length || 0} chapter</span></div>
        {comic.chapter_list?.length ? (
          <ol id="customScrollThumb" className="max-h-[560px] overflow-y-auto rounded-2xl border border-white/[0.07] bg-[#100d18] p-2">
            {comic.chapter_list.map((chapter, index) => <li key={`${chapter.chapter_slug}-${index}`}>
              <Link href={`/baca-chapter/${encodeURIComponent(chapter.chapter_slug)}`} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-violet-300/[0.07] sm:px-4">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-200">{chapter.chapter_title}</span><span className="mt-1 block text-[10px] text-slate-500 sm:hidden">{chapter.chapter_release}</span></span>
                <span className="shrink-0 text-xs text-slate-500">{chapter.chapter_release}</span>
              </Link>
              {index < comic.chapter_list.length - 1 && <div className="mx-3 border-b border-white/[0.04]" />}
            </li>)}
          </ol>
        ) : <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-8 text-center text-sm text-slate-500">Daftar chapter belum tersedia dari server sumber.</div>}
      </section>

      <ComicFeaturePanel slug={id} title={comic.title} cover={image} latestChapter={comic.chapter_list?.[0]?.chapter_title || ""} />
      <SimilarComics genre={comic.genres?.[0] || ""} currentSlug={id} />
      <section className="mt-12"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Jelajahi lagi</p><h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Rekomendasi lainnya</h2></div><CarouselDetails /></section>
      <span className="sr-only">ID: {id}</span>
    </main>
    </>
  );
}
