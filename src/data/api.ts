// İsteğe bağlı backend bağlantısı.
// VITE_API_URL tanımlıysa uygulama API modunda çalışır; aksi halde demo (localStorage) modunda.
export const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ?? "";

export function isApiMode(): boolean {
  return Boolean(API_BASE);
}

export async function apiFetch(path: string, init?: RequestInit): Promise<any> {
  if (!API_BASE) throw new Error("API modu kapalı (VITE_API_URL tanımlı değil).");
  const token = localStorage.getItem("mesg-auth-token");
  const res = await fetch(API_BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.error ?? msg; } catch { /* yoksay */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}
