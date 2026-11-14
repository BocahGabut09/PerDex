/** Client helper. The server verifies the Supabase access token and Google identity. */
export async function verifyPerDexAdmin(accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const response = await fetch("/api/admin/verify", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const payload = await response.json();
    return payload?.authorized === true;
  } catch {
    return false;
  }
}
