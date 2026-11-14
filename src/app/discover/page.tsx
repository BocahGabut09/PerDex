import DiscoverHub from "./DiscoverHub";
import { fetchMangaByAdvSearch, fetchGenres } from "@/action/fetchKomik";
import type { ComicListItem } from "@/lib/komikuMapper";
export const metadata = { title: "Jelajahi & Trending | PerDex" };
export default async function Page() {
  let initial: ComicListItem[] = []; let genres: any[] = [];
  try { const [a,b,c,g] = await Promise.all([fetchMangaByAdvSearch("manga"),fetchMangaByAdvSearch("manhwa"),fetchMangaByAdvSearch("manhua"),fetchGenres()]); initial = [...a.data,...b.data,...c.data]; genres = g.data; } catch { /* show empty-state with the page still available */ }
  return <DiscoverHub initial={initial} genres={genres}/>;
}
