"use client";
import { useEffect } from "react";
import { dbRequest } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function ReleaseNotificationWatcher() {
  const { session } = useAuth();
  useEffect(() => {
    if (!session?.user?.id) return;
    let stopped = false;
    const check = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const rows = await dbRequest<any[]>("perdex_notification_subscriptions", `select=*&user_id=eq.${session.user.id}&enabled=eq.true`, { session });
        for (const row of rows || []) {
          try {
            const res = await fetch(`/api/perdex/details/${encodeURIComponent(row.comic_slug)}`, { cache: "no-store" });
            if (!res.ok) continue;
            const detail = await res.json();
            const latest = detail?.data?.chapter_list?.[0]?.chapter_title || detail?.data?.chapter_list?.[0]?.chapter_slug;
            if (latest && row.last_seen_chapter && latest !== row.last_seen_chapter && "Notification" in window && Notification.permission === "granted") {
              new Notification(`Chapter baru: ${row.comic_title}`, { body: latest, icon: "/icon-192x192.png", tag: `perdex-${row.comic_slug}` });
            }
            if (latest && latest !== row.last_seen_chapter) await dbRequest("perdex_notification_subscriptions", `user_id=eq.${session.user.id}&comic_slug=eq.${encodeURIComponent(row.comic_slug)}`, { method: "PATCH", session, prefer: "return=minimal", body: { last_seen_chapter: latest } });
          } catch { /* One unavailable comic must not stop other checks. */ }
        }
      } catch { /* Notification polling is best-effort. */ }
    };
    void check();
    const timer = window.setInterval(() => void check(), 20 * 60 * 1000);
    const onFocus = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => { stopped = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", onFocus); };
  }, [session]);
  return null;
}
