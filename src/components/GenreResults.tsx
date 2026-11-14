"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import AnotherCard from "@/components/AnotherCard";
import type { ComicListItem } from "@/lib/komikuMapper";

const TYPE_FILTERS = ["Semua", "Manga", "Manhwa", "Manhua"] as const;
type ComicTypeFilter = (typeof TYPE_FILTERS)[number];

type Props = {
  slug: string;
  initialItems: ComicListItem[];
  initialHasNext: boolean;
};

function matchesType(item: ComicListItem, filter: ComicTypeFilter) {
  return filter === "Semua" || String(item.type || "").trim().toLowerCase() === filter.toLowerCase();
}

export default function GenreResults({ slug, initialItems, initialHasNext }: Props) {
  const [selectedType, setSelectedType] = useState<ComicTypeFilter>("Semua");
  const [items, setItems] = useState(initialItems);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const listRef = useRef({ items: initialItems, page: 2, hasNext: initialHasNext });
  const loadingRef = useRef(false);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesType(item, selectedType)),
    [items, selectedType]
  );

  const loadMore = useCallback(async (targetType: ComicTypeFilter = selectedType) => {
    if (loadingRef.current || !listRef.current.hasNext) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError(false);
    let turns = 0;
    const maxTurns = targetType === "Semua" ? 1 : 5;

    try {
      while (
        listRef.current.hasNext &&
        turns < maxTurns &&
        (targetType === "Semua" || listRef.current.items.filter((item) => matchesType(item, targetType)).length < 12)
      ) {
        const page = listRef.current.page;
        const response = await fetch(`/api/perdex/genre/${encodeURIComponent(slug)}?page=${page}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        const nextRows: ComicListItem[] = Array.isArray(result?.data) ? result.data : [];
        const known = new Set(listRef.current.items.map((item) => item.slug || item.manga_slug));
        const merged = [...listRef.current.items, ...nextRows.filter((item) => !known.has(item.slug || item.manga_slug))];
        const nextHasNext = Boolean(result?.hasNextPage) && nextRows.length > 0;
        listRef.current = { items: merged, page: page + 1, hasNext: nextHasNext };
        setItems(merged);
        setHasNext(nextHasNext);
        turns += 1;
        if (!nextRows.length) break;
      }
    } catch (error) {
      console.error("Gagal memuat komik genre:", error);
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [selectedType, slug]);

  const chooseType = (type: ComicTypeFilter) => {
    setSelectedType(type);
    const count = listRef.current.items.filter((item) => matchesType(item, type)).length;
    if (type !== "Semua" && count < 12 && listRef.current.hasNext) void loadMore(type);
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Filter jenis komik</p>
          <p className="mt-1 text-xs text-slate-400">Pilih satu untuk menampilkan jenis itu saja.</p>
        </div>
        <span className="rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1.5 text-xs font-semibold text-violet-100">
          {filteredItems.length} komik
        </span>
      </div>

      <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Filter jenis komik">
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => chooseType(type)}
            aria-pressed={selectedType === type}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition ${selectedType === type ? "border-violet-300/40 bg-violet-500 text-white shadow-lg shadow-violet-950/30" : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:border-violet-300/25 hover:text-violet-100"}`}
          >
            {type}
          </button>
        ))}
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6">
          {filteredItems.map((item, index) => (
            <AnotherCard index={index} data={item} key={`${item.slug || item.manga_slug}-${index}`} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center">
          <p className="font-semibold text-slate-200">Belum ada {selectedType} di halaman yang dimuat.</p>
          <p className="mt-1 text-sm text-slate-500">PerDex akan mencari beberapa halaman berikutnya untuk genre ini.</p>
        </div>
      )}

      {loadError && <p className="mt-5 text-center text-xs text-rose-300">Gagal memuat halaman berikutnya. Coba lagi.</p>}
      {hasNext && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore(selectedType)}
            disabled={loading}
            className="rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-5 py-2.5 text-xs font-bold text-violet-100 transition hover:bg-violet-300/[0.15] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Memuat komik…" : loadError ? "Coba lagi" : selectedType === "Semua" ? "Muat lebih banyak" : `Cari ${selectedType} lainnya`}
          </button>
        </div>
      )}
    </section>
  );
}
