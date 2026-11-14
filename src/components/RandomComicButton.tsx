"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiSparkles } from "react-icons/hi";
import { detailHref } from "@/lib/komikuMapper";

export default function RandomComicButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const pickRandomComic = async () => {
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/perdex/random", { cache: "no-store" });
      if (!response.ok) throw new Error("Komik acak belum tersedia.");
      const result = await response.json();
      const slug = result?.data?.slug || result?.data?.manga_slug;
      if (!slug) throw new Error("Komik acak tidak memiliki alamat detail.");
      router.push(detailHref(slug));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengambil komik acak.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={pickRandomComic} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-violet-200/20 bg-violet-200/[0.08] px-5 py-3 text-sm font-semibold text-violet-100 transition hover:border-violet-200/35 hover:bg-violet-200/[0.14] disabled:cursor-wait disabled:opacity-60">
        <HiSparkles className="h-4 w-4" /> {loading ? "Mengacak…" : "Acak komik"}
      </button>
      {message && <span className="text-[11px] text-rose-300">{message}</span>}
    </div>
  );
}
