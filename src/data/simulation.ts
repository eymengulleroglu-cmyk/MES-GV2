/**
 * Üretim Simülasyonu v2 — TÜM MODÜLLER
 * --------------------------------------
 * "Üretime başla" ile fabrika gerçek zamanlı (normal üretim hızında) canlanır.
 * Simülasyon yeni veri uydurmaz; uygulamanın TÜM modüllerini birbirine bağlar:
 *
 *  ÜRETİM:  Ürünler · Siparişler · İş Emirleri · Üretim Girişi · Üretim Takibi
 *  MAKİNE:  Makine Listesi · Arıza Nedenleri · Bakım Planları · OEE · İş Merkezleri
 *  KALİTE:  Kontrol Parametreleri · Hata Türleri · SPC
 *  STOK:    Hammadde → Yarı Mamul → Mamul (üretimle akar, tükenince sevkiyat gelir)
 *  İZLENEB.:Lot Takibi · Seri No Takibi (emir tamamlanınca lot/SN oluşur)
 *  RAPOR:   Üretim/Verimlilik/Arıza/Kalite raporları canlı hesaplanır
 *  YÖNETİM: Kullanıcılar (operatör seçimi) · Yetkiler (rol matrisine göre)
 *
 * Her 1 saniyede bir tik işlenir; hız 1x/2x/4x. Değişen anahtarlar
 * dinleyicilere bildirilir (React Query + modül sayfaları tazelenir).
 */

import { store } from "./store";
import { MODULES } from "./modules";
import type { WorkCenter } from "./types";

const TICK_MS = 1000;
const EVENT_CHANCE = 0.012; // arıza/fire olasılığı / sn
const QUALITY_CHANCE = 0.05; // kalite kontrolü olasılığı / sn
const PAUSE_MIN_S = 20; // arıza süresi
const PAUSE_MAX_S = 60;
const MAINT_MIN_S = 15; // planlı bakım süresi
const MAINT_MAX_S = 30;
const RESTOCK_MS = 90_000; // tükenen hammaddenin sevkiyat süresi
const LOT_APPROVE_MS = 30_000; // lot kalite onayı süresi
const UGR_FLUSH_QTY = 100; // üretim girişi kaydı eşiği (adet)

const K = {
  track: "mesg-mod-v8-uretim-takibi",
  machine: "mesg-mod-v8-makine-listesi",
  reason: "mesg-mod-v8-arizalar",
  error: "mesg-mod-v8-hata-kayitlari",
  ugr: "mesg-mod-v8-uretim-girisi",
  kk: "mesg-mod-v8-kalite-kontrol",
  spc: "mesg-mod-v8-spc",
  ham: "mesg-mod-v8-hammadde",
  ym: "mesg-mod-v8-yari-mamul",
  mam: "mesg-mod-v8-mamul",
  sip: "mesg-mod-v8-siparisler",
  lot: "mesg-mod-v8-lot-takibi",
  sn: "mesg-mod-v8-seri-no",
  bakim: "mesg-mod-v8-bakim",
  oee: "mesg-mod-v8-oee",
  ru: "mesg-mod-v8-rapor-uretim",
  rv: "mesg-mod-v8-rapor-verimlilik",
  ra: "mesg-mod-v8-rapor-ariza",
  rk: "mesg-mod-v8-rapor-kalite",
  kull: "mesg-mod-v8-kullanicilar",
  yet: "mesg-mod-v8-yetkiler",
  store: "mesg-data-v7",
};

export type SimEventKind =
  | "uretim" | "emir" | "ariza" | "fire" | "kalite"
  | "bakim" | "stok" | "siparis" | "lot" | "hata";

export interface SimEvent {
  id: number;
  time: string;
  kind: SimEventKind;
  text: string;
}

export interface SimStats {
  produced: number;
  completed: number;
  downtimes: number;
  scraps: number;
  checks: number;
  maintenance: number;
  orders: number;
  lots: number;
  shift: number;
}

interface ProductFlow {
  match: RegExp;
  label: string;     // takip satırında görünen kısa ürün adı
  raw: string;      // hammadde stok kodu
  rawPerUnit: number;
  ym: string;       // yarı mamul kodu
  mamul: string;    // mamul kodu
  snPrefix: string; // seri no öneki
}

/** Ürün → stok akışı (Ürünler/Hammadde/Yarı Mamul/Mamul modülleri arasında köprü) */
export const FLOWS: ProductFlow[] = [
  { match: /flanş/i, label: "Flanş", raw: "STK-002", rawPerUnit: 0.5, ym: "YMK-001", mamul: "STK-011", snPrefix: "FLN" },
  { match: /çelik mil/i, label: "Çelik Mil", raw: "STK-001", rawPerUnit: 0.3, ym: "YMK-002", mamul: "STK-012", snPrefix: "MIL" },
  { match: /braket/i, label: "Motor Braketi", raw: "STK-004", rawPerUnit: 0.4, ym: "YMK-003", mamul: "STK-013", snPrefix: "BRK" },
  { match: /alüminyum/i, label: "Alüminyum Gövde", raw: "STK-003", rawPerUnit: 0.6, ym: "YMK-004", mamul: "STK-014", snPrefix: "ALU" },
  { match: /rulman/i, label: "Rulman Yatağı", raw: "STK-009", rawPerUnit: 1, ym: "YMK-005", mamul: "STK-015", snPrefix: "RLM" },
];

export function flowFor(product: string): ProductFlow | null {
  return FLOWS.find((f) => f.match.test(product)) ?? null;
}

/* ---------- durum ---------- */

let running = false;
let speed = 1;
let timer: number | null = null;
let eventId = 0;
let tickNo = 0;
let events: SimEvent[] = [];

const stats: SimStats = {
  produced: 0, completed: 0, downtimes: 0, scraps: 0,
  checks: 0, maintenance: 0, orders: 0, lots: 0, shift: 1,
};

/** Makine kodu -> kapanış zamanı (ms) */
const pauses: Record<string, number> = {};
/** Makine kodu -> duruş bilgisi */
const pauseMeta: Record<string, { recId: string | null; prevStatus: string; kind: "ariza" | "bakim" }> = {};
/** Makine kodu -> çalışma süresi (sn, bakım periyodu için) */
const runtime: Record<string, number> = {};
/** İş emri -> üretim girişi birikimi (adet) */
const ugrAccum: Record<string, number> = {};
/** Stok kodu -> sevkiyat zamanı */
const restockAt: Record<string, number> = {};
/** Bekleyen lot onayları */
let pendingLots: { lot: string; at: number }[] = [];
/** Tükenen hammadde için uyarı verildi mi */
const emptyWarned = new Set<string>();
/** Bu tikte üreten makineler (OEE/Bakım için) */
let producingSet = new Set<string>();

let ugrSeq = 0;
let lotSeq = 0;
let snSeq: Record<string, number> = {};

const listeners = new Set<(keys: string[]) => void>();

/* ---------- yardımcılar ---------- */

function readRows(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as any[];
  } catch { /* yoksay */ }
  const modKey = key.replace("mesg-mod-v8-", "");
  return MODULES[modKey]?.rows ?? [];
}

function writeRows(key: string, rows: any[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch { /* yoksay */ }
}

function emit(keys: string[]): void {
  listeners.forEach((fn) => {
    try { fn(keys); } catch { /* yoksay */ }
  });
}

function log(kind: SimEventKind, text: string): void {
  const d = new Date();
  const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0")).join(":");
  events = [{ id: ++eventId, time, kind, text }, ...events].slice(0, 40);
}

function rnd<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function pad(n: number, len: number) {
  return String(n).padStart(len, "0");
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

function lotDate() {
  const d = new Date();
  return `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function minutesOf(startedAt: string, endedAt: string | null) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 60000));
}

/** Bakım periyodu ("30 gün") -> simülasyon süresi (sn) */
function intervalSeconds(interval: string) {
  const n = parseInt(interval.replace(/\D/g, ""), 10);
  return (isNaN(n) ? 30 : n) * 4;
}

/** Ürün adının kelimesinden eşleşen SPC parametresi */
function findSpc(spcRows: any[], product: string) {
  const words = product.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
  for (const row of spcRows) {
    const p = String(row.parameter ?? "").toLowerCase();
    if (words.some((w) => p.includes(w.slice(0, 6)))) return row;
  }
  return null;
}

/** Yetki matrisine göre üretim girişi yapabilen kullanıcılar */
function eligibleOperators(): string[] {
  const users = readRows(K.kull);
  const yetkiler = readRows(K.yet);
  const roles = yetkiler
    .filter((y) => String(y.module).includes("Üretim Girişi") && String(y.write) === "Evet")
    .map((y) => String(y.role));
  const ops = users.filter((u) => roles.includes(String(u.role)));
  const names = ops.map((u) => String(u.username));
  return names.length ? names : users.filter((u) => String(u.role).includes("Operatör")).map((u) => String(u.username));
}

/* ---------- alt sistemler ---------- */

function resumePauses(now: number, changed: Set<string>): void {
  for (const code of Object.keys(pauses)) {
    if (pauses[code] > now) continue;
    const meta = pauseMeta[code];
    if (meta?.recId) store.endDowntime(meta.recId);
    const machines = readRows(K.machine);
    const row = machines.find((r) => String(r.code) === code);
    if (row && meta) {
      row.status = meta.prevStatus;
      writeRows(K.machine, machines);
      changed.add(K.machine);
    }
    const isMaint = meta?.kind === "bakim";
    delete pauses[code];
    delete pauseMeta[code];
    log(isMaint ? "bakim" : "ariza",
      isMaint ? `${code} bakım tamamlandı, üretime devam etti.` : `${code} onarıldı ve üretime devam etti.`);
    changed.add(K.store);
  }
}

function produce(track: any[], changed: Set<string>): void {
  const hamRows = readRows(K.ham);
  const ymRows = readRows(K.ym);
  const mamRows = readRows(K.mam);
  let hamChanged = false, ymChanged = false, mamChanged = false;
  producingSet = new Set<string>();
  const seenMachines = new Set<string>(); // aynı makinede aynı anda tek emir

  for (const row of track) {
    if (String(row.status) !== "Üretimde") continue;
    const machine = String(row.machine ?? "");
    if (seenMachines.has(machine)) continue; // sıradaki emir bu makinede bekler
    const product = String(row.product ?? "");
    const target = Number(row.target) || 0;
    let produced = Number(row.produced) || 0;
    const flow = flowFor(product);

    // Emir tamamlandı mı?
    if (target > 0 && produced >= target) {
      row.status = "Tamamlandı";
      stats.completed++;
      log("emir", `${row.workOrder} tamamlandı (${product}).`);

      // Yarı mamul → mamul dönüşümü
      if (flow) {
        const ym = ymRows.find((r) => String(r.code) === flow.ym);
        if (ym) { ym.qty = Math.max(0, (Number(ym.qty) || 0) - target); ymChanged = true; }
        const mam = mamRows.find((r) => String(r.code) === flow.mamul);
        if (mam) { mam.qty = (Number(mam.qty) || 0) + target; mamChanged = true; }
        changed.add(K.mam);

        // Lot + Seri No oluştur (izlenebilirlik)
        const lots = readRows(K.lot);
        if (!lotSeq) {
          lotSeq = lots.reduce((m, r) => Math.max(m, parseInt(String(r.lot).split("-").pop() || "0", 10) || 0), 0);
        }
        const lotNo = `LOT-${lotDate()}-${pad(++lotSeq, 3)}`;
        lots.unshift({
          lot: lotNo, product, workOrder: String(row.workOrder ?? ""),
          qty: target, status: "Kalite Kontrol", date: today(),
        });
        writeRows(K.lot, lots);
        pendingLots.push({ lot: lotNo, at: Date.now() + LOT_APPROVE_MS / speed });
        stats.lots++;
        changed.add(K.lot);

        const sns = readRows(K.sn);
        const prefix = flow.snPrefix;
        if (snSeq[prefix] === undefined) {
          snSeq[prefix] = sns.reduce((m, r) => Math.max(m, parseInt(String(r.serial).replace(/\D/g, ""), 10) || 0), 0);
        }
        for (let i = 0; i < 3; i++) {
          sns.unshift({
            serial: `SN-${prefix}-${pad(++snSeq[prefix], 6)}`,
            product, workOrder: String(row.workOrder ?? ""), status: "Kalite Kontrol",
          });
        }
        writeRows(K.sn, sns);
        changed.add(K.sn);
        log("lot", `${lotNo} oluşturuldu (${target} adet, kalite kontrole gönderildi).`);
      }

      // Sıradaki emri başlat
      const next = track.find((r) => ["Planlandı", "Bekliyor"].includes(String(r.status)));
      if (next) {
        next.status = "Üretimde";
        log("uretim", `${next.machine} üzerinde ${next.workOrder} üretime başladı.`);
      }
      changed.add(K.track);
      continue;
    }

    if (pauses[machine]) continue; // arızada/bakımda olan makine üretmez
    seenMachines.add(machine);

    // Hammadde yoksa üretim durur
    if (flow) {
      const ham = hamRows.find((r) => String(r.code) === flow.raw);
      if (ham && (Number(ham.qty) || 0) <= 0) {
        if (!emptyWarned.has(flow.raw)) {
          emptyWarned.add(flow.raw);
          restockAt[flow.raw] = Date.now() + RESTOCK_MS / speed;
          log("stok", `${flow.raw} (${ham.name}) tükendi — ${machine} malzeme bekliyor.`);
          changed.add(K.ham);
        }
        continue;
      }
    }

    // Normal üretim hızı: hedef ~150 sn'de biter (hız çarpanı ile)
    const rate = Math.max(1, Math.round(target / 150)) * speed;
    const qty = Math.max(1, Math.round(rate * (0.7 + Math.random() * 0.6)));
    produced = target > 0 ? Math.min(target, produced + qty) : produced + qty;
    row.produced = produced;
    stats.produced += qty;
    producingSet.add(machine);

    // Stok akışı: hammadde tüket + yarı mamul üret
    if (flow) {
      const ham = hamRows.find((r) => String(r.code) === flow.raw);
      if (ham) {
        ham.qty = round1(Math.max(0, (Number(ham.qty) || 0) - qty * flow.rawPerUnit));
        hamChanged = true;
      }
      const ym = ymRows.find((r) => String(r.code) === flow.ym);
      if (ym) { ym.qty = (Number(ym.qty) || 0) + qty; ymChanged = true; }

      // Sarf malzemesi (takım ucu / kesme sıvısı) ara sıra azalır
      if (Math.random() < 0.12) {
        const sarf = hamRows.find((r) => String(r.code) === (Math.random() < 0.5 ? "STK-007" : "STK-006"));
        if (sarf) { sarf.qty = round1(Math.max(0, (Number(sarf.qty) || 0) - 1)); hamChanged = true; }
      }
    }

    // Pano KPI'ları için iş emrini güncelle
    const wo = store.getWorkOrders().find((w) => w.code === row.workOrder);
    if (wo && wo.producedQty !== produced) store.setProducedQty(wo.id, produced);
    changed.add(K.store);

    // Biriken üretim girişi (Üretim Girişi modülü)
    const woCode = String(row.workOrder ?? "");
    ugrAccum[woCode] = (ugrAccum[woCode] || 0) + qty;
  }

  if (hamChanged) { writeRows(K.ham, hamRows); changed.add(K.ham); }
  if (ymChanged) { writeRows(K.ym, ymRows); changed.add(K.ym); }
  if (mamChanged) { writeRows(K.mam, mamRows); changed.add(K.mam); }
}

function flushUgr(changed: Set<string>): void {
  const entries = Object.entries(ugrAccum).filter(([, q]) => q >= UGR_FLUSH_QTY);
  if (!entries.length) return;
  const rows = readRows(K.ugr);
  const ops = eligibleOperators();
  for (const [workOrder, qty] of entries) {
    ugrAccum[workOrder] = 0;
    if (!ugrSeq) {
      ugrSeq = rows.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0);
    }
    const operator = ops.length ? rnd(ops) : "sistem";
    rows.unshift({ id: "UGR-" + pad(++ugrSeq, 3), workOrder, operator, qty, date: today() });
    log("uretim", `Üretim girişi: ${workOrder} — ${qty} adet (${operator}).`);
  }
  writeRows(K.ugr, rows);
  changed.add(K.ugr);
}

function randomEvents(track: any[], changed: Set<string>): void {
  const active = track.filter(
    (r) => String(r.status) === "Üretimde" && !pauses[String(r.machine ?? "")],
  );
  if (!active.length || Math.random() >= EVENT_CHANCE) return;
  const row = rnd(active);
  const machine = String(row.machine ?? "");
  const wo = store.getWorkOrders().find((w) => w.code === row.workOrder);
  const wc = store.getWorkCenters().find((w) => w.code === machine);

  if (Math.random() < 0.5) {
    // --- ARIZA (Arıza Nedenleri modülünden neden seçilir) ---
    const reasons = readRows(K.reason).map((r) => String(r.reason ?? "")).filter(Boolean);
    const reason = reasons.length ? rnd(reasons) : "Beklenmedik duruş";
    const durS = PAUSE_MIN_S + Math.floor(Math.random() * (PAUSE_MAX_S - PAUSE_MIN_S));
    const rec = wc ? store.startDowntime(wc.id, wo?.id ?? null, reason) : null;
    const machines = readRows(K.machine);
    const mRow = machines.find((r) => String(r.code) === machine);
    pauses[machine] = Date.now() + (durS * 1000) / speed;
    pauseMeta[machine] = {
      recId: rec?.id ?? null,
      prevStatus: mRow ? String(mRow.status) : "Boşta",
      kind: "ariza",
    };
    if (mRow) { mRow.status = "Duruş"; writeRows(K.machine, machines); changed.add(K.machine); }
    stats.downtimes++;
    log("ariza", `${machine} durdu: ${reason} (~${Math.round(durS / speed)} sn onarım).`);
    changed.add(K.store);
    // OEE: kullanılabilirlik düşer
    nudgeOee(machine, "availability", -0.8, changed);
  } else {
    // --- FIRE (Hata Türleri modülünden neden seçilir) ---
    const reasons = readRows(K.error).map((r) => String(r.name ?? "")).filter(Boolean);
    const reason = reasons.length ? rnd(reasons) : "Ölçü Dışı";
    const qty = 1 + Math.floor(Math.random() * 4);
    store.addScrap(wc?.id ?? "", wo?.id ?? null, qty, reason);
    stats.scraps += qty;
    log("fire", `${machine}: ${qty} adet fire — ${reason}.`);
    changed.add(K.store);
    nudgeOee(machine, "quality", -0.4);
  }
}

function qualityCheck(changed: Set<string>): void {
  if (Math.random() >= QUALITY_CHANCE) return;
  const kks = readRows(K.kk);
  if (!kks.length) return;
  const kk = rnd(kks);
  const nominal = Number(kk.nominal) || 0;
  const lower = Number(kk.lower) || 0;
  const upper = Number(kk.upper) || 1;
  const spread = Math.max((upper - lower) / 6, 1e-9);
  const inLimit = Math.random() < 0.9;
  let value: number;
  if (inLimit) {
    value = Math.min(upper, Math.max(lower, nominal + (Math.random() * 2 - 1) * spread * 1.5));
  } else {
    value = Math.random() < 0.5 ? lower - spread * 1.5 : upper + spread * 1.5;
  }
  value = Math.round(value * 1000) / 1000;
  const unit = String(kk.unit ?? "");
  stats.checks++;

  if (inLimit) {
    log("kalite", `${kk.code} ${kk.characteristic}: ${value} ${unit} → Uygun.`);
  } else {
    // Uygunsuz → fire kaydı + SPC uyarısı
    const reasons = readRows(K.error).map((r) => String(r.name ?? "")).filter(Boolean);
    const wc = rnd(store.getWorkCenters());
    const wo = store.getWorkOrders().find((w) => w.workCenterId === wc.id) ?? null;
    store.addScrap(wc.id, wo?.id ?? "", 1 + Math.floor(Math.random() * 2), reasons.length ? rnd(reasons) : "Ölçü Dışı");
    stats.scraps++;
    log("fire", `${kk.code} ${kk.characteristic}: ${value} ${unit} → Uygunsuz; fire kaydı açıldı.`);
    changed.add(K.store);
    nudgeOee(wc.code, "quality", -0.5, changed);
  }

  // SPC kontrol kartını güncelle
  const spcRows = readRows(K.spc);
  const sp = findSpc(spcRows, String(kk.product ?? ""));
  if (sp) {
    const mean = Number(sp.mean) || nominal;
    sp.mean = Math.round((mean + (value - mean) * 0.25) * 1000) / 1000;
    sp.status = inLimit ? "Kontrol Altında" : "Uyarı";
    writeRows(K.spc, spcRows);
    changed.add(K.spc);
    if (!inLimit) log("kalite", `SPC: "${sp.parameter}" prosesi sınır dışı — kart uyarısı.`);
  }
}

function nudgeOee(machine: string, field: "availability" | "performance" | "quality", delta: number, changed?: Set<string>): void {
  const rows = readRows(K.oee);
  const row = rows.find((r) => String(r.machine) === machine);
  if (!row) return;
  const cur = Number(row[field]) || 90;
  row[field] = round1(Math.min(99, Math.max(60, cur + delta)));
  writeRows(K.oee, rows);
  changed?.add(K.oee);
}

function updateOee(changed: Set<string>): void {
  const rows = readRows(K.oee);
  let touched = false;
  for (const row of rows) {
    const code = String(row.machine);
    let av = Number(row.availability) || 90;
    let pf = Number(row.performance) || 90;
    const q = Number(row.quality) || 98;
    if (pauses[code]) av = Math.max(60, av - 0.3);
    else if (producingSet.has(code)) av = Math.min(97, av + 0.2);
    if (producingSet.has(code)) pf = Math.min(96, pf + 0.1);
    else pf = Math.max(60, pf - 0.05);
    row.availability = round1(av);
    row.performance = round1(pf);
    row.quality = round1(q);
    row.oee = round1((av * pf * q) / 10000);
    touched = true;
  }
  if (touched) { writeRows(K.oee, rows); changed.add(K.oee); }
}

function checkMaintenance(changed: Set<string>): void {
  const bakRows = readRows(K.bakim);
  if (!bakRows.length) return;
  for (const b of bakRows) {
    const code = String(b.machine ?? "");
    if (!producingSet.has(code) || pauses[code]) continue;
    runtime[code] = (runtime[code] ?? 0) + speed;
    if (runtime[code] < intervalSeconds(String(b.interval ?? "30 gün"))) continue;

    runtime[code] = 0;
    const durS = MAINT_MIN_S + Math.floor(Math.random() * (MAINT_MAX_S - MAINT_MIN_S));
    const machines = readRows(K.machine);
    const mRow = machines.find((r) => String(r.code) === code);
    pauses[code] = Date.now() + (durS * 1000) / speed;
    pauseMeta[code] = {
      recId: null,
      prevStatus: mRow ? String(mRow.status) : "Boşta",
      kind: "bakim",
    };
    if (mRow) { mRow.status = "Planlı Bakım"; writeRows(K.machine, machines); changed.add(K.machine); }
    stats.maintenance++;
    log("bakim", `${code} planlı bakıma girdi (${b.type}). ~${Math.round(durS / speed)} sn.`);
    changed.add(K.store);
    nudgeOee(code, "availability", -0.4, changed);
  }
}

function restock(changed: Set<string>): void {
  const now = Date.now();
  const rows = readRows(K.ham);
  let changedRows = false;
  for (const row of rows) {
    const code = String(row.code);
    if ((Number(row.qty) || 0) > 0) { emptyWarned.delete(code); continue; }
    if (!restockAt[code]) { restockAt[code] = now + RESTOCK_MS / speed; continue; }
    if (now < restockAt[code]) continue;
    const seedRow = (MODULES["hammadde"]?.rows ?? []).find((r) => r.code === code);
    const base = Number(seedRow?.qty) || 1000;
    row.qty = base;
    restockAt[code] = now + RESTOCK_MS / speed;
    emptyWarned.delete(code);
    changedRows = true;
    log("stok", `${code} (${row.name}) sevkiyatı alındı (+${base} ${row.unit}).`);
  }
  if (changedRows) { writeRows(K.ham, rows); changed.add(K.ham); }
}

function updateOrders(track: any[], changed: Set<string>): void {
  const sips = readRows(K.sip);
  const mamRows = readRows(K.mam);
  let sipChanged = false, mamChanged = false;

  for (const s of sips) {
    if (String(s.status) === "Tamamlandı") continue;
    const flow = flowFor(String(s.product ?? ""));
    if (!flow) continue;

    // İlgili ürün üretiliyorsa sipariş "Üretimde" olur
    const producing = track.some(
      (r) => String(r.status) === "Üretimde" && flowFor(String(r.product ?? ""))?.mamul === flow.mamul,
    );
    if (producing && String(s.status) !== "Üretimde") {
      s.status = "Üretimde";
      sipChanged = true;
      log("siparis", `${s.orderNo} üretime alındı (${s.customer}).`);
    }

    // Mamul stoğu siparişi karşılıyorsa hazırlanır
    const mam = mamRows.find((r) => String(r.code) === flow.mamul);
    const qty = Number(s.qty) || 0;
    if (mam && (Number(mam.qty) || 0) >= qty) {
      mam.qty = (Number(mam.qty) || 0) - qty;
      mamChanged = true;
      s.status = "Tamamlandı";
      stats.orders++;
      log("siparis", `${s.orderNo} hazırlandı — ${qty} adet ${s.customer} için sevke hazır.`);
      sipChanged = true;
    }
  }

  if (sipChanged) { writeRows(K.sip, sips); changed.add(K.sip); }
  if (mamChanged) { writeRows(K.mam, mamRows); changed.add(K.mam); }
}

function approveLots(changed: Set<string>): void {
  if (!pendingLots.length) return;
  const now = Date.now();
  const due = pendingLots.filter((p) => p.at <= now);
  if (!due.length) return;
  pendingLots = pendingLots.filter((p) => p.at > now);
  const rows = readRows(K.lot);
  let changedRows = false;
  for (const d of due) {
    const row = rows.find((r) => String(r.lot) === d.lot);
    if (row && String(row.status) === "Kalite Kontrol") {
      row.status = "Onaylandı";
      changedRows = true;
      log("lot", `${d.lot} kalite onayı aldı → Onaylandı.`);
      // Seri no da onaylansın
      const sns = readRows(K.sn);
      let snChanged = false;
      for (const sn of sns) {
        if (String(sn.status) === "Kalite Kontrol" && String(sn.workOrder) === String(row.workOrder ?? sn.workOrder) && String(sn.product) === String(row.product)) {
          sn.status = "Onaylandı";
          snChanged = true;
        }
      }
      if (snChanged) { writeRows(K.sn, sns); changed.add(K.sn); }
    }
  }
  if (changedRows) { writeRows(K.lot, rows); changed.add(K.lot); }
}

function updateReports(changed: Set<string>): void {
  const wos = store.getWorkOrders();
  const totalProduced = wos.reduce((s, w) => s + w.producedQty, 0);
  const totalTarget = wos.reduce((s, w) => s + w.targetQty, 0);
  const totalScrap = store.getScraps().reduce((s, r) => s + r.qty, 0);
  const downtimes = store.getDowntimes();

  // Üretim Raporu — Genel Toplam
  const ru = readRows(K.ru);
  const ruTop = ru.find((r) => String(r.period) === "Genel Toplam") ?? ru[ru.length - 1];
  if (ruTop) {
    ruTop.produced = totalProduced;
    ruTop.target = totalTarget;
    ruTop.efficiency = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 10000) / 100 : 0;
    writeRows(K.ru, ru);
  }

  // Kalite Raporu — Genel Toplam (PPM)
  const rk = readRows(K.rk);
  const rkTop = rk.find((r) => String(r.period) === "Genel Toplam") ?? rk[rk.length - 1];
  if (rkTop) {
    rkTop.inspected = totalProduced;
    rkTop.defects = totalScrap;
    rkTop.ppm = totalProduced > 0 ? Math.round((totalScrap / totalProduced) * 1_000_000) : 0;
    writeRows(K.rk, rk);
  }

  // OEE değerleri
  const oeeRows = readRows(K.oee);

  // Verimlilik Raporu — makine bazlı (Duruş & Fire verisinden)
  const rv = readRows(K.rv);
  let rvTopDowntime = 0, rvTopScrap = 0, oeeSum = 0, oeeCount = 0;
  for (const row of rv) {
    const code = String(row.machine);
    if (code === "TOPLAM") continue;
    const wc = store.getWorkCenters().find((w) => w.code === code);
    if (!wc) continue;
    const dt = downtimes.filter((d) => d.workCenterId === wc.id)
      .reduce((s, d) => s + minutesOf(d.startedAt, d.endedAt), 0);
    const sc = store.getScraps().filter((s) => s.workCenterId === wc.id)
      .reduce((s, r) => s + r.qty, 0);
    const oeeRow = oeeRows.find((r) => String(r.machine) === code);
    if (oeeRow) { row.oee = Number(oeeRow.oee) || row.oee; oeeSum += Number(row.oee) || 0; oeeCount++; }
    row.downtime = dt;
    row.scrap = sc;
    rvTopDowntime += dt;
    rvTopScrap += sc;
  }
  const rvTop = rv.find((r) => String(r.machine) === "TOPLAM");
  if (rvTop) {
    rvTop.downtime = rvTopDowntime;
    rvTop.scrap = rvTopScrap;
    rvTop.oee = oeeCount ? Math.round((oeeSum / oeeCount) * 10) / 10 : rvTop.oee;
  }
  writeRows(K.rv, rv);

  // Arıza Raporu — makine bazlı (MTTR)
  const ra = readRows(K.ra);
  let raCount = 0, raTotal = 0;
  for (const row of ra) {
    const code = String(row.machine);
    if (code === "TOPLAM") continue;
    const wc = store.getWorkCenters().find((w) => w.code === code);
    if (!wc) continue;
    const dts = downtimes.filter((d) => d.workCenterId === wc.id);
    const total = dts.reduce((s, d) => s + minutesOf(d.startedAt, d.endedAt), 0);
    row.count = dts.length;
    row.totalDowntime = total;
    row.mttr = dts.length ? Math.round((total / dts.length) * 100) / 100 : 0;
    raCount += dts.length;
    raTotal += total;
  }
  const raTop = ra.find((r) => String(r.machine) === "TOPLAM");
  if (raTop) {
    raTop.count = raCount;
    raTop.totalDowntime = raTotal;
    raTop.mttr = raCount ? Math.round((raTotal / raCount) * 100) / 100 : 0;
  }
  writeRows(K.ra, ra);

  changed.add(K.ru);
  changed.add(K.rk);
  changed.add(K.rv);
  changed.add(K.ra);
}

function recomputeStatuses(track: any[], changed: Set<string>): void {
  // Makine Listesi durumları
  const machines = readRows(K.machine);
  let mChanged = false;
  const activeMachines = new Set(
    track.filter((r) => String(r.status) === "Üretimde").map((r) => String(r.machine)),
  );
  for (const m of machines) {
    const code = String(m.code);
    let want: string;
    if (pauses[code]) want = pauseMeta[code]?.kind === "bakim" ? "Planlı Bakım" : "Duruş";
    else if (activeMachines.has(code)) want = "Üretimde";
    else want = "Boşta";
    if (String(m.status) !== want) { m.status = want; mChanged = true; }
  }
  if (mChanged) { writeRows(K.machine, machines); changed.add(K.machine); }

  // İş Merkezleri durumları (store)
  const wos = store.getWorkOrders();
  for (const wc of store.getWorkCenters()) {
    const wo = wos.find((w) => w.id === wc.activeWorkOrderId);
    let want: WorkCenter["status"];
    if (pauses[wc.code]) want = "Duruşta";
    else if (wo && wo.status === "Üretimde") want = "Üretimde";
    else want = "Boşta";
    if (wc.status !== want) store.updateWorkCenter(wc.id, { status: want });
  }
}

function autoShift(track: any[], changed: Set<string>): void {
  const hasWork = track.some((r) => ["Üretimde", "Planlandı", "Bekliyor"].includes(String(r.status)));
  if (hasWork) return;

  // Yeni vardiya: üretim planı yenilenir (stok, sipariş, lot geçmişi korunur)
  stats.shift++;
  track.forEach((r, i) => {
    r.produced = 0;
    r.status = i < 4 ? "Üretimde" : "Planlandı";
  });
  writeRows(K.track, track);
  changed.add(K.track);
  for (const w of store.getWorkOrders()) {
    store.updateWorkOrder(w.id, {
      producedQty: 0,
      status: (w.workCenterId ? "Üretimde" : "Planlandı") as typeof w.status,
    });
  }
  changed.add(K.store);
  log("emir", `Vardiya ${stats.shift} başladı — üretim planı yenilendi.`);
}

/* ---------- ana tik ---------- */

/**
 * Kilitlenme önleyici: hiçbir emir "Üretimde" değilse (ör. tüm emirler
 * tamamlandıysa ya da tohum veride son emir "Bekliyor" kaldıysa) sıradaki
 * bekleyen emri başlatır. Böylece simülasyon asla boşta kalmaz.
 */
function ensureActive(track: any[], changed: Set<string>): void {
  if (track.some((r) => String(r.status) === "Üretimde")) return;
  const next = track.find((r) => ["Planlandı", "Bekliyor"].includes(String(r.status)));
  if (!next) return;
  next.status = "Üretimde";
  log("uretim", `${next.machine} üzerinde ${next.workOrder} üretime başladı.`);
  changed.add(K.track);
}

function tick(): void {
  const now = Date.now();
  tickNo++;
  const changed = new Set<string>();

  try {
    resumePauses(now, changed);

    const track = readRows(K.track);
    if (!track.length) { emit([...changed]); return; }

    ensureActive(track, changed);
    produce(track, changed);
    flushUgr(changed);
    randomEvents(track, changed);
    qualityCheck(changed);
    checkMaintenance(changed);
    restock(changed);
    updateOrders(track, changed);
    approveLots(changed);
    recomputeStatuses(track, changed);

    if (tickNo % 10 === 0) { updateOee(changed); updateReports(changed); }
    autoShift(track, changed);

    writeRows(K.track, track);
    changed.add(K.track);
  } catch (e) {
    // Bir alt sistem hatası simülasyonu durdurmasın: olay olarak görünür,
    // sonraki tikte tekrar denenir.
    console.error("Simülasyon tik hatası:", e);
    log("hata", `Simülasyon hatası: ${(e as Error)?.message ?? String(e)} — sonraki tikte tekrar denenecek.`);
  }
  emit([...changed]);
}

/* ---------- dış API ---------- */

export function isRunning(): boolean {
  return running;
}

export function getSpeed(): number {
  return speed;
}

export function getEvents(): SimEvent[] {
  return events;
}

export function getStats(): SimStats {
  return { ...stats };
}

export function subscribeSim(fn: (keys: string[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function startSim(): void {
  if (running) return;
  running = true;
  log("uretim", "Üretim başladı — fabrika canlı (tüm modüller bağlı).");
  timer = window.setInterval(tick, TICK_MS);
  emit([K.track]);
}

export function stopSim(): void {
  if (!running) return;
  running = false;
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  log("uretim", "Üretim durduruldu.");
  emit([K.track]);
}

export function setSimSpeed(s: number): void {
  speed = Math.max(1, Math.min(4, s));
  emit([]);
}
