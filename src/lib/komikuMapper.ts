const API_BASE = (process.env.NEXT_PERDEX_APIURL || "https://komiku-rest-api.onrender.com").replace(/\/+$/, "");

export type ComicListItem = {
  manga_slug: string;
  slug: string;
  title: string;
  banner: string;
  bannerFallback?: string;
  image: string;
  rating: string;
  type: string;
  genre?: string;
  chapter: string;
  hasNext: boolean;
  hasPrev: boolean;
};

type MapOptions = { defaultType?: string; typeFilter?: string };
const FALLBACK_IMAGE = "/icon-192x192.png";

/** Prefer the original image CDN; proxyImg remains available as a fallback. */
export const directImg = (url?: unknown): string => {
  const raw = typeof url === "string" ? url.trim() : textValue((url as any)?.src, (url as any)?.url);
  if (!raw || /^(data:|blob:|javascript:)/i.test(raw)) return FALLBACK_IMAGE;
  if (/^\/(?:icon-[^/]+|favicon\.png|profile\.png|social-banner\.png|svg\/)/i.test(raw)) return raw;
  try {
    const parsed = new URL(raw, API_BASE);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return FALLBACK_IMAGE;
    return parsed.toString();
  } catch {
    return FALLBACK_IMAGE;
  }
};

/** Keep proxy query strings intact. Never strip `?url=...` from this value. */
export const proxyImg = (url?: unknown): string => {
  const raw = typeof url === "string" ? url.trim() : textValue((url as any)?.src, (url as any)?.url);
  if (!raw || /^(data:|blob:|javascript:)/i.test(raw)) return FALLBACK_IMAGE;
  if (/^\/(?:icon-[^/]+|favicon\.png|profile\.png|social-banner\.png|svg\/)/i.test(raw)) return raw;

  try {
    const parsed = new URL(raw, API_BASE);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return FALLBACK_IMAGE;
    const apiOrigin = new URL(API_BASE).origin;
    if (parsed.origin === apiOrigin && parsed.pathname === "/image-proxy") return parsed.toString();
    return `${API_BASE}/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return FALLBACK_IMAGE;
  }
};

function textValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

export const extractSlug = (item: any): string => {
  const direct = textValue(item?.slug, item?.manga_slug, item?.mangaSlug, item?.permalink, item?.id);
  const link = direct || textValue(
    item?.apiDetailLink,
    item?.detailUrl,
    item?.apiMangaLink,
    item?.apiLink,
    item?.originalLink,
    item?.link,
    item?.url,
    item?.href
  );
  if (!link) return "";

  let value = link;
  try {
    if (/^https?:\/\//i.test(value)) value = new URL(value).pathname;
  } catch { /* Keep raw path and normalize below. */ }

  value = value.split("?")[0].split("#")[0];
  const detailMatch = value.match(/(?:detail-komik|manga)\/([^/]+)/i);
  if (detailMatch?.[1]) value = detailMatch[1];
  else value = value.split("/").filter(Boolean).pop() || "";

  try { value = decodeURIComponent(value); } catch { /* Already decoded or malformed. */ }
  return value.replace(/^Komik\s+/i, "").trim();
};

function unwrap(raw: any): any {
  let current = raw;
  for (let depth = 0; depth < 4 && current && !Array.isArray(current); depth += 1) {
    const nested = current.data ?? current.result ?? current.response;
    if (!nested || typeof nested !== "object") break;
    current = nested;
  }
  return current;
}

function getItems(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  const candidates = [
    raw?.items, raw?.results, raw?.comics, raw?.komik, raw?.list,
    raw?.manga?.items, raw?.manhwa?.items, raw?.manhua?.items,
    raw?.data?.items, raw?.data?.results,
  ];
  return candidates.find(Array.isArray) || [];
}

function chapterText(item: any): string {
  const latest = item?.latestChapter ?? item?.latest_chapter ?? item?.newestChapter ?? item?.lastChapter;
  return textValue(
    typeof latest === "object" ? latest?.title : latest,
    item?.firstChapter?.title,
    item?.chapters?.latest?.chapter,
    item?.latest?.chapter,
    item?.chapter,
    item?.chapterTitle,
    item?.episode
  ) || "Chapter terbaru";
}

export const mapComicList = (rawList: any, options: MapOptions = {}): ComicListItem[] => {
  const raw = unwrap(rawList);
  const arr = getItems(raw);
  const typeFilter = (options.typeFilter || "").toLowerCase();
  const defaultType = options.defaultType || "Komik";

  return arr.map((item: any) => {
    const slug = extractSlug(item);
    const cover = textValue(item?.thumbnail, item?.image, item?.cover, item?.banner, item?.poster, item?.img);
    const title = textValue(item?.title, item?.name, item?.judul) || "Tanpa Judul";
    const type = textValue(item?.type, item?.jenis, item?.category, item?.tipe, item?.Tipe, item?.info?.Tipe, item?.info?.Jenis) || defaultType;
    return {
      manga_slug: slug,
      slug,
      title: title.replace(/^Komik\s+/i, "").trim(),
      banner: directImg(cover),
      bannerFallback: proxyImg(cover),
      image: directImg(cover),
      rating: textValue(item?.rating, item?.score, item?.rate) || "-",
      type,
      genre: textValue(item?.genre, item?.genres),
      chapter: chapterText(item),
      hasNext: true,
      hasPrev: false,
    };
  }).filter((item: ComicListItem) => {
    if (!item.slug) return false;
    // Category pagination uses the general /pustaka endpoint. Keep only
    // records explicitly identified as the requested category so other
    // comic types are never mixed into a category page.
    return !typeFilter || item.type.toLowerCase() === typeFilter;
  });
};

export const detailHref = (slug: string): string => `/manga/${encodeURIComponent(slug)}`;
