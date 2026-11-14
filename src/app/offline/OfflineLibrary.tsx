"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { deleteOfflineChapter, getOfflineChapter, listOfflineChapters, type OfflineChapter } from "@/lib/offlineCache";
import Navbar from "@/components/Navbar";
export default function OfflineLibrary() {
  const [items, setItems] = useState<any[]>([]); const [selected, setSelected] = useState<OfflineChapter | null>(null); const [urls, setUrls] = useState<string[]>([]);
  async function refresh() { try { setItems(await listOfflineChapters()); } catch { setItems([]); } }
  useEffect(() => { void refresh(); }, []);
  async function open(id: string) { try { const data = await getOfflineChapter(id); if (!data) throw new Error("Chapter tidak ditemukan."); urls.forEach(URL.revokeObjectURL); setUrls(data.pages.map((page) => URL.createObjectURL(page.blob))); setSelected(data); } catch (e) { toast.error(e instanceof Error ? e.message : "Tidak dapat membuka chapter."); } }
  async function remove(id: string) { await deleteOfflineChapter(id); if (selected?.id === id) { urls.forEach(URL.revokeObjectURL); setSelected(null); setUrls([]); } await refresh(); }
  useEffect(() => () => urls.forEach(URL.revokeObjectURL), [urls]);
  return <><Navbar/><main className="mx-auto min-h-[70vh] w-[92%] max-w-5xl pb-16 pt-8"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">PerDex offline</p><h1 className="mt-2 text-3xl font-black text-white">Chapter tersimpan</h1><p className="mt-2 text-sm text-slate-500">Chapter yang disimpan di browser ini dapat dibaca tanpa koneksi selama datanya belum dihapus.</p>
    {!items.length && !selected && <div className="mt-8 rounded-2xl border border-white/10 bg-[#100d18] p-8 text-center text-sm text-slate-500">Belum ada chapter offline. Buka reader lalu tekan “Simpan offline”.</div>}
    {selected ? <div className="mt-6"><div className="sticky top-16 z-20 flex items-center justify-between rounded-xl border border-white/10 bg-[#100d18]/95 p-3 backdrop-blur"><button onClick={() => { setSelected(null); urls.forEach(URL.revokeObjectURL); setUrls([]); }} className="text-xs font-bold text-violet-200">← Kembali ke daftar</button><span className="text-xs text-slate-400">{selected.pages.length} halaman</span></div><h2 className="my-4 text-center text-xl font-bold text-white">{selected.title}</h2>{urls.map((url, i) => <img key={url} src={url} alt={`Halaman ${i+1}`} className="mx-auto block h-auto w-full max-w-4xl" loading="lazy"/>)}</div> : <div className="mt-7 grid gap-3 sm:grid-cols-2">{items.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#100d18] p-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{item.title}</p><p className="mt-1 text-[10px] text-slate-500">{item.comicSlug} · {new Date(item.savedAt).toLocaleDateString("id-ID")}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => void open(item.id)} className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-bold text-white">Baca</button><button onClick={() => void remove(item.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Hapus</button></div></article>)}</div>}
    <div className="mt-6"><Link href="/" className="text-xs text-violet-300">Kembali ke beranda</Link></div></main></>;
}
