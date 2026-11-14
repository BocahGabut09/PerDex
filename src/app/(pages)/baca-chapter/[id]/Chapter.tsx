"use client";

import FallbackImage from "@/components/FallbackImage";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { HiArrowLeft, HiArrowRight, HiMenuAlt2, HiEye, HiPlay, HiPause, HiRefresh } from "react-icons/hi";
import "./style.css";
import Disqus from "@/components/Disqus";
import Navbar from "@/components/Navbar";
import { useRouter } from "@/lib/router-events";
import { chapterType } from "./chapterType";
import { getReadingHistory, saveReadingProgress } from "@/lib/readingHistory";
import OfflineDownloadButton from "@/components/OfflineDownloadButton";
import ChapterReportButton from "@/components/ChapterReportButton";
import { useAuth } from "@/components/AuthProvider";
import { dbRequest, getSession } from "@/lib/supabase";

type ReaderChapter = chapterType & { id: string };
type ReadingSnapshot = {
  comicSlug: string;
  comicTitle: string;
  chapterId: string;
  chapterTitle: string;
  lastPage: number;
  totalPages: number;
  progress: number;
};

export default function Chapter({ dataRead, id }: { dataRead: chapterType; id: string }) {
  const router = useRouter();
  const [comicUrl, setComicUrl] = useState("/");
  const [focusMode, setFocusMode] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.75);
  const [readerTheme, setReaderTheme] = useState<"dark" | "amoled" | "light">("dark");
  const { user, session } = useAuth();
  const [chapters, setChapters] = useState<ReaderChapter[]>([{ ...dataRead, id }]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [nextChapterError, setNextChapterError] = useState("");

  const chaptersRef = useRef<ReaderChapter[]>([{ ...dataRead, id }]);
  const loadingNextRef = useRef(false);
  const nextSentinelRef = useRef<HTMLDivElement>(null);
  const restoredChapterRef = useRef("");
  const restoringRef = useRef(false);
  const currentVisibleRef = useRef<ReadingSnapshot | null>(null);
  const lastSavedRef = useRef("");

  const [slug] = id.split("___");
  const comicSlug = dataRead.comicSlug || slug || "";
  const comicTitle = dataRead.comicTitle || comicSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const handleNext = useCallback(() => {
    const next = dataRead?.has_next?.has_next_link;
    if (dataRead?.has_next?.is_next_link && next) router.push(`/baca-chapter/${encodeURIComponent(next)}`);
  }, [dataRead?.has_next?.is_next_link, dataRead?.has_next?.has_next_link, router]);

  const handlePrevious = useCallback(() => {
    const previous = dataRead?.has_prev?.has_prev_link;
    if (dataRead?.has_prev?.is_prev_link && previous) router.push(`/baca-chapter/${encodeURIComponent(previous)}`);
  }, [dataRead?.has_prev?.is_prev_link, dataRead?.has_prev?.has_prev_link, router]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "ArrowRight") handleNext();
    if (event.key === "ArrowLeft") handlePrevious();
    if (event.key === "Escape") setFocusMode(false);
  }, [handleNext, handlePrevious]);

  useEffect(() => {
    try { const saved = localStorage.getItem("perdex_reader_theme") as "dark" | "amoled" | "light" | null; if (saved) setReaderTheme(saved); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!user || !session) return;
    dbRequest<any[]>("perdex_user_preferences", `select=reader_theme&user_id=eq.${user.id}&limit=1`, { session }).then((rows) => {
      const theme = rows?.[0]?.reader_theme; if (theme === "dark" || theme === "amoled" || theme === "light") { setReaderTheme(theme); localStorage.setItem("perdex_reader_theme", theme); }
    }).catch(() => {});
  }, [user?.id, session]);
  async function changeReaderTheme(value: "dark" | "amoled" | "light") {
    setReaderTheme(value); localStorage.setItem("perdex_reader_theme", value);
    if (user && session) await dbRequest("perdex_user_preferences", "on_conflict=user_id", { method: "POST", session, prefer: "resolution=merge-duplicates,return=minimal", body: { user_id: user.id, reader_theme: value } }).catch(() => {});
  }
  function saveCloudProgress(snapshot: ReadingSnapshot) {
    const active = getSession(); if (!active?.user?.id) return;
    void dbRequest("perdex_reading_history", "on_conflict=user_id,comic_slug", { method: "POST", session: active, prefer: "resolution=merge-duplicates,return=minimal", body: { user_id: active.user.id, comic_slug: snapshot.comicSlug.slice(0, 240), comic_title: snapshot.comicTitle.slice(0, 240), chapter_id: snapshot.chapterId, chapter_title: snapshot.chapterTitle.slice(0, 240), last_page: snapshot.lastPage, total_pages: snapshot.totalPages, progress: snapshot.progress } }).catch(() => {});
  }
  useEffect(() => {
    setComicUrl(`/manga/${encodeURIComponent(comicSlug)}`);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [comicSlug, handleKeyDown]);

  /** Fetch and append the next chapter without leaving the current reader page. */
  const loadNextChapter = useCallback(async () => {
    const current = chaptersRef.current;
    const last = current[current.length - 1];
    const nextId = last?.has_next?.is_next_link ? last.has_next.has_next_link : null;
    if (!nextId || loadingNextRef.current) return;

    // Protect the reader from a malformed API navigation loop.
    if (current.some((chapter) => chapter.id === nextId)) {
      setNextChapterError("Navigasi chapter dari sumber mengarah ke chapter yang sama.");
      return;
    }

    loadingNextRef.current = true;
    setLoadingNext(true);
    setNextChapterError("");
    try {
      const response = await fetch(`/api/perdex/read/${encodeURIComponent(nextId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload?.data) || payload.data.length === 0) {
        throw new Error(payload?.message || "Chapter berikutnya belum bisa dimuat.");
      }

      const nextChapter: ReaderChapter = { ...payload, id: nextId };
      const updated = [...chaptersRef.current, nextChapter];
      chaptersRef.current = updated;
      setChapters(updated);
    } catch (error) {
      setNextChapterError(error instanceof Error ? error.message : "Gagal memuat chapter berikutnya.");
    } finally {
      loadingNextRef.current = false;
      setLoadingNext(false);
    }
  }, []);

  // Prefetch the next chapter shortly before the reader reaches the end.
  // This is enabled only in Focus Mode; normal reading keeps its regular Next button.
  useEffect(() => {
    const sentinel = nextSentinelRef.current;
    if (!focusMode || !sentinel || nextChapterError) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadNextChapter();
    }, { root: null, rootMargin: "1200px 0px 1200px 0px", threshold: 0 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [focusMode, chapters.length, loadingNext, nextChapterError, loadNextChapter]);

  // Track the visible page per chapter and restore the saved position on entry.
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reader-page]"));
    if (!nodes.length) return;

    if (restoredChapterRef.current !== id) {
      restoredChapterRef.current = id;
      const restore = (saved: { chapterId: string; chapterTitle: string; lastPage: number; totalPages: number; progress: number } | null) => {
        const shouldRestore = Boolean(saved && saved.chapterId === id && saved.lastPage > 0);
        if (shouldRestore && saved) {
          lastSavedRef.current = `${saved.chapterId}:${saved.lastPage}`;
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const target = nodes.find((node) => node.dataset.readerChapter === saved.chapterId && Number(node.dataset.readerPage) === saved.lastPage);
            target?.scrollIntoView({ block: "start" });
            currentVisibleRef.current = { comicSlug, comicTitle, chapterId: saved.chapterId, chapterTitle: saved.chapterTitle, lastPage: saved.lastPage, totalPages: saved.totalPages, progress: saved.progress };
            requestAnimationFrame(() => { restoringRef.current = false; });
          }));
        } else restoringRef.current = false;
      };
      if (user && session) {
        restoringRef.current = true;
        void dbRequest<any[]>("perdex_reading_history", `select=chapter_id,chapter_title,last_page,total_pages,progress&user_id=eq.${user.id}&comic_slug=eq.${encodeURIComponent(comicSlug)}&limit=1`, { session })
          .then((rows) => { const row = rows?.[0]; restore(row ? { chapterId: row.chapter_id, chapterTitle: row.chapter_title, lastPage: row.last_page, totalPages: row.total_pages, progress: row.progress } : null); })
          .catch(() => { restoringRef.current = false; });
      } else {
        const local = getReadingHistory().find((entry) => entry.comicSlug === comicSlug);
        restore(local || null);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible || restoringRef.current) return;

      const node = visible.target as HTMLElement;
      const chapterId = node.dataset.readerChapter || id;
      const pageIndex = Number(node.dataset.readerPage || 0);
      const totalPages = Math.max(1, Number(node.dataset.readerTotalPages || 1));
      const snapshot: ReadingSnapshot = {
        comicSlug: node.dataset.readerComicSlug || comicSlug,
        comicTitle: node.dataset.readerComicTitle || comicTitle,
        chapterId,
        chapterTitle: node.dataset.readerChapterTitle || dataRead.title || "Baca chapter",
        lastPage: pageIndex,
        totalPages,
        progress: Math.round(((pageIndex + 1) / totalPages) * 100),
      };
      currentVisibleRef.current = snapshot;

      const saveKey = `${chapterId}:${pageIndex}`;
      if (saveKey !== lastSavedRef.current) {
        lastSavedRef.current = saveKey;
        if (user && session) saveCloudProgress(snapshot);
        else saveReadingProgress(snapshot);
      }
    }, { threshold: [0.2, 0.45, 0.7], rootMargin: "-12% 0px -48% 0px" });

    nodes.forEach((node) => observer.observe(node));
    const saveBeforeExit = () => {
      if (currentVisibleRef.current) {
        if (user && session) saveCloudProgress(currentVisibleRef.current);
        else saveReadingProgress(currentVisibleRef.current);
      }
    };
    window.addEventListener("pagehide", saveBeforeExit);
    return () => {
      observer.disconnect();
      window.removeEventListener("pagehide", saveBeforeExit);
    };
  }, [chapters.length, comicSlug, comicTitle, dataRead.title, id, user?.id, session?.access_token]);

  // Existing manual auto-scroll control remains independent from chapter auto-loading.
  useEffect(() => {
    if (!autoScroll) return;
    let frame = 0;
    let previousTime = 0;
    const step = (time: number) => {
      if (!previousTime) previousTime = time;
      const delta = Math.min(time - previousTime, 40);
      previousTime = time;
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        setAutoScroll(false);
        return;
      }
      window.scrollBy(0, scrollSpeed * (delta / 16.67));
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [autoScroll, scrollSpeed]);

  const visibleChapters = focusMode ? chapters : chapters.slice(0, 1);
  const lastVisibleChapter = visibleChapters[visibleChapters.length - 1];
  const hasNextChapter = Boolean(lastVisibleChapter?.has_next?.is_next_link && lastVisibleChapter?.has_next?.has_next_link);

  return (
    <>
      {!focusMode && <Navbar />}
      <main data-reader-theme={readerTheme} className={`mx-auto w-[94%] pb-14 pt-3 transition-all ${focusMode ? "max-w-6xl" : "max-w-5xl pt-7"} reader-theme-${readerTheme}`}>
        <div className={`sticky top-2 z-30 mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[#100d18]/95 p-2.5 shadow-xl shadow-black/20 backdrop-blur-xl ${focusMode ? "max-w-6xl" : ""}`}>
          <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setFocusMode((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3.5 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-300/[0.15]">
            <HiEye className="h-4 w-4" /> {focusMode ? "Keluar fokus" : "Mode fokus"}
          </button><select aria-label="Tema reader" value={readerTheme} onChange={(e) => void changeReaderTheme(e.target.value as "dark" | "amoled" | "light")} className="rounded-full border border-white/10 bg-[#1a1227] px-3 py-2 text-xs text-slate-200"><option value="dark">Dark</option><option value="amoled">AMOLED Black</option><option value="light">Light</option></select><OfflineDownloadButton id={id} title={dataRead.title || "Chapter"} comicSlug={comicSlug} pages={dataRead.data} /><ChapterReportButton comicSlug={comicSlug} chapterId={id} /></div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setAutoScroll((value) => !value)} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition ${autoScroll ? "bg-violet-500 text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"}`}>
              {autoScroll ? <HiPause className="h-4 w-4" /> : <HiPlay className="h-4 w-4" />} {autoScroll ? "Hentikan scroll" : "Auto-scroll"}
            </button>
            {autoScroll && (
              <select aria-label="Kecepatan auto-scroll" value={scrollSpeed} onChange={(event) => setScrollSpeed(Number(event.target.value))} className="rounded-full border border-white/10 bg-[#1a1227] px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-300/40">
                <option value={0.45}>Lambat</option>
                <option value={0.75}>Normal</option>
                <option value={1.2}>Cepat</option>
              </select>
            )}
          </div>
        </div>

        {!focusMode && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] px-4 py-5 sm:px-7">
            <Link href={comicUrl} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-violet-200"><HiArrowLeft className="h-4 w-4" /> Kembali ke detail komik</Link>
            <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">PerDex Reader</p>
            <h1 className="mt-2 text-center text-xl font-black tracking-tight text-white sm:text-3xl">{dataRead.title || "Baca chapter"}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-center text-xs leading-6 text-slate-500 sm:text-sm">Gunakan tombol navigasi untuk berpindah chapter. Tombol panah kiri dan kanan di keyboard juga bisa digunakan.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {dataRead?.has_prev?.is_prev_link && <button type="button" onClick={handlePrevious} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-violet-300/30 hover:bg-violet-300/[0.08]"><HiArrowLeft className="h-4 w-4" /> Sebelumnya</button>}
              <Link href={comicUrl} className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-4 py-2.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-300/[0.14]"><HiMenuAlt2 className="h-4 w-4" /> Daftar chapter</Link>
              {dataRead?.has_next?.is_next_link && <button type="button" onClick={handleNext} className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-400">Berikutnya <HiArrowRight className="h-4 w-4" /></button>}
            </div>
          </div>
        )}

        {visibleChapters.map((chapter, chapterIndex) => {
          const chapterTitle = chapter.title || `Chapter ${chapterIndex + 1}`;
          const isLast = chapterIndex === visibleChapters.length - 1;
          return (
            <section key={chapter.id} className={`mx-auto mt-4 max-w-4xl overflow-hidden rounded-2xl border border-white/[0.06] ${focusMode ? "border-transparent bg-black" : "bg-[#0d0b12]"}`}>
              {focusMode && (
                <div className="border-b border-violet-300/10 bg-[#100d18] px-4 py-5 text-center sm:px-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300">Awal chapter</p>
                  <h2 className="mt-1 text-sm font-bold text-white sm:text-base">{chapterTitle}</h2>
                </div>
              )}
              {chapter.data.map((item, index) => {
                const src = typeof item === "string" ? item : item.src;
                const fallbackSrc = typeof item === "string" ? undefined : item.fallbackSrc;
                const alt = typeof item === "string" ? `${chapterTitle} halaman ${index + 1}` : item.alt || `${chapterTitle} halaman ${index + 1}`;
                return (
                  <div
                    key={`${chapter.id}-${index}-${src}`}
                    data-reader-page={index}
                    data-reader-chapter={chapter.id}
                    data-reader-total-pages={chapter.data.length || 1}
                    data-reader-chapter-title={chapterTitle}
                    data-reader-comic-slug={chapter.comicSlug || comicSlug}
                    data-reader-comic-title={chapter.comicTitle || comicTitle}
                  >
                    <FallbackImage src={src} fallbackSrc={fallbackSrc} alt={alt} referrerPolicy="no-referrer" unoptimized width={1000} height={1500} priority={chapterIndex === 0 && index === 0} loading={chapterIndex === 0 && index === 0 ? "eager" : "lazy"} className="block h-auto w-full" />
                  </div>
                );
              })}
              {focusMode && (
                <div className="border-t border-violet-300/10 bg-[#100d18] px-4 py-5 text-center sm:px-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300">Akhir chapter</p>
                  <p className="mt-1 text-sm font-bold text-white">{chapterTitle}</p>
                </div>
              )}
              {focusMode && isLast && hasNextChapter && (
                <div ref={nextSentinelRef} className="flex min-h-24 items-center justify-center border-t border-white/[0.05] bg-[#0b0910] px-4 py-6 text-center" aria-live="polite">
                  {loadingNext ? (
                    <div className="flex items-center gap-2 text-xs text-violet-200"><span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-300" /> Menyiapkan chapter selanjutnya...</div>
                  ) : nextChapterError ? (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs text-rose-300">{nextChapterError}</p>
                      <button type="button" onClick={() => void loadNextChapter()} className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-400"><HiRefresh className="h-4 w-4" /> Coba muat lagi</button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Chapter berikutnya dimuat otomatis saat kamu lanjut scroll</p>
                  )}
                </div>
              )}
              {focusMode && isLast && !hasNextChapter && (
                <div className="border-t border-violet-300/10 bg-[#100d18] px-4 py-7 text-center">
                  <p className="text-sm font-semibold text-violet-200">Kamu sudah mencapai chapter terakhir.</p>
                  <Link href={comicUrl} className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-300/20 px-4 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-300/[0.08]"><HiMenuAlt2 className="h-4 w-4" /> Kembali ke daftar chapter</Link>
                </div>
              )}
            </section>
          );
        })}

        {!focusMode && (
          <>
            <div className="mt-5 flex justify-between gap-3">
              {dataRead?.has_prev?.is_prev_link ? <button type="button" onClick={handlePrevious} className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-violet-300/[0.08]">← Prev</button> : <span />}
              {dataRead?.has_next?.is_next_link ? <button type="button" onClick={handleNext} className="rounded-full bg-violet-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-400">Next →</button> : <span />}
            </div>
            <div className="mt-10"><Disqus shortname="perdexxyz" title={dataRead.title} chapter_id={id} /></div>
          </>
        )}
      </main>
    </>
  );
}
