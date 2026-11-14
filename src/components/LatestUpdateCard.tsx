import FallbackImage from "@/components/FallbackImage";
import { MotionDiv } from "./motion/MotionDiv";
import NavLink from "./navlink/NavLink";
import { detailHref } from "@/lib/komikuMapper";
import { LatestUpdateType } from "@/types/latestUpdateType";

export default function LatestUpdateCard({ data, index }: { data: LatestUpdateType; index: number }) {
  const title = data.title || "Tanpa Judul";
  return (
    <NavLink href={detailHref(data.manga_slug)} className="block min-w-0">
      <MotionDiv className="group h-full" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.25 }}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.07] bg-[#15111e]">
          <FallbackImage src={data.banner || "/icon-192x192.png"} fallbackSrc={data.bannerFallback} alt={`Sampul ${title}`} width={300} height={420} unoptimized loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.045]" />
        </div>
        <div className="mt-2.5"><p className="line-clamp-2 min-h-9 text-xs font-semibold leading-5 text-slate-200 group-hover:text-violet-200 sm:text-sm">{title}</p><p className="mt-1 truncate text-[10px] text-slate-500 sm:text-xs">{data.chapter || "Update terbaru"}</p></div>
      </MotionDiv>
    </NavLink>
  );
}
