import { fetchLastUpdated, fetchGenres } from "@/action/fetchKomik";
import { MetadataRoute } from "next";
import siteMetadata from "@/lib/seo/siteMetadata";

const MAX_PAGES = 20;

const fetchAllLatestData = async (): Promise<any[]> => {
  let allData: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_PAGES) {
    try {
      const response = await fetchLastUpdated(page);
      const data = response.data;

      if (data.length > 0) {
        allData = [...allData, ...data];
        page++;
      } else {
        hasMore = false; // Tidak ada lagi data untuk diambil
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      hasMore = false; // Hentikan fetching jika terjadi error
    }
  }

  return allData;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteMetadata.siteUrl.replace(/\/+$/, "");
  const allLatestComics = await fetchAllLatestData();
  let genreEntries: MetadataRoute.Sitemap = [];
  try {
    const genres = await fetchGenres();
    genreEntries = genres.data.map((genre) => ({
      url: `${baseUrl}/genre/${encodeURIComponent(genre.slug)}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Gagal memuat daftar genre untuk sitemap:", error);
  }

  const lastgenEntries: MetadataRoute.Sitemap = allLatestComics?.map(
    (item: any) => ({
      url: `${baseUrl}/manga/${encodeURIComponent(item?.manga_slug || item?.slug || "")}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.8,
    })
  );

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/manga`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/manhua`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/manhwa`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/genre`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...["discover", "donasi"].map((path) => ({ url: `${baseUrl}/${path}`, lastModified: new Date().toISOString(), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...genreEntries,
    ...lastgenEntries,
  ];
}