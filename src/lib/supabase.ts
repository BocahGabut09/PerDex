/** Lightweight browser/server REST client for this PerDex frontend.
 * Uses only the Supabase publishable key. Never put a service-role key here.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqpvzlazjgmjdziwyfkl.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Df7ceGSSrkmywySqQuGiRw_1hIXSgE_";
const SESSION_KEY = "perdex_supabase_session_v1";

export type PerDexUser = { id: string; email?: string; email_confirmed_at?: string; user_metadata?: Record<string, any> };
export type PerDexSession = { access_token: string; refresh_token: string; expires_at?: number; user: PerDexUser };
type AuthResponse = { access_token?: string; refresh_token?: string; expires_in?: number; user?: PerDexUser; session?: PerDexSession; error_description?: string; msg?: string; message?: string };

export function getSession(): PerDexSession | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as PerDexSession : null; } catch { return null; }
}
export function saveSession(session: PerDexSession | null) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session)); else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("perdex:auth-changed"));
}
function apiHeaders(token?: string) {
  return { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token || SUPABASE_PUBLISHABLE_KEY}`, "Content-Type": "application/json" };
}
async function readError(response: Response) {
  let body: any = null; try { body = await response.json(); } catch { /* ignore */ }
  return body?.msg || body?.message || body?.error_description || body?.error || `Supabase error ${response.status}`;
}
async function authRequest(path: string, body?: unknown, method = "POST"): Promise<AuthResponse> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, { method, headers: apiHeaders(), body: body ? JSON.stringify(body) : undefined });
  if (!response.ok) throw new Error(await readError(response));
  return response.status === 204 ? {} : await response.json();
}
export async function signUp(email: string, password: string, captchaToken?: string) {
  const redirect = typeof window !== "undefined" ? `${window.location.origin}/auth?verified=1` : undefined;
  const path = redirect ? `signup?redirect_to=${encodeURIComponent(redirect)}` : "signup";
  return authRequest(path, { email, password, data: { app: "perdex" }, ...(captchaToken ? { gotrue_meta_security: { captcha_token: captchaToken } } : {}) });
}
export async function signIn(email: string, password: string, captchaToken?: string) {
  return authRequest("token?grant_type=password", { email, password, ...(captchaToken ? { gotrue_meta_security: { captcha_token: captchaToken } } : {}) });
}
export function signInWithGoogle() {
  if (typeof window === "undefined") return;
  const redirect = `${window.location.origin}/auth`;
  window.location.assign(`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`);
}
export async function requestPasswordReset(email: string, redirectTo: string, captchaToken?: string) {
  return authRequest(`recover?redirect_to=${encodeURIComponent(redirectTo)}`, { email, ...(captchaToken ? { gotrue_meta_security: { captcha_token: captchaToken } } : {}) });
}
export async function updatePassword(password: string) {
  const session = await getValidSession();
  if (!session?.access_token) throw new Error("Sesi pemulihan tidak ditemukan. Minta tautan reset baru.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { method: "PUT", headers: apiHeaders(session.access_token), body: JSON.stringify({ password }) });
  if (!response.ok) throw new Error(await readError(response));
  const user = await response.json();
  saveSession({ ...session, user });
  return user;
}
export async function signOut() {
  const session = getSession();
  try { if (session?.access_token) await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: apiHeaders(session.access_token) }); }
  finally { saveSession(null); }
}
export async function refreshSession(session = getSession()): Promise<PerDexSession | null> {
  if (!session?.refresh_token) return null;
  const data = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
  if (!data.access_token || !data.refresh_token || !data.user) return null;
  const next: PerDexSession = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600), user: data.user };
  saveSession(next); return next;
}
export async function getValidSession(): Promise<PerDexSession | null> {
  const session = getSession();
  if (!session) return null;
  if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000) + 90) {
    try { return await refreshSession(session); } catch { saveSession(null); return null; }
  }
  return session;
}
export async function acceptOAuthRedirect(): Promise<PerDexSession | null> {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const access = hash.get("access_token"); const refresh = hash.get("refresh_token");
  if (access && refresh) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: apiHeaders(access) });
    if (!response.ok) throw new Error(await readError(response));
    const user = await response.json();
    const session: PerDexSession = { access_token: access, refresh_token: refresh, expires_at: Math.floor(Date.now() / 1000) + Number(hash.get("expires_in") || 3600), user };
    saveSession(session); history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`); return session;
  }
  const error = hash.get("error_description"); if (error) throw new Error(decodeURIComponent(error));
  return getSession();
}

export async function dbRequest<T = any>(table: string, query = "select=*", options: { method?: string; body?: unknown; session?: PerDexSession | null; prefer?: string } = {}): Promise<T> {
  const session = options.session === undefined ? await getValidSession() : options.session;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: options.method || "GET",
    headers: { ...apiHeaders(session?.access_token), ...(options.prefer ? { Prefer: options.prefer } : {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return [] as T;
  const text = await response.text(); return (text ? JSON.parse(text) : []) as T;
}
export function dbQuery(value: string) { return encodeURIComponent(value); }
export function isEmailVerified(user?: PerDexUser | null) { return Boolean(user?.email_confirmed_at); }
