export type OfflinePage = { blob: Blob; alt: string };
export type OfflineSourcePage = { url: string; fallbackUrl?: string; alt: string };
export type OfflineChapter = { id: string; comicSlug: string; title: string; savedAt: number; pages: OfflinePage[] };
const DB_NAME = "perdex-offline-v1"; const STORE = "chapters";
function openDb(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" }); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
export async function cacheChapterOffline(chapter: Omit<OfflineChapter, "pages"> & { pages: OfflineSourcePage[] }, onProgress?: (done: number, total: number) => void) {
  if (typeof indexedDB === "undefined") throw new Error("Penyimpanan offline tidak didukung browser ini.");
  const pages: OfflinePage[] = [];
  for (let i = 0; i < chapter.pages.length; i += 1) {
    const page = chapter.pages[i];
    let response: Response;
    try { response = await fetch(page.url, { mode: "cors", credentials: "omit", cache: "force-cache" }); }
    catch { if (!page.fallbackUrl) throw new Error(`Halaman ${i + 1} tidak dapat diakses untuk cache offline (server gambar membatasi akses).`); response = await fetch(page.fallbackUrl, { mode: "cors", credentials: "omit", cache: "force-cache" }); }
    if (!response.ok) throw new Error(`Gagal menyimpan halaman ${i + 1}.`);
    pages.push({ blob: await response.blob(), alt: page.alt }); onProgress?.(i + 1, chapter.pages.length);
  }
  const db = await openDb(); await new Promise<void>((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put({ ...chapter, pages, savedAt: Date.now() }); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
}
export async function listOfflineChapters(): Promise<Omit<OfflineChapter, "pages">[]> { const db = await openDb(); const rows = await new Promise<OfflineChapter[]>((resolve, reject) => { const req = db.transaction(STORE).objectStore(STORE).getAll(); req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error); }); db.close(); return rows.map(({ pages, ...meta }) => meta).sort((a, b) => b.savedAt - a.savedAt); }
export async function getOfflineChapter(id: string): Promise<OfflineChapter | null> { const db = await openDb(); const row = await new Promise<OfflineChapter | null>((resolve, reject) => { const req = db.transaction(STORE).objectStore(STORE).get(id); req.onsuccess = () => resolve(req.result || null); req.onerror = () => reject(req.error); }); db.close(); return row; }
export async function deleteOfflineChapter(id: string) { const db = await openDb(); await new Promise<void>((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close(); }
