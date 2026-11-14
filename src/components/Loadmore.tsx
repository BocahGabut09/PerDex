"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import AnotherCard from "./AnotherCard";
import { usePathname } from "next/navigation";
import type { ComicListItem } from "@/lib/komikuMapper";

export default function Loadmore() {
  const path = usePathname();
  const { ref, inView } = useInView({ threshold: 0 });
  const [data, setData] = useState<ComicListItem[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [page, setPage] = useState(2);
  const [loadError, setLoadError] = useState(false);
  const loadingRef = useRef(false);
  const [requestTick, setRequestTick] = useState(0);

  useEffect(() => {
    setData([]); setPage(2); setHasNext(true); setLoadError(false); loadingRef.current = false;
  }, [path]);

  useEffect(() => {
    if (!inView || loadingRef.current || !hasNext || loadError) return;
    const controller = new AbortController();
    const type = path.replace(/^\//, "").split("/")[0] || "manga";
    loadingRef.current = true;
    fetch(`/api/perdex/advsearch?type=${encodeURIComponent(type)}&page=${page}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then((result) => {
        const rows: ComicListItem[] = Array.isArray(result?.data) ? result.data : [];
        setData((previous) => [...previous, ...rows]);
        setHasNext(rows.length > 0);
        if (rows.length) setPage((current) => current + 1);
      })
      .catch((error: Error) => { if (error.name !== "AbortError") { console.error("Gagal memuat daftar komik", error); setLoadError(true); } })
      .finally(() => { loadingRef.current = false; if (!controller.signal.aborted) setRequestTick((tick) => tick + 1); });
    return () => controller.abort();
  }, [inView, path, page, hasNext, requestTick, loadError]);

  return <>
    {data.length > 0 && <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6">{data.map((item, index) => <AnotherCard data={item} index={index} key={`${item.manga_slug}-${index}`} />)}</div>}
    {loadError ? <div className="mt-6 text-center"><p className="mb-2 text-xs text-slate-500">Gagal memuat halaman berikutnya.</p><button type="button" onClick={() => { setLoadError(false); setRequestTick((tick) => tick + 1); }} className="rounded-full border border-violet-300/20 px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-300/[0.08]">Coba lagi</button></div> : hasNext && <div className="mt-7 flex justify-center"><div ref={ref} className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300/20 border-t-violet-300" aria-label="Memuat komik berikutnya" /> </div>}
  </>;
}
