"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import FallbackImage from "@/components/FallbackImage";
import type { ComicListItem } from "@/lib/komikuMapper";
export default function SimilarComics({ genre, currentSlug }: { genre: string; currentSlug: string }) {
 const [items,setItems]=useState<ComicListItem[]>([]);
 useEffect(()=>{ if(!genre) return; const slug=genre.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); fetch(`/api/perdex/genre/${encodeURIComponent(slug)}`).then(r=>r.json()).then(p=>setItems((p?.data||[]).filter((x:ComicListItem)=>(x.slug||x.manga_slug)!==currentSlug).slice(0,6))).catch(()=>setItems([])); },[genre,currentSlug]);
 if(!items.length) return null;
 return <section className="mt-12"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Berdasarkan genre {genre}</p><h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Mungkin kamu juga suka</h2></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{items.map((item,i)=><Link key={`${item.slug}-${i}`} href={`/manga/${encodeURIComponent(item.slug||item.manga_slug)}`} className="min-w-0"><div className="aspect-[3/4] overflow-hidden rounded-xl bg-[#100d18]"><FallbackImage src={item.banner||item.image} fallbackSrc={item.bannerFallback} alt={item.title} width={240} height={320} className="h-full w-full object-cover"/></div><p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-200">{item.title}</p></Link>)}</div></section>;
}
