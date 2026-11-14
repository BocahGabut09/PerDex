"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import FallbackImage from "@/components/FallbackImage";
import "swiper/css";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import NavLink from "../navlink/NavLink";
import { detailHref, type ComicListItem } from "@/lib/komikuMapper";

export default function CarouselDetails() {
  const { data } = useSWR("/api/perdex/advsearch?type=Manhwa", fetcher, { revalidateOnFocus: false });
  const rows: ComicListItem[] = Array.isArray(data?.data) ? data.data : [];
  if (!rows.length) return <p className="text-sm text-slate-500">Rekomendasi belum tersedia.</p>;
  return (
    <Swiper slidesPerView={2.7} spaceBetween={12} breakpoints={{ 640: { slidesPerView: 4 }, 1024: { slidesPerView: 6 } }} className="mySwiper">
      {rows.map((item, index) => <SwiperSlide key={`${item.slug}-${index}`}>
        <NavLink href={detailHref(item.slug || item.manga_slug)} className="group block">
          <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.07] bg-[#15111e]"><FallbackImage src={item.banner || "/icon-192x192.png"} fallbackSrc={item.bannerFallback} alt={`Sampul ${item.title}`} width={300} height={420} unoptimized loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.045]" /></div>
          <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-200 group-hover:text-violet-200">{item.title}</p>
        </NavLink>
      </SwiperSlide>)}
    </Swiper>
  );
}
