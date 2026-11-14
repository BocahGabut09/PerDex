import { fetchRead } from "@/action/fetchKomik";
import Chapter from "./Chapter";
import siteMetadata from "@/lib/seo/siteMetadata";
import Link from "next/link";

export async function generateMetadata({ params }: any) {
  const id = params?.id;
  const title = params?.id
    .replace(/-/g, " ")
    .replace(/\b\w/g, (firstChar: string) => firstChar.toUpperCase());
  return {
    title: title,
    description: siteMetadata.description,
    icons: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon.png",
      },
    ],
    openGraph: {
      title: title,
      description: siteMetadata.description,
      url: `${siteMetadata.siteUrl}/komik/baca-chapter/chapter/${id}`,
      siteName: title,
      images: [siteMetadata.socialBanner],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: siteMetadata.description,
      images: [siteMetadata.socialBanner],
    },
  };
}

const page = async ({ params }: any) => {
  const id = String(params?.id || "");
  try {
    const getReadChapter = await fetchRead(id);
    if (!getReadChapter?.data?.length) throw new Error("Gambar chapter tidak ditemukan");
    return <Chapter dataRead={getReadChapter} id={id} />;
  } catch (error) {
    console.error("PerDex chapter failed:", error);
    return <main className="min-h-[55vh] flex flex-col items-center justify-center px-5 text-center text-white"><h1 className="text-2xl sm:text-3xl font-bold">Chapter belum bisa dimuat</h1><p className="mt-3 max-w-lg text-gray-400">Server sumber sedang lambat, chapter mungkin sudah berubah, atau gambarnya tidak tersedia. Coba lagi nanti.</p><div className="mt-5 flex gap-3"><Link href="/" className="rounded-lg bg-violet-600 px-5 py-2">Beranda</Link><Link href={`/baca-chapter/${encodeURIComponent(id)}`} className="rounded-lg border border-violet-500 px-5 py-2">Coba lagi</Link></div></main>;
  }
};

export default page;