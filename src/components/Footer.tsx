import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.07] bg-[#08070d]">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8 px-[4%] py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="max-w-md">
          <Link href="/" className="text-2xl font-black tracking-[-0.07em] text-white">Per<span className="text-violet-300">Dex</span></Link>
          <p className="mt-2 text-xs leading-6 text-slate-500">Tempat menjelajahi manga, manhwa, dan manhua. Nikmati mode tamu atau masuk untuk menyinkronkan koleksi antarperangkat.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
          <Link href="/manga" className="transition hover:text-violet-200">Manga</Link>
          <Link href="/manhwa" className="transition hover:text-violet-200">Manhwa</Link>
          <Link href="/manhua" className="transition hover:text-violet-200">Manhua</Link>
          <Link href="/discover" className="transition hover:text-violet-200">Jelajahi</Link>
          <Link href="/profile" className="transition hover:text-violet-200">Bookmark</Link>
          <Link href="/collections" className="transition hover:text-violet-200">Koleksi</Link>
          <Link href="/history" className="transition hover:text-violet-200">History</Link>
          <Link href="/calendar" className="transition hover:text-violet-200">Kalender</Link>
          <Link href="/statistics" className="transition hover:text-violet-200">Statistik</Link>
          <Link href="/offline" className="transition hover:text-violet-200">Offline</Link>
          <Link href="/donasi" className="transition hover:text-violet-200">Donasi</Link>
          <Link href="/dmca" className="transition hover:text-violet-200">DMCA</Link>
          <a href="https://github.com/BocahGabut09/PerDex" target="_blank" rel="noreferrer" className="transition hover:text-violet-200">GitHub</a>
        </div>
      </div>
      <div className="border-t border-white/[0.05] py-4 text-center text-[11px] text-slate-600">© {new Date().getFullYear()} PerDex. Dibuat untuk menemani waktu membaca.</div>
    </footer>
  );
}
