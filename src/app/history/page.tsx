"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HiBookOpen, HiTrash } from "react-icons/hi";
import Navbar from "@/components/Navbar";
import { clearReadingHistory, getReadingHistory, removeReadingHistory, READING_HISTORY_EVENT, type ReadingHistoryEntry } from "@/lib/readingHistory";
import { dbRequest } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import toast from "react-hot-toast";

function formatUpdatedAt(timestamp: number) {
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function HistoryPage() {
  const { user, session, loading } = useAuth();
  const [items, setItems] = useState<ReadingHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (loading) return;
    if (user && session) {
      try {
        const rows = await dbRequest<any[]>("perdex_reading_history", `select=*&user_id=eq.${user.id}&order=updated_at.desc&limit=100`, { session });
        setItems((rows || []).map((row) => ({ comicSlug: row.comic_slug, comicTitle: row.comic_title, chapterId: row.chapter_id, chapterTitle: row.chapter_title, lastPage: row.last_page, totalPages: row.total_pages, progress: row.progress, updatedAt: new Date(row.updated_at).getTime() })));
      } catch { toast.error("History cloud gagal dimuat."); setItems([]); }
    } else setItems(getReadingHistory());
    setReady(true);
  }, [user?.id, session?.access_token, loading]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const sync = () => { if (!user) setItems(getReadingHistory()); };
    window.addEventListener(READING_HISTORY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(READING_HISTORY_EVENT, sync); window.removeEventListener("storage", sync); };
  }, [user?.id]);

  async function remove(item: ReadingHistoryEntry) {
    if (user && session) {
      setBusy(true);
      try { await dbRequest("perdex_reading_history", `user_id=eq.${user.id}&comic_slug=eq.${encodeURIComponent(item.comicSlug)}`, { method: "DELETE", session, prefer: "return=minimal" }); setItems((current) => current.filter((entry) => entry.comicSlug !== item.comicSlug)); }
      catch { toast.error("Gagal menghapus history cloud."); }
      finally { setBusy(false); }
    } else { removeReadingHistory(item.comicSlug); setItems(getReadingHistory()); }
  }
  async function clear() {
    if (!window.confirm(user ? "Hapus semua history dari akun PerDex?" : "Hapus semua history baca di perangkat ini?")) return;
    if (user && session) {
      setBusy(true);
      try { await dbRequest("perdex_reading_history", `user_id=eq.${user.id}`, { method: "DELETE", session, prefer: "return=minimal" }); setItems([]); toast.success("History akun dihapus."); }
      catch { toast.error("Gagal menghapus history cloud."); }
      finally { setBusy(false); }
    } else { clearReadingHistory(); setItems([]); }
  }

  return <><Navbar/><main className="mx-auto min-h-[65vh] w-[92%] max-w-5xl pb-16 pt-8">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Aktivitas membaca</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white">History Baca</h1><p className="mt-2 text-sm text-slate-500">{user ? "History tersinkronisasi melalui akun Supabase." : "History tersimpan lokal di browser ini. Login untuk sinkronisasi antarperangkat."}</p></div>
      {items.length > 0 && <button type="button" disabled={busy} onClick={() => void clear()} className="inline-flex items-center gap-2 rounded-full border border-rose-300/15 bg-rose-300/[0.05] px-4 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/[0.1] disabled:opacity-50"><HiTrash className="h-4 w-4"/> Hapus semua</button>}</div>
    {!ready ? <p className="mt-8 text-sm text-slate-500">Memuat history...</p> : items.length === 0 ? <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-200"><HiBookOpen className="h-6 w-6"/></span><p className="mt-4 font-semibold text-white">Belum ada history baca</p><p className="mt-1 text-sm text-slate-500">Komik yang mulai kamu baca akan muncul di sini.</p><Link href="/discover" className="mt-5 inline-flex rounded-full bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400">Jelajahi komik</Link></div> :
      <div className="mt-7 grid gap-3 sm:grid-cols-2">{items.map((item) => <article key={item.comicSlug} className="rounded-2xl border border-white/[0.07] bg-[#100d18] p-4"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-200"><HiBookOpen className="h-5 w-5"/></span><div className="min-w-0 flex-1"><h2 className="line-clamp-2 text-sm font-bold text-slate-100">{item.comicTitle || item.comicSlug}</h2><p className="mt-1 truncate text-xs text-violet-200">{item.chapterTitle}</p><p className="mt-1 text-[10px] text-slate-500">{formatUpdatedAt(item.updatedAt)}</p></div><button type="button" disabled={busy} onClick={() => void remove(item)} aria-label={`Hapus history ${item.comicTitle}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.07] text-slate-500 transition hover:border-rose-300/20 hover:text-rose-200 disabled:opacity-40"><HiTrash className="h-4 w-4"/></button></div><div className="mt-4 flex items-center justify-between text-[10px] text-slate-500"><span>Halaman {Math.min(item.lastPage + 1, item.totalPages)} dari {item.totalPages}</span><span>{item.progress}% selesai</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-violet-400" style={{width:`${item.progress}%`}}/></div><Link href={`/baca-chapter/${encodeURIComponent(item.chapterId)}`} className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-violet-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-400">Lanjutkan membaca →</Link></article>)}</div>}
  </main></>;
}
