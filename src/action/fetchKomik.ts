import { directImg, mapComicList, proxyImg } from "@/lib/komikuMapper";

const API_BASE = (process.env.NEXT_PERDEX_APIURL || "https://komiku-rest-api.onrender.com").replace(/\/+$/, "");
const REQUEST_TIMEOUT = 18_000;

async function apiGet<T = any>(path: string, revalidateSeconds = 30): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
      // Cache successful upstream reads to avoid repeatedly hitting the Render API.
      // A short revalidation window keeps listings fresh while reducing 429 bursts.
      next: { revalidate: revalidateSeconds },
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      let details = "";
      try {
        const payload = await response.json();
        details = payload?.detail || payload?.error || payload?.message || "";
      } catch { /* The API may return a plain-text error page. */ }
      throw new Error(`Komiku API ${response.status}${details ? `: ${details}` : ""}`);
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("json")) throw new Error("Respons Komiku API bukan JSON");
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Komiku API timeout. Coba beberapa saat lagi.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function safePage(page: number) {
  return Number.isInteger(page) && page > 0 ? Math.min(page, 500) : 1;
}

function safeSlug(slug: string) {
  const value = String(slug || "").trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,180}$/.test(value)) throw new Error("Slug komik tidak valid");
  return value;
}


function safeGenreSlug(slug: string) {
  const value = String(slug || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(value)) throw new Error("Slug genre tidak valid");
  return value;
}

function unwrapPayload(raw: any) {
  let value = raw;
  for (let depth = 0; depth < 4 && value && !Array.isArray(value); depth += 1) {
    const nested = value.data ?? value.result ?? value.response;
    if (!nested || typeof nested !== "object") break;
    value = nested;
  }
  return value;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function normalizeChapterNumber(value: unknown, fallback: string): string {
  const raw = firstText(value);
  const match = raw.match(/(\d+(?:[.-]\d+)*)/);
  return match?.[1] || fallback;
}

function chapterNumber(chapter: any, index: number): string {
  const direct = firstText(chapter?.chapterNumber, chapter?.number, chapter?.chapter_no, chapter?.episode);
  if (direct) return normalizeChapterNumber(direct, String(index + 1));
  const title = firstText(chapter?.title, chapter?.name, chapter?.chapter, chapter?.slug);
  return normalizeChapterNumber(title, String(index + 1));
}

function decodePart(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}


/** Convert API-provided chapter links into the route ID used by PerDex. */
function chapterReference(value: any, fallbackSlug: string): string | null {
  if (!value) return null;

  const apiLink = typeof value === "object"
    ? firstText(value?.apiLink, value?.api_link, value?.link)
    : String(value);
  if (apiLink) {
    const match = apiLink.match(/(?:^|\/)baca-chapter\/([^/?#]+)\/([^/?#]+)/i);
    if (match?.[1] && match?.[2]) return `${decodePart(match[1])}___${decodePart(match[2])}`;
  }

  const originalLink = typeof value === "object" ? firstText(value?.originalLink, value?.href, value?.url) : "";
  if (originalLink) {
    try {
      const path = new URL(originalLink).pathname;
      const match = path.match(/\/([^/]+)-chapter-(\d+(?:[.-]\d+)*)\/?$/i);
      if (match?.[1] && match?.[2]) return `${decodePart(match[1])}___${match[2]}`;
    } catch { /* Continue with chapter-number fallback. */ }
  }

  if (typeof value === "object") {
    const explicitSlug = firstText(value?.chapterSlug, value?.chapter_slug, value?.slug);
    const explicitNumber = normalizeChapterNumber(
      value?.chapterNumber ?? value?.number ?? value?.chapter,
      ""
    );
    if (explicitSlug && explicitNumber) return `${explicitSlug}___${explicitNumber}`;
  }

  const text = typeof value === "object"
    ? firstText(value?.title, value?.name, value?.chapterNumber, value?.number, value?.chapter)
    : String(value);
  const number = normalizeChapterNumber(text, "");
  return number ? `${fallbackSlug}___${number}` : null;
}

export const fetchLastUpdated = async (page = 1) => {
  const p = safePage(page);
  // /terbaru is the first-page feed; later pages are exposed by /pustaka/page/:page.
  const raw = await apiGet(p > 1 ? `/pustaka/page/${p}` : "/terbaru", 60);
  return { status: "success", data: mapComicList(raw) };
};

export const fetchMangaByAdvSearch = async (type: string, page = 1) => {
  const p = safePage(page);
  const t = String(type || "").toLowerCase();
  const supported = ["manga", "manhwa", "manhua"].includes(t);
  const endpoint = p === 1 && supported ? `/komik-populer/${t}` : `/pustaka/page/${p}`;
  const raw = await apiGet(endpoint, 90);
  const fallbackType = supported ? t.charAt(0).toUpperCase() + t.slice(1) : "Komik";
  return {
    status: "success",
    data: mapComicList(raw, {
      defaultType: p === 1 && supported ? fallbackType : "Komik",
      typeFilter: p > 1 && supported ? fallbackType : undefined,
    }),
  };
};

export type GenreListItem = { title: string; slug: string; apiGenreLink?: string };

/** Fetch the complete genre directory exposed by the current Komiku REST API. */
export const fetchGenres = async () => {
  const raw = await apiGet<any>("/genre-all", 1800);
  const value = unwrapPayload(raw);
  const rows = Array.isArray(value) ? value : Array.isArray(raw?.data) ? raw.data : [];
  const data: GenreListItem[] = rows
    .map((item: any) => ({
      title: firstText(item?.title, item?.name, item?.titleAttr),
      slug: firstText(item?.slug, item?.apiGenreLink?.split("/").filter(Boolean).pop()).toLowerCase(),
      apiGenreLink: firstText(item?.apiGenreLink),
    }))
    .filter((item: GenreListItem) => item.title && /^[a-z0-9][a-z0-9-]{0,100}$/.test(item.slug));
  return { status: "success", data };
};

/** Fetch one genre page. The API response contains Manga, Manhwa, and Manhua together. */
export const fetchGenreComics = async (genreSlug: string, page = 1) => {
  const slug = safeGenreSlug(genreSlug);
  const p = safePage(page);
  const raw = await apiGet<any>(p === 1 ? `/genre/${encodeURIComponent(slug)}` : `/genre/${encodeURIComponent(slug)}/page/${p}`, 90);

  // Keep response metadata (especially hasNextPage) while accepting a wrapped data payload.
  let payload = raw;
  for (let depth = 0; depth < 4 && payload && !Array.isArray(payload); depth += 1) {
    const nested = payload.data ?? payload.result ?? payload.response;
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) break;
    payload = nested;
  }
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return {
    status: "success",
    genre: firstText(payload?.genre, slug),
    currentPage: Number(payload?.currentPage) || p,
    hasNextPage: typeof payload?.hasNextPage === "boolean" ? payload.hasNextPage : rows.length >= 10,
    data: mapComicList(rows),
  };
};

export const fetchMangaAdvSearch = async (title: string) => {
  const query = String(title || "").trim().slice(0, 100);
  if (!query) return { status: "success", data: [] };
  const raw = await apiGet(`/search?q=${encodeURIComponent(query)}`, 30);
  return { status: "success", data: mapComicList(raw) };
};

export const fetchDetail = async (id: string) => {
  const slug = safeSlug(id);
  const response = await apiGet<any>(`/detail-komik/${encodeURIComponent(slug)}`, 300);
  const raw = unwrapPayload(response);
  const detail = raw?.komik && typeof raw.komik === "object" ? raw.komik : raw?.comic && typeof raw.comic === "object" ? raw.comic : raw;
  const info = detail?.info || detail?.metadata || detail?.detail || {};
  const chapters = Array.isArray(detail?.chapters)
    ? detail.chapters
    : Array.isArray(detail?.chapterList)
      ? detail.chapterList
      : Array.isArray(detail?.chapter_list)
        ? detail.chapter_list
        : [];

  const chapterList = chapters.map((chapter: any, index: number) => {
    const number = chapterNumber(chapter, index);
    // The API's apiLink is canonical. Using it preserves the source chapter slug
    // and unusual numbers such as 00-1 instead of rebuilding a potentially wrong URL.
    const chapterId = chapterReference(chapter, slug) || `${slug}___${number}`;
    return {
      chapter_title: firstText(chapter?.title, chapter?.name, chapter?.chapter) || `Chapter ${number}`,
      chapter_slug: chapterId,
      chapter_release: firstText(chapter?.date, chapter?.release, chapter?.updatedAt) || "-",
    };
  });

  const bannerSource = firstText(detail?.thumbnail, detail?.image, detail?.cover, detail?.banner, detail?.poster);
  const rawGenres = detail?.genres ?? info?.Genre;
  const genres = Array.isArray(rawGenres)
    ? rawGenres.map((genre: any) => typeof genre === "string" ? genre : firstText(genre?.name, genre?.title)).filter(Boolean)
    : typeof rawGenres === "string"
      ? rawGenres.split(/[,|]/).map((genre: string) => genre.trim()).filter(Boolean)
      : [];

  return { status: "success", data: {
    title: (firstText(detail?.title, detail?.name, detail?.judul, info["Judul"]) || slug).replace(/^Komik\s+/i, "").trim(),
    banner: directImg(bannerSource),
    bannerFallback: proxyImg(bannerSource),
    type: firstText(info["Tipe"], info["Jenis Komik"], info.Jenis, detail?.type, detail?.jenis, detail?.tipe) || "Komik",
    status: firstText(info.Status, detail?.status) || "Tidak diketahui",
    rating: firstText(info.Rating, detail?.rating, detail?.score) || "-",
    description: firstText(detail?.sinopsis, detail?.description, detail?.synopsis, detail?.desc) || "Sinopsis belum tersedia.",
    genres,
    published: firstText(info.Tahun, info["Tahun Terbit"], info.Rilis, detail?.published, detail?.year) || "-",
    author: firstText(info.Pengarang, info.Author, detail?.author) || "Tidak diketahui",
    total_chapter: String(chapterList.length),
    bookmark_users: "",
    chapter_list: chapterList,
  }};
};

export const fetchRead = async (id: string) => {
  const [rawSlug, rawChapter] = String(id || "").split("___");
  const slug = safeSlug(rawSlug);
  const chapter = String(rawChapter || "1").trim();
  if (!/^\d+(?:[.-]\d+)*$/.test(chapter)) throw new Error("Nomor chapter tidak valid");

  const response = await apiGet<any>(`/baca-chapter/${encodeURIComponent(slug)}/${encodeURIComponent(chapter)}`, 300);
  const raw = unwrapPayload(response);
  const reader = raw?.chapter && typeof raw.chapter === "object" ? raw.chapter : raw;
  const imageList = Array.isArray(reader?.images)
    ? reader.images
    : Array.isArray(reader?.pages)
      ? reader.pages
      : Array.isArray(reader?.data)
        ? reader.data
        : [];
  const images = imageList
    .map((img: any, index: number) => {
      const source = typeof img === "string"
        ? img
        : firstText(img?.src, img?.url, img?.image, img?.original, img?.fallbackSrc);
      const src = directImg(source);
      if (!src || src === "/icon-192x192.png") return null;
      const fallbackSource = typeof img === "string"
        ? source
        : firstText(img?.fallbackSrc, img?.src, img?.url, img?.image, img?.original);
      return {
        // Load the image CDN directly first. Use the API proxy only as a fallback,
        // so a long chapter does not send every image through the Render service.
        src,
        fallbackSrc: proxyImg(fallbackSource || source),
        alt: typeof img === "object" ? firstText(img?.alt) || `Halaman ${index + 1}` : `Halaman ${index + 1}`,
      };
    })
    .filter((image: any) => Boolean(image));

  const navigation = reader?.navigation || {};
  const prevValue = navigation?.prevChapter || navigation?.previousChapter || navigation?.previous || reader?.prevChapter || reader?.previousChapter || reader?.has_prev?.has_prev_link;
  const nextValue = navigation?.nextChapter || navigation?.next || reader?.nextChapter || reader?.has_next?.has_next_link;
  const prev = chapterReference(prevValue, slug);
  const next = chapterReference(nextValue, slug);
  return {
    status: "success",
    title: firstText(reader?.title, reader?.chapterTitle) || `${slug} Chapter ${chapter}`,
    comicTitle: firstText(reader?.mangaInfo?.title, reader?.comicTitle, reader?.mangaTitle, reader?.manga_title),
    comicSlug: firstText(reader?.mangaInfo?.slug, slug),
    data: images,
    has_next: { has_next_link: next, is_next_link: Boolean(next) },
    has_prev: { has_prev_link: prev, is_prev_link: Boolean(prev) },
  };
};

export const fetchSearch = async (query: string) => {
  const result = await fetchMangaAdvSearch(query);
  return { statusCode: 200, ...result };
};
