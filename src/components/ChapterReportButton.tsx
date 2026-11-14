"use client";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { HiFlag, HiX } from "react-icons/hi";
import { useAuth } from "@/components/AuthProvider";
import { dbRequest, isEmailVerified } from "@/lib/supabase";

export default function ChapterReportButton({ comicSlug, chapterId }: { comicSlug: string; chapterId: string }) {
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("broken_images");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !session || !isEmailVerified(user)) { toast.error("Login dengan email terverifikasi untuk melaporkan chapter."); return; }
    setBusy(true);
    try {
      await dbRequest("perdex_reports", "", { method: "POST", session, prefer: "return=minimal", body: { user_id: user.id, comic_slug: comicSlug.slice(0, 240), chapter_id: chapterId.slice(0, 240), reason, details: details.trim().slice(0, 600) || null } });
      toast.success("Laporan chapter terkirim. Terima kasih!"); setOpen(false); setDetails("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Laporan gagal dikirim."); }
    finally { setBusy(false); }
  }
  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-rose-300/30 hover:text-rose-200"><HiFlag className="h-4 w-4"/> Laporkan</button>
    {open && <div className="absolute right-0 top-11 z-50 w-[min(88vw,330px)] rounded-2xl border border-white/10 bg-[#151020] p-4 shadow-2xl shadow-black/50">
      <div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold text-white">Laporkan chapter</p><button type="button" onClick={() => setOpen(false)} aria-label="Tutup laporan" className="rounded-full p-1 text-slate-500 hover:text-white"><HiX/></button></div>
      <form onSubmit={submit} className="space-y-3"><select value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#211b30] px-3 py-2.5 text-xs text-white"><option value="broken_images">Gambar rusak</option><option value="wrong_order">Urutan gambar salah</option><option value="wrong_chapter">Chapter salah</option><option value="not_loading">Tidak bisa dimuat</option><option value="other">Lainnya</option></select><textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} maxLength={600} placeholder="Keterangan tambahan (opsional)" className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white outline-none placeholder:text-slate-600"/><button disabled={busy} className="w-full rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy ? "Mengirim..." : "Kirim laporan"}</button></form>
      {!user && <p className="mt-2 text-[10px] text-slate-500">Login dan verifikasi email diperlukan.</p>}
    </div>}
  </div>;
}
