export type BookmarkItem = {
  id: string; title: string; image: string; rating?: string;
  totalChapter?: number; url?: string; savedAt: number;
};
const KEY = "perdex_bookmarks_v2";
const LEGACY_KEY = "perdex_bookmarks";

export function getBookmarks(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY) ?? "[]";
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is BookmarkItem => Boolean(item && typeof item.id === "string" && typeof item.title === "string"))
      .map((item) => ({ ...item, image: typeof item.image === "string" ? item.image : "/icon-192x192.png", savedAt: Number(item.savedAt) || Date.now() }));
  } catch { return []; }
}
export function isBookmarked(id: string) { return getBookmarks().some((item) => item.id === id); }
function save(list: BookmarkItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("perdex:bookmark-changed"));
    return true;
  } catch { return false; }
}
export function toggleBookmark(item: Omit<BookmarkItem, "savedAt">) {
  const list = getBookmarks();
  const exists = list.some((saved) => saved.id === item.id);
  const next = exists ? list.filter((saved) => saved.id !== item.id) : [{ ...item, savedAt: Date.now() }, ...list];
  if (!save(next)) throw new Error("Penyimpanan browser penuh atau tidak tersedia");
  return !exists;
}
export function removeBookmark(id: string) { save(getBookmarks().filter((item) => item.id !== id)); }
