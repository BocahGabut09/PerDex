"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[60vh] w-[92%] max-w-xl flex-col items-center justify-center py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/[0.08] text-2xl font-black text-violet-200">!</span>
        <h1 className="mt-5 text-2xl font-black text-white sm:text-3xl">Ada kendala saat membuka halaman</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Halaman belum bisa ditampilkan. Kamu bisa mencoba lagi atau kembali ke beranda.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => reset()} className="rounded-full bg-violet-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-400">Coba lagi</button><Link href="/" className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-violet-300/30">Beranda</Link></div>
      </main>
    </>
  );
}
