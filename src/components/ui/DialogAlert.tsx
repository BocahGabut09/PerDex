"use client";
import { Dialog, DialogHeader, DialogBody } from "@material-tailwind/react";
import { FormEvent, useState } from "react";
import FallbackImage from "@/components/FallbackImage";
import { ThreeDots } from "react-loader-spinner";
import axios from "axios";
import { HiArrowRight, HiSearch } from "react-icons/hi";
import { MotionDiv } from "../motion/MotionDiv";
import "./style.css";
import NavLink from "../navlink/NavLink";
import { detailHref, type ComicListItem } from "@/lib/komikuMapper";

export default function DialogAlert({ handler, open, setOpen }: any) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<ComicListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleSubmitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim().slice(0, 100);
    if (!query) return;
    setLoading(true);
    setFailed(false);
    try {
      const response = await axios.get("/api/perdex/search", { params: { q: query } });
      const result = response.data;
      setData(result?.status === "success" && Array.isArray(result?.data) ? result.data : []);
      setFailed(result?.status !== "success");
    } catch (error) {
      console.error("Pencarian gagal", error);
      setData([]);
      setFailed(true);
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} size="lg" handler={handler} placeholder="Dialog pencarian" className="border border-violet-300/10 bg-[#0e0b15] text-white shadow-2xl shadow-black/60">
      <DialogHeader placeholder="Dialog header" className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 text-white">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">PerDex Search</p><h2 className="mt-1 text-lg font-bold">Temukan komik</h2></div>
        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-400">Ctrl + S</span>
      </DialogHeader>
      <DialogBody placeholder="Dialog body" className="px-5 pb-5 pt-4">
        <form onSubmit={handleSubmitSearch} className="flex gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-violet-300/40"><HiSearch className="h-5 w-5 shrink-0 text-violet-300" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600" placeholder="Judul manga, manhwa, atau manhua..." maxLength={100} required /></label>
          <button type="submit" disabled={loading} className="rounded-xl bg-violet-500 px-4 text-sm font-bold text-white transition hover:bg-violet-400 disabled:opacity-50">Cari</button>
        </form>
        {loading ? <div className="mt-4 flex h-20 items-center justify-center rounded-xl bg-white/[0.03]"><ThreeDots height="45" width="55" color="#a78bfa" ariaLabel="Memuat hasil pencarian" visible /></div> : failed ? <div className="mt-4 rounded-xl bg-white/[0.03] p-5 text-center text-sm text-slate-400">Pencarian gagal dimuat. Coba lagi beberapa saat.</div> : data.length > 0 ? <div className="mt-4 max-h-[48vh] space-y-1 overflow-y-auto" id="customScrollThumb">
          {data.map((item, index) => <NavLink key={`${item.slug}-${index}`} href={detailHref(item.slug || item.manga_slug)} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-violet-300/[0.07]">
            <MotionDiv className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[#171322]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><FallbackImage src={item.banner || "/icon-192x192.png"} fallbackSrc={item.bannerFallback} alt={`Sampul ${item.title}`} width={80} height={110} unoptimized loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" /></MotionDiv>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-100">{item.title}</span><span className="mt-1 block text-xs text-slate-500">Rating: {item.rating || "-"}</span></span><HiArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
          </NavLink>)}
          <NavLink href={`/search?q=${encodeURIComponent(search.trim())}`} onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-xl border border-violet-300/10 bg-violet-300/[0.06] py-3 text-sm font-semibold text-violet-200 hover:bg-violet-300/10">Lihat semua hasil <HiArrowRight className="h-4 w-4" /></NavLink>
        </div> : search.trim() ? <p className="mt-5 text-center text-sm text-slate-500">Tekan Cari untuk melihat hasil.</p> : <p className="mt-5 text-center text-xs text-slate-600">Ketik judul komik yang ingin kamu temukan.</p>}
      </DialogBody>
    </Dialog>
  );
}
