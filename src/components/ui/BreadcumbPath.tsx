"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function BreadcumbPath() {
  const path = usePathname();
  const params = useSearchParams();
  const segment = path.split("/").filter(Boolean).pop() || "Beranda";
  const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
  return <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><Link href="/" className="transition hover:text-violet-200">PerDex</Link><span>/</span><span className="text-violet-200">{path === "/search" ? "Pencarian" : label}</span>{params.get("q") && <><span>/</span><span className="max-w-[55vw] truncate text-slate-300">{params.get("q")}</span></>}</div>;
}
