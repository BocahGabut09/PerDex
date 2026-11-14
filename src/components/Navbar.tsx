"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineBookmark, HiOutlineMenuAlt3, HiOutlineSearch, HiX, HiUserCircle } from "react-icons/hi";
import DialogAlert from "./ui/DialogAlert";
import useModal from "@/hooks/useModal";
import { navlink } from "./utils/NavLink";
import { useAuth } from "@/components/AuthProvider";
import { verifyPerDexAdmin } from "@/lib/admin";
import { signOut } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function Navbar() {
  const { handleOpen, open, setOpen } = useModal(); const [openMenu, setOpenMenu] = useState(false); const pathname = usePathname(); const { user, session, loading } = useAuth(); const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { let active = true; setIsAdmin(false); if (session?.access_token) verifyPerDexAdmin(session.access_token).then((allowed) => { if (active) setIsAdmin(allowed); }); return () => { active = false; }; }, [session?.access_token]);
  async function handleSignOut(){ await signOut(); toast.success("Berhasil logout. Data lokal tetap tersimpan di perangkat ini."); }
  return <>
    <DialogAlert handler={handleOpen} open={open} setOpen={setOpen} />
    <header className="sticky top-0 z-40 border-b border-purple-300/15 bg-[#10091d]/95 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between px-[4%] py-3.5 sm:px-8 sm:py-4">
        <Link href="/" className="group flex items-center gap-2" aria-label="PerDex beranda"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/25 text-sm font-black text-purple-200 ring-1 ring-purple-300/30">P</span><span className="text-[1.65rem] font-extrabold tracking-[-0.07em] text-white">Per<span className="text-violet-300">Dex</span></span></Link>
        <div className="hidden items-center gap-1 md:flex">{navlink.map((item) => {const active = pathname === item.path || (item.path !== "/" && pathname.startsWith(`${item.path}/`)); return <Link key={item.path} href={item.path} className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${active ? "bg-violet-400/15 text-purple-200" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>{item.name}</Link>;})}{isAdmin && <Link href="/admin" className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${pathname.startsWith("/admin") ? "bg-violet-400/15 text-purple-200" : "text-violet-200 hover:bg-white/[0.05]"}`}>Admin Page</Link>}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleOpen} aria-label="Cari komik" className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/10"><HiOutlineSearch className="h-5 w-5"/><span className="hidden text-sm sm:inline">Cari</span></button>
          <Link href="/profile" aria-label="Bookmark dan koleksi" className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${pathname === "/profile" ? "border-violet-300/40 bg-violet-400/15 text-purple-200" : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-violet-300/40 hover:text-purple-200"}`}><HiOutlineBookmark className="h-5 w-5"/></Link>
          <Link href={user?"/profile":"/auth"} aria-label={user?"Profil akun":"Login"} className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-slate-200 hover:border-violet-300/40">{user?<HiUserCircle className="h-5 w-5 text-violet-200"/>:<span className="text-xs font-semibold">{loading?"…":"Login"}</span>}<span className="hidden max-w-24 truncate text-xs sm:inline">{user?(user.user_metadata?.display_name||user.email?.split("@")[0]||"Akun"):""}</span></Link>
          <button type="button" onClick={() => setOpenMenu((value) => !value)} aria-label={openMenu ? "Tutup menu" : "Buka menu"} aria-expanded={openMenu} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 md:hidden">{openMenu?<HiX className="h-5 w-5"/>:<HiOutlineMenuAlt3 className="h-5 w-5"/>}</button>
        </div>
      </nav>
      {openMenu && <div className="border-t border-purple-300/15 bg-[#0c0a13] px-[4%] py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-wrap gap-2">{navlink.map((item)=><Link key={item.path} href={item.path} onClick={()=>setOpenMenu(false)} className={`rounded-xl px-4 py-2 text-sm ${pathname===item.path?"bg-violet-400/15 text-purple-200":"bg-white/[0.04] text-slate-300"}`}>{item.name}</Link>)}<Link href="/collections" onClick={()=>setOpenMenu(false)} className="rounded-xl bg-white/[0.04] px-4 py-2 text-sm text-slate-300">Koleksi</Link><Link href="/statistics" onClick={()=>setOpenMenu(false)} className="rounded-xl bg-white/[0.04] px-4 py-2 text-sm text-slate-300">Statistik</Link><Link href="/offline" onClick={()=>setOpenMenu(false)} className="rounded-xl bg-white/[0.04] px-4 py-2 text-sm text-slate-300">Offline</Link>{isAdmin && <Link href="/admin" onClick={()=>setOpenMenu(false)} className="rounded-xl bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200">Admin Page</Link>}<Link href="/donasi" onClick={()=>setOpenMenu(false)} className="rounded-xl bg-white/[0.04] px-4 py-2 text-sm text-slate-300">Donasi</Link>{user?<button onClick={()=>{setOpenMenu(false);void handleSignOut();}} className="rounded-xl bg-white/[0.04] px-4 py-2 text-sm text-slate-300">Logout</button>:<Link href="/auth" onClick={()=>setOpenMenu(false)} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white">Login / Register</Link>}</div></div>}
    </header>
  </>;
}
