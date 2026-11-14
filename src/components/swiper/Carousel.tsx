"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import FallbackImage from "@/components/FallbackImage";
import useSWR from "swr";
import "swiper/css";
import fetcher from "@/lib/fetcher";
import NavLink from "../navlink/NavLink";
import { detailHref, type ComicListItem } from "@/lib/komikuMapper";

export default function Carousel({ apiPath }: { apiPath: string }) {
  const { data, isLoading, error } = useSWR(apiPath, fetcher, { revalidateOnFocus: false, shouldRetryOnError: false });
  const rows: ComicListItem[] = Array.isArray(data?.data) ? data.data : [];

  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="aspect-[3/4] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]" />)}</div>
      ) : rows.length ? (
        <Swiper slidesPerView={2.7} spaceBetween={12} breakpoints={{ 480: { slidesPerView: 3.5, spaceBetween: 14 }, 640: { slidesPerView: 4, spaceBetween: 16 }, 768: { slidesPerView: 4.5, spaceBetween: 16 }, 1024: { slidesPerView: 6, spaceBetween: 18 } }} className="mySwiper">
          {rows.map((item, index) => (
            <SwiperSlide key={`${item.slug}-${index}`}>
              <NavLink href={detailHref(item.slug || item.manga_slug)} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-purple-300/15 bg-[#1a1029]">
                  <FallbackImage src={item.banner || "/icon-192x192.png"} fallbackSrc={item.bannerFallback} alt={`Sampul ${item.title || "komik"}`} width={300} height={420} unoptimized loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.045]" />
                </div>
                <p className="mt-2 line-clamp-2 min-h-9 text-xs font-semibold leading-5 text-slate-200 group-hover:text-violet-200 sm:text-sm">{item.title || "Tanpa Judul"}</p>
                <p className="mt-1 truncate text-[10px] text-slate-500 sm:text-xs">{item.chapter || "Chapter terbaru"}</p>
              </NavLink>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-300">{error ? "Koleksi belum dapat dimuat" : "Belum ada komik untuk ditampilkan"}</p>
          <p className="mt-1 text-xs text-slate-500">Coba muat ulang halaman beberapa saat lagi.</p>
        </div>
      )}
    </div>
  );
}
