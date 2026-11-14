"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiArrowRight, HiBookOpen } from "react-icons/hi";
import { getReadingHistory, READING_HISTORY_EVENT, type ReadingHistoryEntry } from "@/lib/readingHistory";

export default function ContinueReading() {
  const [items, setItems] = useState<ReadingHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setItems(getReadingHistory().slice(0, 4));
      setReady(true);
    };
    sync();
    window.addEventListener(READING_HISTORY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(READING_HISTORY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!ready || items.length === 0) return null;

  return (
    <section className="mt-12 min-w-0 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-purple-300/80">Lanjutkan cerita</p>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Terakhir dibaca</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Lanjutkan dari chapter dan halaman terakhir.</p>
        </div>
        <Link href="/history" className="mb-1 inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-purple-300 transition hover:text-violet-100 sm:text-sm">Semua history <HiArrowRight className="h-4 w-4" /></Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.comicSlug} href={item.chapterId ? `/baca-chapter/${encodeURIComponent(item.chapterId)}` : `/manga/${encodeURIComponent(item.comicSlug)}`} className="group rounded-2xl border border-white/[0.07] bg-[#100d18] p-4 transition hover:border-violet-300/25 hover:bg-violet-300/[0.04]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-200"><HiBookOpen className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-100 group-hover:text-violet-200">{item.comicTitle || item.comicSlug}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{item.chapterTitle}</span>
                <span className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span>Halaman {Math.min(item.lastPage + 1, item.totalPages)} / {item.totalPages}</span><span>{item.progress}%</span></span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><span className="block h-full rounded-full bg-violet-400" style={{ width: `${item.progress}%` }} /></span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
