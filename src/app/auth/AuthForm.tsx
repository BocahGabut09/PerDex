"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { HiArrowLeft, HiCheckCircle, HiLockClosed, HiMail } from "react-icons/hi";
import { requestPasswordReset, signIn, signInWithGoogle, signUp, saveSession, updatePassword, type PerDexSession } from "@/lib/supabase";

declare global { interface Window { turnstile?: { render: (el: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void } } }
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

function Turnstile({ onToken }: { onToken: (value: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  useEffect(() => {
    if (!SITE_KEY || !container.current) return;
    const render = () => {
      if (!window.turnstile || !container.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, { sitekey: SITE_KEY, theme: "dark", callback: (token: string) => onToken(token), "expired-callback": () => onToken(""), "error-callback": () => onToken("") });
    };
    let script = document.querySelector<HTMLScriptElement>("#perdex-turnstile-script");
    if (!script) { script = document.createElement("script"); script.id = "perdex-turnstile-script"; script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; document.head.appendChild(script); }
    script.addEventListener("load", render); render();
    return () => { script?.removeEventListener("load", render); if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current); widgetId.current = null; };
  }, [onToken]);
  return SITE_KEY ? <div className="mt-4"><div ref={container} /><p className="mt-1 text-[10px] text-slate-500">Verifikasi anti-bot Cloudflare Turnstile.</p></div> : <p className="mt-4 text-[11px] text-slate-500">Perlindungan CAPTCHA akan aktif setelah Turnstile dikonfigurasi di Supabase.</p>;
}

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "register" | "reset" | "update">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [notice, setNotice] = useState(""); const [captcha, setCaptcha] = useState("");
  useEffect(() => { const params = new URLSearchParams(location.search); if (params.get("verified") === "1") setNotice("Email berhasil diverifikasi. Sekarang kamu bisa login."); if (params.get("reset") === "1") setMode("update"); }, []);
  const onCaptcha = useCallback((value: string) => setCaptcha(value), []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setNotice("");
    try {
      if (mode === "register") {
        const result = await signUp(email.trim(), password, captcha || undefined);
        if (result.access_token && result.refresh_token && result.user) {
          const session: PerDexSession = { access_token: result.access_token, refresh_token: result.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (result.expires_in || 3600), user: result.user };
          saveSession(session); location.assign("/profile"); return;
        }
        setNotice("Pendaftaran berhasil dikirim. Periksa email dan klik tautan verifikasi sebelum login.");
      } else if (mode === "reset") {
        await requestPasswordReset(email.trim(), `${location.origin}/auth?reset=1`, captcha || undefined);
        setNotice("Tautan pemulihan dikirim bila alamat email terdaftar. Periksa kotak masuk dan spam.");
      } else if (mode === "update") {
        await updatePassword(password);
        setMode("login"); setPassword(""); setNotice("Password berhasil diperbarui. Silakan login kembali.");
      } else {
        const result = await signIn(email.trim(), password, captcha || undefined);
        if (!result.access_token || !result.refresh_token || !result.user) throw new Error("Login gagal. Periksa email dan password.");
        if (!result.user.email_confirmed_at) throw new Error("Email belum diverifikasi. Periksa inbox untuk tautan verifikasi.");
        saveSession({ access_token: result.access_token, refresh_token: result.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (result.expires_in || 3600), user: result.user });
        location.assign("/profile"); return;
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."); }
    finally { setLoading(false); setCaptcha(""); }
  }
  return <main className="mx-auto flex min-h-[80vh] w-[92%] max-w-md flex-col justify-center py-12">
    <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><HiArrowLeft /> Kembali ke PerDex</Link>
    <section className="rounded-[2rem] border border-violet-300/15 bg-[#120d1d] p-6 shadow-2xl shadow-purple-950/25 sm:p-8">
      <div className="mb-6 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-xl font-black text-violet-200">P</div><h1 className="mt-4 text-2xl font-black text-white">{mode === "login" ? "Masuk ke PerDex" : mode === "register" ? "Buat akun PerDex" : mode === "update" ? "Buat password baru" : "Reset password"}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{mode === "register" ? "Buat akun untuk menyinkronkan bookmark dan progres membaca." : mode === "reset" ? "Kami akan mengirim tautan pemulihan ke emailmu." : mode === "update" ? "Masukkan password baru untuk akun PerDex." : "Login untuk menyimpan data di cloud dan mengakses fitur komunitas."}</p></div>
      {notice && <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] p-3 text-xs leading-5 text-emerald-200"><HiCheckCircle className="mt-0.5 shrink-0" />{notice}</div>}
      <form onSubmit={submit}>
        <label className="mb-2 block text-xs font-semibold text-slate-300">Email</label><div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3"><HiMail className="text-slate-500"/><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /></div>
        {mode !== "reset" && <><label className="mb-2 block text-xs font-semibold text-slate-300">Password</label><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3"><HiLockClosed className="text-slate-500"/><input type="password" required minLength={8} autoComplete={mode === "register" || mode === "update" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /></div></>}
        <Turnstile onToken={onCaptcha} />
        <button disabled={loading || (Boolean(SITE_KEY) && !captcha)} className="mt-5 w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60">{loading ? "Memproses..." : mode === "login" ? "Masuk" : mode === "register" ? "Daftar & verifikasi email" : mode === "update" ? "Simpan password baru" : "Kirim tautan reset"}</button>
      </form>
      {mode === "login" && <button type="button" onClick={() => setMode("reset")} className="mt-4 w-full text-center text-xs text-violet-300 hover:text-white">Lupa password?</button>}
      {(mode === "login" || mode === "register") && <><div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-600"><span className="h-px flex-1 bg-white/10"/>atau<span className="h-px flex-1 bg-white/10"/></div><button type="button" onClick={signInWithGoogle} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"><span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-black text-[#4285f4]">G</span>Lanjutkan dengan Google</button></>}
      <div className="mt-6 text-center text-xs text-slate-500">{mode === "reset" || mode === "update" ? <button type="button" onClick={() => setMode("login")} className="font-semibold text-violet-300">Kembali ke login</button> : mode === "login" ? <>Belum punya akun? <button type="button" onClick={() => setMode("register")} className="font-semibold text-violet-300">Daftar</button></> : <>Sudah punya akun? <button type="button" onClick={() => setMode("login")} className="font-semibold text-violet-300">Masuk</button></>}</div>
    </section>
    <p className="mt-5 text-center text-[10px] leading-5 text-slate-600">Dengan membuat akun, kamu menyetujui aturan penggunaan PerDex. Jangan bagikan password atau kode verifikasi kepada siapa pun.</p>
  </main>;
}
