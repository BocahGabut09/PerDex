export const READING_HISTORY_KEY = "perdex_reading_history_v1";
export const READING_HISTORY_EVENT = "perdex:history-changed";

export type ReadingHistoryEntry = {
  comicSlug: string;
  comicTitle: string;
  chapterId: string;
  chapterTitle: string;
  lastPage: number;
  totalPages: number;
  progress: number;
  updatedAt: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getReadingHistory(): ReadingHistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(READING_HISTORY_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ReadingHistoryEntry => Boolean(
      item && typeof item.comicSlug === "string" && typeof item.chapterId === "string"
    ));
  } catch {
    return [];
  }
}

function publishChange() {
  if (isBrowser()) window.dispatchEvent(new CustomEvent(READING_HISTORY_EVENT));
}

export function saveReadingProgress(entry: Omit<ReadingHistoryEntry, "updatedAt">) {
  if (!isBrowser() || !entry.comicSlug || !entry.chapterId) return;
  const safeEntry: ReadingHistoryEntry = {
    ...entry,
    lastPage: Math.max(0, Math.floor(entry.lastPage)),
    totalPages: Math.max(1, Math.floor(entry.totalPages)),
    progress: Math.min(100, Math.max(0, Math.round(entry.progress))),
    updatedAt: Date.now(),
  };
  const history = getReadingHistory().filter((item) => item.comicSlug !== safeEntry.comicSlug);
  history.unshift(safeEntry);
  try {
    window.localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(history.slice(0, 60)));
    publishChange();
  } catch (error) {
    console.warn("PerDex tidak dapat menyimpan history baca:", error);
  }
}

export function removeReadingHistory(comicSlug: string) {
  if (!isBrowser()) return;
  const next = getReadingHistory().filter((item) => item.comicSlug !== comicSlug);
  try {
    window.localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(next));
    publishChange();
  } catch { /* Ignore unavailable browser storage. */ }
}

export function clearReadingHistory() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(READING_HISTORY_KEY);
    publishChange();
  } catch { /* Ignore unavailable browser storage. */ }
}
