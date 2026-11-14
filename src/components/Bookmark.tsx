"use client";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmark";
import { dbRequest } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

const Bookmark = ({ image, rating, title, totalChapter }: { image: string; rating: string; totalChapter: number; title: string; session?: any }) => {
  const pathname = usePathname();
  const { user, session, loading } = useAuth();
  const slug = useMemo(() => pathname.split("/").filter(Boolean).pop() || pathname, [pathname]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    if (loading) return;
    if (user && session) {
      dbRequest<any[]>("perdex_bookmarks", `select=comic_slug&user_id=eq.${user.id}&comic_slug=eq.${encodeURIComponent(slug)}&limit=1`, { session })
        .then((rows) => { if (active) setSaved(Boolean(rows?.length)); })
        .catch(() => { if (active) setSaved(false); });
    } else setSaved(isBookmarked(pathname));
    const sync = () => { if (!user) setSaved(isBookmarked(pathname)); };
    window.addEventListener("perdex:bookmark-changed", sync);
    window.addEventListener("storage", sync);
    return () => { active = false; window.removeEventListener("perdex:bookmark-changed", sync); window.removeEventListener("storage", sync); };
  }, [pathname, slug, user?.id, session?.access_token, loading]);
  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (user && session) {
        if (saved) {
          await dbRequest("perdex_bookmarks", `user_id=eq.${user.id}&comic_slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE", session, prefer: "return=minimal" });
          setSaved(false); toast.success("Bookmark dihapus dari akun.");
        } else {
          await dbRequest("perdex_bookmarks", "on_conflict=user_id,comic_slug", { method: "POST", session, prefer: "resolution=merge-duplicates,return=minimal", body: { user_id: user.id, comic_slug: slug.slice(0, 240), comic_title: title.slice(0, 240), cover_url: image || null, comic_url: pathname, rating: rating || null, total_chapters: totalChapter || 0 } });
          setSaved(true); toast.success("Bookmark tersimpan di akun.");
        }
      } else {
        const added = toggleBookmark({ id: pathname, image: image || "/icon-192x192.png", rating, title, totalChapter, url: pathname });
        setSaved(added); toast.success(added ? "Ditambahkan ke bookmark lokal" : "Bookmark dihapus");
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Bookmark gagal disimpan"); }
    finally { setBusy(false); }
  };
  return <button type="button" onClick={handleToggle} disabled={busy || loading} aria-label={saved ? "Hapus dari bookmark" : "Tambahkan ke bookmark"} aria-pressed={saved} className="bg-[#211b30] hover:bg-[#33234d] py-3 px-3 rounded-full text-violet-200 transition-colors disabled:opacity-50">
    <svg xmlns="http://www.w3.org/2000/svg" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d={saved ? "M5 4.75A1.75 1.75 0 016.75 3h10.5A1.75 1.75 0 0119 4.75v16l-7-4-7 4v-16z" : "M12 4.5v15m7.5-7.5h-15"} /></svg>
  </button>;
};
export default Bookmark;
