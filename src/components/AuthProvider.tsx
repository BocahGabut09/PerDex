"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { acceptOAuthRedirect, dbRequest, getSession, getValidSession, saveSession, type PerDexSession, type PerDexUser } from "@/lib/supabase";
import { getBookmarks } from "@/lib/bookmark";
import { getReadingHistory } from "@/lib/readingHistory";
import ReleaseNotificationWatcher from "@/components/ReleaseNotificationWatcher";

type AuthContextValue = { user: PerDexUser | null; session: PerDexSession | null; loading: boolean; refresh: () => Promise<void> };
const AuthContext = createContext<AuthContextValue>({ user: null, session: null, loading: true, refresh: async () => {} });

async function syncLocalData(session: PerDexSession) {
  // Merge browser-only guest data into this account; never delete the local copy.
  const bookmarks = getBookmarks();
  if (bookmarks.length) await dbRequest("perdex_bookmarks", "on_conflict=user_id,comic_slug", { method: "POST", session, prefer: "resolution=merge-duplicates,return=minimal", body: bookmarks.map((item) => ({ user_id: session.user.id, comic_slug: item.id.replace(/^\//, "").split("/").pop() || item.id, comic_title: item.title.slice(0, 240), cover_url: item.image, comic_url: item.url, rating: item.rating || null, total_chapters: item.totalChapter || 0 })) }).catch(() => {});
  const history = getReadingHistory();
  if (history.length) await dbRequest("perdex_reading_history", "on_conflict=user_id,comic_slug", { method: "POST", session, prefer: "resolution=merge-duplicates,return=minimal", body: history.map((item) => ({ user_id: session.user.id, comic_slug: item.comicSlug.slice(0, 240), comic_title: item.comicTitle.slice(0, 240), chapter_id: item.chapterId, chapter_title: item.chapterTitle.slice(0, 240), last_page: item.lastPage, total_pages: item.totalPages, progress: item.progress })) }).catch(() => {});
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PerDexSession | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => { const next = await getValidSession(); setSession(next); };
  useEffect(() => {
    let mounted = true;
    (async () => {
      try { const oauthSession = await acceptOAuthRedirect(); const next = oauthSession || await getValidSession(); if (next) await syncLocalData(next); if (mounted) setSession(next); }
      catch (error) { console.warn("PerDex auth init:", error); if (mounted) setSession(getSession()); }
      finally { if (mounted) setLoading(false); }
    })();
    const onChange = () => { setSession(getSession()); };
    window.addEventListener("perdex:auth-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => { mounted = false; window.removeEventListener("perdex:auth-changed", onChange); window.removeEventListener("storage", onChange); };
  }, []);
  const value = useMemo(() => ({ user: session?.user || null, session, loading, refresh }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}<ReleaseNotificationWatcher /></AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
