import Link from "next/link";
import { HiArrowRight, HiBookOpen, HiBookmark, HiSparkles } from "react-icons/hi";
import Carousel from "@/components/swiper/Carousel";
import Navbar from "@/components/Navbar";
import ContinueReading from "@/components/ContinueReading";
import RandomComicButton from "@/components/RandomComicButton";

function SectionHeading({ title, subtitle, href, linkLabel = "Lihat semua" }: { title: string; subtitle: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-purple-300/80">Koleksi PerDex</p>
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
      </div>
      {href && <Link href={href} className="mb-1 inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-purple-300 transition hover:text-violet-100 sm:text-sm">{linkLabel}<HiArrowRight className="h-4 w-4" /></Link>}
    </div>
  );
}

export default function Homepage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl min-w-0 px-[4%] pb-16 pt-7 sm:px-8 sm:pt-10">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-purple-400/25 bg-[linear-gradient(135deg,#24113d_0%,#180d2b_52%,#10091d_100%)] px-5 py-9 shadow-[0_24px_90px_rgba(126,34,206,0.24)] sm:px-10 sm:py-14 lg:px-14">
          <div className="pointer-events-none absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full bg-purple-600/35 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-64 w-64 rounded-full bg-fuchsia-700/20 blur-[90px]" />
          <div className="grid items-center gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200 sm:text-xs"><HiSparkles className="h-4 w-4" /> Your next story starts here</span>
              <h1 className="mt-5 max-w-2xl text-[2.55rem] font-black leading-[1.04] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">Temukan cerita yang <span className="text-purple-300">ingin kamu ikuti.</span></h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">Jelajahi manga, manhwa, dan manhua dalam satu tempat. Ikuti pembaruan chapter dan simpan bacaan favorit langsung di perangkatmu.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/manga" className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400">Mulai jelajah <HiArrowRight className="h-4 w-4" /></Link>
                <Link href="/profile" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-300/[0.07]"><HiBookmark className="h-4 w-4" /> Bookmark saya</Link>
                <RandomComicButton />
              </div>
            </div>
            <div className="mx-auto hidden w-full max-w-sm lg:block">
              <div className="relative rounded-[1.75rem] border border-white/10 bg-[#211235]/90 p-5 shadow-2xl shadow-black/40">
                <div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">PerDex Library</span><span className="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_15px_#c4b5fd]" /></div>
                <div className="grid grid-cols-3 gap-3">
                  {["MANGA", "MANHWA", "MANHUA"].map((label, index) => <div key={label} className={`flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl border border-white/10 p-3 ${index === 0 ? "bg-gradient-to-br from-violet-500/40 to-[#211432]" : index === 1 ? "bg-gradient-to-br from-indigo-500/30 to-[#17132a]" : "bg-gradient-to-br from-fuchsia-500/25 to-[#201326]"}`}><span className="text-[9px] font-bold tracking-[0.16em] text-white/80">{label}</span></div>)}
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200"><HiBookOpen className="h-5 w-5" /></span><div><p className="text-xs font-semibold text-white">Bacaan dalam satu tempat</p><p className="mt-0.5 text-[10px] text-slate-500">Simpan koleksi tanpa perlu akun</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-9 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[{ title: "Manga", detail: "Komik dari Jepang", href: "/manga" }, { title: "Manhwa", detail: "Komik dari Korea", href: "/manhwa" }, { title: "Manhua", detail: "Komik dari Tiongkok", href: "/manhua" }, { title: "Genre", detail: "Cari cerita sesuai selera", href: "/genre" }].map((item) => <Link key={item.href} href={item.href} className="group flex items-center justify-between rounded-2xl border border-purple-300/15 bg-[#160d27]/80 px-5 py-4 transition hover:border-violet-300/25 hover:bg-violet-300/[0.045]"><div><p className="font-bold text-white">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></div><HiArrowRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-purple-300" /></Link>)}
        </section>

        <ContinueReading />

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[{ title: "Trending Komik", detail: "Lihat bacaan yang sedang populer", href: "/discover" }, { title: "Kalender Rilis", detail: "Pantau jadwal chapter terbaru", href: "/calendar" }, { title: "Koleksi Saya", detail: "Atur komik sesuai daftar pribadi", href: "/collections" }, { title: "Dukung PerDex", detail: "Bantu pengembangan website", href: "/donasi" }].map((item) => <Link key={item.href} href={item.href} className="rounded-2xl border border-violet-300/15 bg-[#100d18] p-4 transition hover:border-violet-300/35 hover:bg-violet-300/[0.05]"><p className="text-sm font-bold text-white">{item.title} →</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></Link>)}
        </section>

        <section className="mt-12 min-w-0 sm:mt-16">
          <SectionHeading title="Pilihan PerDex" subtitle="Koleksi pilihan yang sedang ditampilkan." />
          <Carousel apiPath="/api/perdex/projectupdated" />
        </section>
        <section className="mt-12 min-w-0 sm:mt-16">
          <SectionHeading title="Update terbaru" subtitle="Lihat komik yang baru saja diperbarui." href="/latestupdated" />
          <Carousel apiPath="/api/perdex/lastupdated?page=1" />
        </section>
        <section className="mt-12 min-w-0 sm:mt-16">
          <SectionHeading title="Manhua populer" subtitle="Jelajahi pilihan manhua yang sedang populer." href="/manhua" />
          <Carousel apiPath="/api/perdex/advsearch?type=Manhua" />
        </section>
        <section className="mt-12 min-w-0 sm:mt-16">
          <SectionHeading title="Manhwa populer" subtitle="Temukan cerita manhwa untuk dibaca berikutnya." href="/manhwa" />
          <Carousel apiPath="/api/perdex/advsearch?type=Manhwa" />
        </section>
      </main>
    </>
  );
}
