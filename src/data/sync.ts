/**
 * Bulut Senkronizasyonu
 * ---------------------
 * "mesg-" ile başlayan TÜM localStorage verilerini (iş merkezleri, iş
 * emirleri, modül kayıtları, duruş/fire, tema, pano düzeni...) ortak bir
 * GitHub Gist dosyasında saklar. Farklı bilgisayarlardan girişte veriler
 * otomatik olarak çekilir ve yazılır.
 *
 * - Token yalnızca bu tarayıcıda (localStorage) tutulur, koda gömülmez.
 * - Çakışmada "son yazan kazanır" (updatedAt) stratejisi kullanılır.
 * - Manuel senkronizasyon tetikleyicileri yoktur: her 8 saniyede yerel
 *   değişiklikler yazılır, her 30 saniyede + pencere odaklanınca bulut
 *   okunur.
 */

const GIST_FILE = "mesg-sync.json";
const K_TOKEN = "mesg-sync-token";
const K_GIST = "mesg-sync-gist";
const K_REMOTE_AT = "mesg-sync-remoteat";
const K_FORCE_PUSH = "mesg-sync-forcepush";

const API = "https://api.github.com";
const PUSH_MS = 8_000;
const PULL_MS = 30_000;

export interface SyncStatus {
  connected: boolean;
  gistId: string;
  lastSync: number;
  lastError: string;
  busy: boolean;
}

interface RemotePayload {
  v: 1;
  updatedAt: number;
  data: Record<string, string>;
}

let lastSnap: string | null = null;
let lastError = "";
let busy = false;
let started = false;

/* ---------- yardımcılar ---------- */

function isDataKey(k: string): boolean {
  return k.startsWith("mesg-") && !k.startsWith("mesg-sync-");
}

/** Tüm veri anahtarlarını sıralı olarak topla (kararlı karşılaştırma için) */
function collectData(): Record<string, string> {
  const out: Record<string, string> = {};
  const keys = Object.keys(localStorage).filter(isDataKey).sort();
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v !== null) out[k] = v;
  }
  return out;
}

function snapString(): string {
  return JSON.stringify(collectData());
}

function emit() {
  try {
    window.dispatchEvent(new CustomEvent("mesg-sync-status"));
  } catch {
    /* yoksay */
  }
}

function errMsg(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e ?? "");
  if (m.includes("(401)")) return "Token geçersiz veya süresi dolmuş.";
  if (m.includes("(403)")) return "Token izinleri yetersiz — 'gist' işaretli olmalı.";
  if (m.includes("(404)")) return "Bulut kaydı bulunamadı (gist silinmiş olabilir).";
  if (m.includes("Failed to fetch") || m.includes("NetworkError")) return "İnternet bağlantısı yok.";
  return m || "Bilinmeyen hata.";
}

async function api(token: string, method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return fetch(API + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/* ---------- gist işlemleri ---------- */

async function findExistingGist(token: string): Promise<string | null> {
  const res = await api(token, "GET", "/gists?per_page=100");
  if (!res.ok) throw new Error("Gist listesi alınamadı (" + res.status + ")");
  const arr = (await res.json()) as Array<{ id: string; files?: Record<string, unknown> }>;
  const hit = arr.find((g) => g.files && Object.prototype.hasOwnProperty.call(g.files, GIST_FILE));
  return hit ? hit.id : null;
}

async function createGist(token: string): Promise<string> {
  const res = await api(token, "POST", "/gists", {
    description: "MES-G Veri Senkronizasyonu",
    public: false,
    files: { [GIST_FILE]: { content: "{}" } },
  });
  if (!res.ok) throw new Error("Gist oluşturulamadı (" + res.status + ")");
  const json = (await res.json()) as { id: string };
  return json.id;
}

async function fetchContent(token: string, gistId: string): Promise<RemotePayload> {
  const res = await api(token, "GET", "/gists/" + gistId);
  if (res.status === 404) throw new Error("(404)");
  if (!res.ok) throw new Error("Bulut kaydı okunamadı (" + res.status + ")");
  const json = (await res.json()) as {
    files?: Record<string, { content?: string; truncated?: boolean; raw_url?: string }>;
  };
  const file = json.files?.[GIST_FILE];
  if (!file) throw new Error("Bulut dosyası bulunamadı.");
  let content = file.content ?? "";
  if (file.truncated && file.raw_url) {
    const rr = await fetch(file.raw_url);
    if (rr.ok) content = await rr.text();
  }
  try {
    const parsed = JSON.parse(content) as Partial<RemotePayload>;
    return { v: 1, updatedAt: Number(parsed.updatedAt || 0), data: (parsed.data as Record<string, string>) ?? {} };
  } catch {
    throw new Error("Bulut verisi okunamadı (bozuk içerik).");
  }
}

/** Bulut verisini yereldekiyle karşılaştır; farklıysa uygula. Değişiklik varsa true döner. */
function applyData(remote: Record<string, string>): boolean {
  const cur = collectData();
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(remote)) if (isDataKey(k)) clean[k] = v;
  if (JSON.stringify(cur) === JSON.stringify(clean)) return false;
  for (const k of Object.keys(cur)) if (!(k in clean)) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(clean)) localStorage.setItem(k, v);
  return true;
}

/* ---------- yaz / oku ---------- */

async function push(): Promise<void> {
  const token = localStorage.getItem(K_TOKEN);
  const gistId = localStorage.getItem(K_GIST);
  if (!token || !gistId) return;
  const data = collectData();
  const snap = JSON.stringify(data);
  if (snap === lastSnap) return;
  busy = true;
  emit();
  const updatedAt = Date.now();
  const body = {
    files: { [GIST_FILE]: { content: JSON.stringify({ v: 1, updatedAt, data } satisfies RemotePayload) } },
  };
  try {
    let res = await api(token, "PATCH", "/gists/" + gistId, body);
    if (res.status === 404) {
      // Gist silinmişse yeniden oluştur
      const id = await createGist(token);
      localStorage.setItem(K_GIST, id);
      res = await api(token, "PATCH", "/gists/" + id, body);
    }
    if (!res.ok) throw new Error("Yazma hatası (" + res.status + ")");
    localStorage.setItem(K_REMOTE_AT, String(updatedAt));
    lastSnap = snap;
    lastError = "";
  } catch (e) {
    lastError = errMsg(e);
  } finally {
    busy = false;
    emit();
  }
}

async function pull(): Promise<void> {
  const token = localStorage.getItem(K_TOKEN);
  const gistId = localStorage.getItem(K_GIST);
  if (!token || !gistId) return;
  busy = true;
  emit();
  try {
    const remote = await fetchContent(token, gistId);
    const ra = Number(localStorage.getItem(K_REMOTE_AT) || 0);
    if (remote.updatedAt > ra) {
      localStorage.setItem(K_REMOTE_AT, String(remote.updatedAt));
      if (applyData(remote.data)) {
        // Yerel React belleği bayatladığı için sayfa yeniden yüklenir
        window.location.reload();
        return;
      }
      lastSnap = snapString();
    }
    lastError = "";
  } catch (e) {
    lastError = errMsg(e);
  } finally {
    busy = false;
    emit();
  }
}

/* ---------- dış API ---------- */

export function getSyncStatus(): SyncStatus {
  const token = localStorage.getItem(K_TOKEN);
  const gistId = localStorage.getItem(K_GIST);
  return {
    connected: !!(token && gistId),
    gistId: gistId ?? "",
    lastSync: Number(localStorage.getItem(K_REMOTE_AT) || 0),
    lastError,
    busy,
  };
}

/** Ayarlar ekranından çağrılır. Token yoksa mevcut token kullanılır. */
export async function connectSync(tokenInput?: string): Promise<void> {
  const token = (tokenInput ?? localStorage.getItem(K_TOKEN) ?? "").trim();
  if (!token) {
    lastError = "GitHub token gerekli.";
    emit();
    return;
  }
  busy = true;
  emit();
  try {
    localStorage.setItem(K_TOKEN, token);
    const existing = await findExistingGist(token);
    if (existing) {
      // Vardaki bir bulut kaydına bağlan → önce buluttaki veriler çekilir
      localStorage.setItem(K_GIST, existing);
      lastError = "";
      await pull();
      // Yerelde buluttan farklı değişiklik varsa o da yazılır
      await push();
    } else {
      const id = await createGist(token);
      localStorage.setItem(K_GIST, id);
      lastSnap = null;
      lastError = "";
      await push();
    }
  } catch (e) {
    lastError = errMsg(e);
    localStorage.removeItem(K_GIST);
  } finally {
    busy = false;
    emit();
  }
}

export function disconnectSync(): void {
  localStorage.removeItem(K_TOKEN);
  localStorage.removeItem(K_GIST);
  localStorage.removeItem(K_REMOTE_AT);
  lastSnap = snapString();
  lastError = "";
  emit();
}

/** "Şimdi Eşitle" butonu */
export async function syncNow(): Promise<void> {
  await pull();
  await push();
}

/** Uygulama açılışında çağrılır (main.tsx). */
export function startSync(): void {
  if (started) return;
  started = true;
  lastSnap = snapString();

  // Verileri Sıfırla sonrası: buluta yeni başlangıç verisi yazılsın
  if (localStorage.getItem(K_FORCE_PUSH)) {
    localStorage.removeItem(K_FORCE_PUSH);
    lastSnap = null;
    void push();
  }

  void pull();
  window.setInterval(() => {
    const s = snapString();
    if (s !== lastSnap) void push();
  }, PUSH_MS);
  window.setInterval(() => void pull(), PULL_MS);
  window.addEventListener("focus", () => void pull());
}
