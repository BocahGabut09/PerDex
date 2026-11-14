import Navbar from "@/components/Navbar";
import LatestUpdateCard from "@/components/LatestUpdateCard";
import LoadmoreLatestUpdate from "@/components/LoadmoreLatestUpdate";
import { fetchLastUpdated } from "@/action/fetchKomik";
import siteMetadata from "@/lib/seo/siteMetadata";
import type { LatestUpdateType } from "@/types/latestUpdateType";

export async function generateMetadata() { return { title: `Update Terbaru | ${siteMetadata.title}`, description: siteMetadata.description }; }

export default async function LatestUpdatedPage() {
  let rows: LatestUpdateType[] = [];
  let failed = false;
  try { rows = (await fetchLastUpdated(1)).data as unknown as LatestUpdateType[]; }
  catch (error) { console.error("PerDex latest list failed:", error); failed = true; }
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[60vh] w-[92%] max-w-7xl pb-16 pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">Pembaruan komik</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Update terbaru</h1>
        <p className="mt-2 text-sm text-slate-500">Ikuti judul yang baru saja mendapat chapter.</p>
        {failed ? <div className="mt-7 rounded-2xl border border-white/[0.07] bg-[#100d18] px-5 py-10 text-center text-sm text-slate-500">Update belum dapat dimuat. Coba lagi beberapa saat.</div> : <><div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6">{rows.map((item, index) => <LatestUpdateCard key={`${item.manga_slug}-${index}`} data={item} index={index} />)}</div><LoadmoreLatestUpdate /></>}
      </main>
    </>
  );
}
