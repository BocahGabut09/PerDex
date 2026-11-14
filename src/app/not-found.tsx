import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[65vh] w-[92%] max-w-xl flex-col items-center justify-center py-16 text-center">
        <span className="text-7xl font-black tracking-[-0.08em] text-violet-300 sm:text-8xl">404</span>
        <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Alamat yang kamu buka tidak tersedia atau mungkin sudah berubah.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/" className="rounded-full bg-violet-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-400">Ke beranda</Link><Link href="/manga" className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-violet-300/30">Jelajahi komik</Link></div>
      </main>
    </>
  );
}
