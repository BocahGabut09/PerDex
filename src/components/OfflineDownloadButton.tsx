"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { cacheChapterOffline, type OfflineSourcePage } from "@/lib/offlineCache";
import type { ChapterPageImage } from "@/app/(pages)/baca-chapter/[id]/chapterType";
export default function OfflineDownloadButton({ id, title, comicSlug, pages }: { id: string; title: string; comicSlug: string; pages: Array<string | ChapterPageImage> }) {
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0);
  async function save() {
    if (busy) return; setBusy(true); setProgress(0);
    try {
      const normalized = pages.map((p, i) => typeof p === "string" ? { url: p, alt: `Halaman ${i + 1}` } : { url: p.src, fallbackUrl: p.fallbackSrc, alt: p.alt || `Halaman ${i + 1}` });
      await cacheChapterOffline({ id, comicSlug, title, savedAt: Date.now(), pages: normalized as OfflineSourcePage[] }, (done, total) => setProgress(Math.round(done / total * 100)));
      toast.success("Chapter disimpan untuk dibaca offline.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Gagal menyimpan chapter offline."); }
    finally { setBusy(false); }
  }
  return <button type="button" disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3.5 py-2 text-xs font-semibold text-violet-100 disabled:opacity-50">{busy ? `Menyimpan ${progress}%` : "Simpan offline"}</button>;
}
