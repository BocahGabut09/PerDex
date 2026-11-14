import { fetchDetail } from "@/action/fetchKomik";
import Details from "./Details";
import siteMetadata from "@/lib/seo/siteMetadata";
import Link from "next/link";

export async function generateMetadata({ params }: any) {
  const title = String(params?.id || "Komik").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  return { title: `${title} | ${siteMetadata.title}`, description: siteMetadata.description };
}

export default async function page({ params }: any) {
  const id = String(params?.id || "");
  try {
    const data = await fetchDetail(id);
    if (!data?.data?.title) throw new Error("Data detail komik kosong");
    return <Details dataDetails={data} id={id} />;
  } catch (error) {
    console.error("PerDex detail failed:", error);
    return <main className="min-h-[55vh] flex flex-col items-center justify-center px-5 text-center text-white"><h1 className="text-2xl sm:text-3xl font-bold">Komik belum bisa dibuka</h1><p className="mt-3 max-w-lg text-gray-400">Data dari server sumber sedang tidak tersedia atau slug komik sudah berubah. Silakan coba lagi nanti.</p><div className="mt-5 flex gap-3"><Link href="/" className="rounded-lg bg-violet-600 px-5 py-2">Beranda</Link><Link href="/search" className="rounded-lg border border-violet-500 px-5 py-2">Cari komik</Link></div></main>;
  }
}
