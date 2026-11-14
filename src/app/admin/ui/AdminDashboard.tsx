"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiArrowLeft, HiCheckCircle, HiChevronRight, HiCloud, HiExclamation, HiEye, HiEyeOff, HiRefresh, HiShieldCheck, HiTrash, HiUsers } from "react-icons/hi";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { dbRequest, type PerDexSession } from "@/lib/supabase";
import { verifyPerDexAdmin } from "@/lib/admin";

type Review = { id: string | number; comic_slug?: string; comic_title?: string; body?: string; created_at?: string; user_id?: string; status?: string };
type Report = { id: string | number; comic_slug?: string; chapter_id?: string | null; reason?: string; details?: string | null; created_at?: string; user_id?: string; status?: string };
type Tab = "overview" | "reviews" | "reports";

const panel = "rounded-2xl border border-white/[0.08] bg-[#120e1b]";
const button = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-violet-300/30 hover:bg-violet-300/[0.07] disabled:cursor-not-allowed disabled:opacity-40";

function dateLabel(value?: string) {
  if (!value) return "Waktu tidak tersedia";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Waktu tidak tersedia" : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminDashboard() {
  const { user, session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [apiItems, setApiItems] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setChecking(true);
    setAuthorized(false);
    if (!session?.access_token) {
      setChecking(false);
      return;
    }
    verifyPerDexAdmin(session.access_token).then((result) => {
      if (alive) setAuthorized(result);
    }).finally(() => {
      if (alive) setChecking(false);
    });
    return () => { alive = false; };
  }, [session?.access_token]);

  const loadData = useCallback(async (activeSession: PerDexSession) => {
    setDataLoading(true);
    setError("");
    setNotice("");
    const [reviewResult, reportResult, apiResult] = await Promise.allSettled([
      dbRequest<Review[]>("perdex_reviews", "select=id,comic_slug,comic_title,body,created_at,user_id,status&order=created_at.desc&limit=50", { session: activeSession }),
      dbRequest<Report[]>("perdex_reports", "select=*&order=created_at.desc&limit=50", { session: activeSession }),
      fetch("/api/perdex/lastupdated?page=1", { cache: "no-store" }),
    ]);

    if (reviewResult.status === "fulfilled") setReviews(Array.isArray(reviewResult.value) ? reviewResult.value : []);
    else setError("Data review belum dapat dibaca. Pastikan SQL Admin PerDex sudah dijalankan di Supabase.");

    if (reportResult.status === "fulfilled") setReports(Array.isArray(reportResult.value) ? reportResult.value : []);
    else setError((current) => current || "Data laporan belum dapat dibaca. Pastikan SQL Admin PerDex sudah dijalankan di Supabase.");

    if (apiResult.status === "fulfilled" && apiResult.value.ok) {
      const payload = await apiResult.value.json().catch(() => ({}));
      setApiStatus(payload?.status === "success" ? "online" : "offline");
      setApiItems(Array.isArray(payload?.data) ? payload.data.length : 0);
    } else {
      setApiStatus("offline");
      setApiItems(0);
    }
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (authorized && session) void loadData(session);
  }, [authorized, session, loadData]);

  async function changeReviewStatus(review: Review) {
    if (!session) return;
    const nextStatus = review.status === "hidden" ? "visible" : "hidden";
    try {
      await dbRequest("perdex_reviews", `id=eq.${encodeURIComponent(String(review.id))}`, { method: "PATCH", session, prefer: "return=minimal", body: { status: nextStatus } });
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, status: nextStatus } : item));
      setNotice(nextStatus === "hidden" ? "Review disembunyikan." : "Review ditampilkan kembali.");
    } catch { setError("Gagal mengubah status review. Periksa izin RLS Admin PerDex."); }
  }

  async function deleteReview(review: Review) {
    if (!session || !window.confirm(`Hapus review untuk ${review.comic_title || review.comic_slug || "komik ini"}?`)) return;
    try {
      await dbRequest("perdex_reviews", `id=eq.${encodeURIComponent(String(review.id))}`, { method: "DELETE", session, prefer: "return=minimal" });
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setNotice("Review berhasil dihapus.");
    } catch { setError("Gagal menghapus review. Periksa izin RLS Admin PerDex."); }
  }

  async function resolveReport(report: Report) {
    if (!session) return;
    try {
      await dbRequest("perdex_reports", `id=eq.${encodeURIComponent(String(report.id))}`, { method: "PATCH", session, prefer: "return=minimal", body: { status: "resolved" } });
      setReports((current) => current.map((item) => item.id === report.id ? { ...item, status: "resolved" } : item));
      setNotice("Laporan ditandai selesai.");
    } catch { setError("Gagal memperbarui laporan. Pastikan migrasi SQL Admin PerDex sudah dijalankan."); }
  }

  const openReports = useMemo(() => reports.filter((item) => item.status !== "resolved").length, [reports]);
  const visibleReviews = useMemo(() => reviews.filter((item) => item.status !== "hidden").length, [reviews]);

  return <><Navbar /><main className="mx-auto min-h-[75vh] w-[92%] max-w-7xl pb-16 pt-8">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-violet-200"><HiArrowLeft /> Kembali ke PerDex</Link><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300">PerDex Control Center</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Admin Page</h1><p className="mt-2 text-sm text-slate-500">Kelola laporan, moderasi review, dan pantau koneksi layanan.</p></div><div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-xs font-semibold text-emerald-200"><HiShieldCheck className="h-4 w-4" /> Admin terverifikasi</div></div>

    {loading || checking ? <div className={`${panel} p-8 text-center text-sm text-slate-400`}>Memverifikasi akun Google...</div> : !user || !session ? <div className={`${panel} mx-auto max-w-xl p-8 text-center`}><HiShieldCheck className="mx-auto h-10 w-10 text-violet-300"/><h2 className="mt-4 text-xl font-bold text-white">Login diperlukan</h2><p className="mt-2 text-sm leading-6 text-slate-400">Masuk menggunakan akun Google admin untuk membuka panel ini.</p><Link href="/auth" className="mt-5 inline-flex rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white">Login / Register</Link></div> : !authorized ? <div className={`${panel} mx-auto max-w-xl p-8 text-center`}><HiExclamation className="mx-auto h-10 w-10 text-amber-300"/><h2 className="mt-4 text-xl font-bold text-white">Akses ditolak</h2><p className="mt-2 text-sm leading-6 text-slate-400">Admin Page hanya tersedia untuk akun Google <b className="text-slate-200">brooscraft9@gmail.com</b>. Akun yang sedang masuk tidak memiliki izin admin.</p><Link href="/" className="mt-5 inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200">Kembali ke beranda</Link></div> : <>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${panel} p-5`}><div className="flex items-center justify-between text-slate-500"><span className="text-xs">Review terbaru</span><HiEye className="h-5 w-5 text-violet-300"/></div><p className="mt-3 text-3xl font-black text-white">{reviews.length}</p><p className="mt-1 text-[11px] text-slate-500">{visibleReviews} ditampilkan</p></div>
        <div className={`${panel} p-5`}><div className="flex items-center justify-between text-slate-500"><span className="text-xs">Laporan masuk</span><HiExclamation className="h-5 w-5 text-amber-300"/></div><p className="mt-3 text-3xl font-black text-white">{reports.length}</p><p className="mt-1 text-[11px] text-slate-500">{openReports} perlu ditangani</p></div>
        <div className={`${panel} p-5`}><div className="flex items-center justify-between text-slate-500"><span className="text-xs">Komiku REST API</span><HiCloud className="h-5 w-5 text-cyan-300"/></div><p className="mt-3 text-2xl font-black text-white">{apiStatus === "checking" ? "Memeriksa" : apiStatus === "online" ? "Online" : "Offline"}</p><p className="mt-1 text-[11px] text-slate-500">{apiItems} komik pada feed terbaru</p></div>
        <div className={`${panel} p-5`}><div className="flex items-center justify-between text-slate-500"><span className="text-xs">Akun admin</span><HiUsers className="h-5 w-5 text-fuchsia-300"/></div><p className="mt-3 truncate text-sm font-bold text-white">brooscraft9@gmail.com</p><p className="mt-1 text-[11px] text-slate-500">Google OAuth terverifikasi</p></div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{([ ["overview", "Ringkasan"], ["reviews", "Moderasi Review"], ["reports", "Laporan"] ] as [Tab, string][]).map(([tab, label]) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${activeTab === tab ? "bg-violet-500 text-white" : "border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white"}`}>{label}</button>)}</div><button type="button" onClick={() => session && void loadData(session)} disabled={dataLoading} className={button}><HiRefresh className={dataLoading ? "animate-spin" : ""}/>{dataLoading ? "Memuat..." : "Refresh data"}</button></div>

      {notice && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-xs text-emerald-200"><HiCheckCircle />{notice}</div>}
      {error && <div className="mb-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-xs leading-5 text-amber-100">{error} Jalankan file <code>SUPABASE-ADMIN-PERDEX.sql</code> yang disertakan di ZIP.</div>}

      {activeTab === "overview" && <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]"><section className={`${panel} p-5 sm:p-6`}><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-white">Aktivitas terbaru</h2><p className="mt-1 text-xs text-slate-500">Review terakhir yang masuk ke PerDex.</p></div><button onClick={() => setActiveTab("reviews")} className="inline-flex items-center gap-1 text-xs font-semibold text-violet-300">Lihat semua <HiChevronRight/></button></div>{reviews.slice(0,5).length ? <div className="space-y-3">{reviews.slice(0,5).map((item) => <article key={item.id} className="rounded-xl border border-white/[0.06] bg-black/10 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{item.comic_title || item.comic_slug || "Komik"}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{item.body || "(Review kosong)"}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${item.status === "hidden" ? "bg-amber-300/10 text-amber-200" : "bg-emerald-300/10 text-emerald-200"}`}>{item.status || "visible"}</span></div><p className="mt-2 text-[10px] text-slate-600">{dateLabel(item.created_at)}</p></article>)}</div> : <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">Belum ada review.</p>}</section>
      <section className={`${panel} p-5 sm:p-6`}><h2 className="font-bold text-white">Pemeriksaan layanan</h2><p className="mt-1 text-xs text-slate-500">Status berdasarkan request aktual ke endpoint update terbaru.</p><div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-4"><span className={`h-2.5 w-2.5 rounded-full ${apiStatus === "online" ? "bg-emerald-400" : apiStatus === "offline" ? "bg-red-400" : "bg-amber-300"}`}/><div><p className="text-sm font-semibold text-white">REST API {apiStatus === "online" ? "tersambung" : apiStatus === "offline" ? "tidak merespons" : "sedang diperiksa"}</p><p className="mt-1 text-[10px] text-slate-500">komiku-rest-api.onrender.com</p></div></div><button onClick={() => session && void loadData(session)} className={`${button} mt-4 w-full`}><HiRefresh/> Periksa ulang</button></section></div>}

      {activeTab === "reviews" && <section className={`${panel} p-5 sm:p-6`}><div className="mb-5"><h2 className="font-bold text-white">Moderasi review</h2><p className="mt-1 text-xs text-slate-500">Sembunyikan review yang tidak sesuai atau hapus review yang melanggar aturan.</p></div>{reviews.length ? <div className="space-y-3">{reviews.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold text-white">{item.comic_title || item.comic_slug || "Komik"}</p><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{item.body || "(Review kosong)"}</p><p className="mt-2 text-[10px] text-slate-600">{dateLabel(item.created_at)} · ID {String(item.id)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.status === "hidden" ? "bg-amber-300/10 text-amber-200" : "bg-emerald-300/10 text-emerald-200"}`}>{item.status || "visible"}</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void changeReviewStatus(item)} className={button}>{item.status === "hidden" ? <HiEye/> : <HiEyeOff/>}{item.status === "hidden" ? "Tampilkan" : "Sembunyikan"}</button><button onClick={() => void deleteReview(item)} className={`${button} text-red-200 hover:border-red-300/30 hover:bg-red-300/[0.06]`}><HiTrash/> Hapus</button></div></article>)}</div> : <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">Belum ada review untuk dimoderasi.</p>}</section>}

      {activeTab === "reports" && <section className={`${panel} p-5 sm:p-6`}><div className="mb-5"><h2 className="font-bold text-white">Laporan pengguna</h2><p className="mt-1 text-xs text-slate-500">Laporan chapter atau konten. Tandai selesai setelah diperiksa.</p></div>{reports.length ? <div className="space-y-3">{reports.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold text-white">{item.reason || "Laporan"}</p><p className="mt-1 text-xs text-slate-400">Komik: {item.comic_slug || "Tidak diketahui"}</p>{item.chapter_id && <p className="mt-1 text-xs text-slate-500">Chapter: {item.chapter_id}</p>}{item.details && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{item.details}</p>}<p className="mt-2 text-[10px] text-slate-600">{dateLabel(item.created_at)} · ID {String(item.id)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.status === "resolved" ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{item.status || "open"}</span></div>{item.status !== "resolved" && <button onClick={() => void resolveReport(item)} className={`${button} mt-4`}><HiCheckCircle/> Tandai selesai</button>}</article>)}</div> : <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">Belum ada laporan.</p>}</section>}

      <p className="mt-6 text-center text-[10px] leading-5 text-slate-600">Panel admin dibatasi di server untuk akun Google yang ditetapkan. Akses data juga dilindungi kebijakan RLS Supabase.</p>
    </>}
  </main></>;
}
