"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import { dbRequest, isEmailVerified } from "@/lib/supabase";

type Review = { id: number; body: string; created_at: string; user_id: string };
export default function ComicFeaturePanel({ slug, title, cover, latestChapter }: { slug: string; title: string; cover: string; latestChapter: string }) {
  const { user, session } = useAuth();
  const [score, setScore] = useState(8); const [avg, setAvg] = useState<number | null>(null); const [ratingCount, setRatingCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]); const [reviewBody, setReviewBody] = useState("");
  const [reason, setReason] = useState("broken_images"); const [reportDetails, setReportDetails] = useState("");
  const [collectionName, setCollectionName] = useState("Favorit"); const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const slugKey = useMemo(() => slug.replace(/^\//, "").slice(0, 240), [slug]);

  async function loadCommunity() {
    try {
      const ratings = await dbRequest<any[]>("perdex_ratings", `select=score&comic_slug=eq.${encodeURIComponent(slugKey)}`, { session: null });
      const values = (ratings || []).map((item) => Number(item.score)).filter((n) => n >= 1 && n <= 10);
      setRatingCount(values.length); setAvg(values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
    } catch { /* Public score panel remains usable when the API is temporarily unavailable. */ }
    try { const rows = await dbRequest<Review[]>("perdex_reviews", `select=id,body,created_at,user_id&comic_slug=eq.${encodeURIComponent(slugKey)}&status=eq.visible&order=created_at.desc&limit=12`, { session: null }); setReviews(rows || []); } catch { setReviews([]); }
    if (user && session) {
      try { const own = await dbRequest<any[]>("perdex_ratings", `select=score&user_id=eq.${user.id}&comic_slug=eq.${encodeURIComponent(slugKey)}&limit=1`, { session }); if (own?.[0]) setScore(Number(own[0].score)); } catch { /* ignore */ }
      try { const rows = await dbRequest<any[]>("perdex_notification_subscriptions", `select=enabled&user_id=eq.${user.id}&comic_slug=eq.${encodeURIComponent(slugKey)}&limit=1`, { session }); setSubscribed(Boolean(rows?.[0]?.enabled)); } catch { /* ignore */ }
    } else {
      try { setScore(Number(localStorage.getItem(`perdex:rating:${slugKey}`) || 8)); setSubscribed(localStorage.getItem(`perdex:notify:${slugKey}`) === "1"); } catch { /* ignore */ }
    }
  }
  useEffect(() => { void loadCommunity(); }, [slugKey, user?.id]);

  async function submitRating() {
    if (!user || !session || !isEmailVerified(user)) { toast.error("Login dengan email terverifikasi untuk memberi rating."); return; }
    setBusy(true);
    try { await dbRequest("perdex_ratings", "on_conflict=user_id,comic_slug", { method: "POST", session, prefer: "resolution=merge-duplicates,return=minimal", body: { user_id: user.id, comic_slug: slugKey, score } }); toast.success("Rating tersimpan!"); await loadCommunity(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Rating gagal disimpan."); }
    finally { setBusy(false); }
  }
  async function submitReview(event: FormEvent) {
    event.preventDefault(); if (!user || !session || !isEmailVerified(user)) { toast.error("Login dengan email terverifikasi untuk menulis review."); return; }
    if (reviewBody.trim().length < 5) { toast.error("Review minimal 5 karakter."); return; }
    setBusy(true);
    try { await dbRequest("perdex_reviews", "", { method: "POST", session, prefer: "return=minimal", body: { user_id: user.id, comic_slug: slugKey, comic_title: title.slice(0, 240), body: reviewBody.trim().slice(0, 1200), status: "visible" } }); setReviewBody(""); toast.success("Review berhasil dikirim."); await loadCommunity(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Review gagal dikirim."); }
    finally { setBusy(false); }
  }
  async function toggleNotifications() {
    if (!user || !session || !isEmailVerified(user)) { toast.error("Login dengan email terverifikasi untuk mengikuti update chapter."); return; }
    if (!("Notification" in window)) { toast.error("Browser ini belum mendukung notifikasi."); return; }
    if (!subscribed) {
      const permission = await Notification.requestPermission(); if (permission !== "granted") { toast.error("Izin notifikasi belum diberikan."); return; }
      try { await dbRequest("perdex_notification_subscriptions", "on_conflict=user_id,comic_slug", { method: "POST", session, prefer: "resolution=merge-duplicates,return=minimal", body: { user_id: user.id, comic_slug: slugKey, comic_title: title.slice(0, 240), last_seen_chapter: latestChapter || null, enabled: true } }); setSubscribed(true); toast.success("Notifikasi chapter diaktifkan."); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Gagal mengaktifkan notifikasi."); }
    } else {
      await dbRequest("perdex_notification_subscriptions", `user_id=eq.${user.id}&comic_slug=eq.${encodeURIComponent(slugKey)}`, { method: "PATCH", session, prefer: "return=minimal", body: { enabled: false } }); setSubscribed(false); toast.success("Notifikasi dimatikan.");
    }
  }
  async function submitReport(event: FormEvent) {
    event.preventDefault(); if (!user || !session || !isEmailVerified(user)) { toast.error("Login dengan email terverifikasi untuk melaporkan chapter."); return; }
    setBusy(true);
    try { await dbRequest("perdex_reports", "", { method: "POST", session, prefer: "return=minimal", body: { user_id: user.id, comic_slug: slugKey, chapter_id: null, reason, details: reportDetails.trim().slice(0, 600) || null } }); setReportDetails(""); toast.success("Laporan berhasil dikirim. Terima kasih!"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Laporan gagal dikirim."); }
    finally { setBusy(false); }
  }
  async function addCollection(event: FormEvent) {
    event.preventDefault();
    if (!user || !session || !isEmailVerified(user)) {
      try { const key = "perdex_guest_collections_v1"; const current = JSON.parse(localStorage.getItem(key) || "{}"); current[collectionName] = [...(current[collectionName] || []).filter((item: any) => item.slug !== slugKey), { slug: slugKey, title, cover, url: `/manga/${slugKey}` }]; localStorage.setItem(key, JSON.stringify(current)); toast.success("Ditambahkan ke koleksi lokal."); }
      catch { toast.error("Koleksi lokal tidak dapat disimpan."); }
      return;
    }
    if (!collectionName.trim()) { toast.error("Nama koleksi harus diisi."); return; }
    setBusy(true);
    try {
      let collections = await dbRequest<any[]>("perdex_collections", `select=id,name&user_id=eq.${user.id}&name=eq.${encodeURIComponent(collectionName.trim())}&limit=1`, { session });
      let collectionId = collections?.[0]?.id;
      if (!collectionId) { const created = await dbRequest<any[]>("perdex_collections", "select=id", { method: "POST", session, prefer: "return=representation", body: { user_id: user.id, name: collectionName.trim().slice(0, 48), description: "Koleksi komik PerDex" } }); collectionId = created?.[0]?.id; }
      if (!collectionId) throw new Error("Koleksi gagal dibuat.");
      await dbRequest("perdex_collection_items", "on_conflict=collection_id,comic_slug", { method: "POST", session, prefer: "resolution=merge-duplicates,return=minimal", body: { collection_id: collectionId, comic_slug: slugKey, comic_title: title.slice(0, 240), cover_url: cover, comic_url: `/manga/${slugKey}` } });
      toast.success("Komik masuk ke koleksi.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Tidak bisa menambahkan koleksi."); }
    finally { setBusy(false); }
  }

  return <section className="mt-10 grid gap-4 lg:grid-cols-2">
    <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] p-5">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Komunitas</p><h2 className="mt-1 text-lg font-bold text-white">Rating & review</h2></div><div className="text-right"><p className="text-xl font-black text-amber-300">{avg ? avg.toFixed(1) : "—"}/10</p><p className="text-[10px] text-slate-500">{ratingCount} rating</p></div></div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><select value={score} onChange={(e) => setScore(Number(e.target.value))} className="rounded-xl border border-white/10 bg-[#1a1227] px-3 py-2 text-sm text-white">{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option value={n} key={n}>{n}/10</option>)}</select><button disabled={busy} onClick={submitRating} className="rounded-xl bg-violet-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Kirim rating</button></div>
      <form onSubmit={submitReview} className="mt-5"><label className="mb-2 block text-xs font-semibold text-slate-300">Tulis review</label><textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} maxLength={1200} rows={3} placeholder="Apa pendapatmu tentang komik ini?" className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-300/40"/><div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-slate-600">5–1200 karakter · Login diperlukan</span><button disabled={busy || reviewBody.trim().length < 5} className="rounded-lg border border-violet-300/20 px-3 py-2 text-xs font-bold text-violet-100 disabled:opacity-40">Kirim review</button></div></form>
      <div className="mt-5 space-y-3">{reviews.length ? reviews.map((review) => <article key={review.id} className="rounded-xl bg-white/[0.03] p-3"><p className="text-xs leading-6 text-slate-300">{review.body}</p><p className="mt-2 text-[10px] text-slate-600">Pembaca PerDex · {new Date(review.created_at).toLocaleDateString("id-ID")}</p></article>) : <p className="text-xs text-slate-500">Belum ada review. Jadilah yang pertama.</p>}</div>
      {!user && <Link href="/auth" className="mt-3 inline-block text-xs font-semibold text-violet-300">Login untuk memberi rating & review →</Link>}
    </div>
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Update chapter</p><h2 className="mt-1 text-lg font-bold text-white">Notifikasi komik</h2><p className="mt-2 text-xs leading-6 text-slate-500">Pantau update saat PerDex terbuka. Browser harus mengizinkan notifikasi dan akun harus login.</p><button onClick={toggleNotifications} className={`mt-4 rounded-xl px-4 py-2.5 text-xs font-bold ${subscribed ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "bg-violet-500 text-white"}`}>{subscribed ? "✓ Mengikuti update" : "Aktifkan notifikasi"}</button></div>
      <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Koleksi</p><h2 className="mt-1 text-lg font-bold text-white">Simpan ke koleksi</h2><form onSubmit={addCollection} className="mt-4 flex gap-2"><input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} maxLength={48} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none" placeholder="Nama koleksi"/><button disabled={busy} className="rounded-xl bg-violet-500 px-4 text-xs font-bold text-white disabled:opacity-50">Simpan</button></form><p className="mt-2 text-[10px] text-slate-600">Pengunjung menyimpan lokal; akun login menyimpan di cloud.</p></div>
      <div className="rounded-2xl border border-white/[0.07] bg-[#100d18] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Bantuan</p><h2 className="mt-1 text-lg font-bold text-white">Laporkan masalah</h2><form onSubmit={submitReport} className="mt-4 space-y-2"><select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1a1227] px-3 py-2.5 text-sm text-white"><option value="broken_images">Gambar rusak</option><option value="wrong_order">Urutan gambar salah</option><option value="wrong_chapter">Chapter salah</option><option value="not_loading">Tidak bisa dimuat</option><option value="other">Lainnya</option></select><textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} rows={2} maxLength={600} placeholder="Keterangan tambahan (opsional)" className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none"/><button disabled={busy} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-200 disabled:opacity-40">Kirim laporan</button></form><p className="mt-2 text-[10px] text-slate-600">Wajib login untuk mengirim laporan.</p></div>
    </div>
  </section>;
}
