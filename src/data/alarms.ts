/**
 * Olay & Alarm Merkezi motoru (ProManage "Olay Modülü" tarzı)
 * -----------------------------------------------------------
 * "Alarm Kuralları" modülündeki eşikler, canlı verilere karşı
 * sürekli değerlendirilir. Aşan durumlar Alarm Merkezi'nde listelenir,
 * kullanıcı onayladığında (ack) sessizleşir. Onaylar localStorage'da
 * "mesg-alarm-acks" altında saklanır.
 */

import { useEffect, useState } from "react";
import { store } from "./store";
import { MODULES } from "./modules";
import { subscribeSim } from "./simulation";

const K_RULES = "mesg-mod-v8-alarm-kurallari";
const K_ACKS = "mesg-alarm-acks";

export type AlarmSeverity = "Kritik" | "Uyarı" | "Bilgi";

export interface ActiveAlarm {
  id: string;
  ruleCode: string;
  ruleName: string;
  severity: AlarmSeverity;
  target: string;   // hangi nesne (makine kodu, stok kodu, sipariş no...)
  text: string;     // açıklama
  value: string;    // güncel değer
}

function readRows(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as any[];
  } catch { /* yoksay */ }
  const modKey = key.replace("mesg-mod-v8-", "");
  return MODULES[modKey]?.rows ?? [];
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return isNaN(n) ? d : n;
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

/** Kuralları canlı verilere karşı değerlendirir → aktif alarmlar */
export function evaluateAlarms(): ActiveAlarm[] {
  const rules = readRows(K_RULES).filter((r) => String(r.active) === "Evet");
  const out: ActiveAlarm[] = [];

  for (const rule of rules) {
    const code = String(rule.code);
    const sev = (["Kritik", "Uyarı", "Bilgi"].includes(String(rule.severity))
      ? String(rule.severity) : "Uyarı") as AlarmSeverity;
    const th = num(rule.threshold, 0);

    switch (code) {
      case "ALM-001": { // Düşük OEE
        for (const row of readRows("mesg-mod-v8-oee")) {
          const oee = num(row.oee, 100);
          if (oee < th) {
            out.push({
              id: `${code}|${row.machine}`, ruleCode: code, ruleName: String(rule.name),
              severity: sev, target: String(row.machine),
              text: `${row.machine} OEE değeri eşik altında`,
              value: `%${oee}`,
            });
          }
        }
        break;
      }
      case "ALM-002": { // Kritik hammadde stoku
        for (const row of readRows("mesg-mod-v8-hammadde")) {
          const qty = num(row.qty, 0);
          if (qty > 0 && qty < th) {
            out.push({
              id: `${code}|${row.code}`, ruleCode: code, ruleName: String(rule.name),
              severity: sev, target: String(row.code),
              text: `${row.code} (${row.name}) stoğu kritik seviyede`,
              value: `${qty} ${row.unit ?? ""}`.trim(),
            });
          } else if (qty <= 0) {
            out.push({
              id: `${code}|${row.code}`, ruleCode: code, ruleName: String(rule.name),
              severity: "Kritik", target: String(row.code),
              text: `${row.code} (${row.name}) stoğu TÜKENDİ — üretim durabilir`,
              value: `0 ${row.unit ?? ""}`.trim(),
            });
          }
        }
        break;
      }
      case "ALM-003": { // Uzun süren açık arıza
        for (const d of store.getDowntimes()) {
          if (d.endedAt) continue;
          const mins = minutesSince(d.startedAt);
          if (mins >= th) {
            const wc = store.getWorkCenter(d.workCenterId);
            out.push({
              id: `${code}|${d.id}`, ruleCode: code, ruleName: String(rule.name),
              severity: sev, target: wc?.code ?? "?",
              text: `${wc?.code ?? "Makine"} ${mins} dakikadır duruyor — ${d.reason}`,
              value: `${mins} dk`,
            });
          }
        }
        break;
      }
      case "ALM-004": { // SPC kartı uyarısı
        for (const row of readRows("mesg-mod-v8-spc")) {
          if (String(row.status) !== "Kontrol Altında") {
            out.push({
              id: `${code}|${row.parameter}`, ruleCode: code, ruleName: String(rule.name),
              severity: sev, target: String(row.parameter),
              text: `SPC kartı uyarısı: "${row.parameter}" prosesi sınır dışında`,
              value: String(row.status),
            });
          }
        }
        break;
      }
      case "ALM-005": { // Vadesi geçmiş sipariş
        const bugun = today();
        for (const s of readRows("mesg-mod-v8-siparisler")) {
          if (String(s.status) === "Tamamlandı") continue;
          if (String(s.dueDate ?? "") < bugun) {
            out.push({
              id: `${code}|${s.orderNo}`, ruleCode: code, ruleName: String(rule.name),
              severity: sev, target: String(s.orderNo),
              text: `${s.orderNo} — ${s.customer} siparişinin vadesi geçti (${s.dueDate})`,
              value: String(s.status),
            });
          }
        }
        break;
      }
      case "ALM-006": { // Yüksek fire oranı
        const totalProduced = store.getWorkOrders().reduce((a, w) => a + w.producedQty, 0);
        const totalScrap = store.getScraps().reduce((a, r) => a + r.qty, 0);
        if (totalProduced > 0) {
          const pct = Math.round((totalScrap / totalProduced) * 1000) / 10;
          if (pct > th) {
            out.push({
              id: `${code}|GENEL`, ruleCode: code, ruleName: String(rule.name),
              severity: sev, target: "Genel",
              text: `Fire oranı eşik üstünde (${totalScrap} adet fire)`,
              value: `%${pct}`,
            });
          }
        }
        break;
      }
      default:
        break; // tanımsız kural kodu yok sayılır
    }
  }

  // Kritikler önce, sonra uyarılar
  const order: Record<AlarmSeverity, number> = { Kritik: 0, "Uyarı": 1, Bilgi: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

/* ---------- onaylar ---------- */

function getAcks(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(K_ACKS) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function ackAlarm(id: string): void {
  const acks = getAcks();
  acks[id] = new Date().toISOString();
  localStorage.setItem(K_ACKS, JSON.stringify(acks));
}

export function ackAll(): void {
  const acks = getAcks();
  for (const a of evaluateAlarms()) acks[a.id] = new Date().toISOString();
  localStorage.setItem(K_ACKS, JSON.stringify(acks));
}

/** Onaylanmamış (yeni) alarmlar */
export function getUnackedAlarms(): ActiveAlarm[] {
  const acks = getAcks();
  return evaluateAlarms().filter((a) => !acks[a.id]);
}

export function getAckedAlarms(): { alarm: ActiveAlarm; at: string }[] {
  const acks = getAcks();
  return evaluateAlarms()
    .filter((a) => acks[a.id])
    .map((a) => ({ alarm: a, at: acks[a.id] }));
}

/** Sidebar rozeti için canlı okunmamış alarm sayısı */
export function useAlarmCount(): number {
  const [count, setCount] = useState(() => getUnackedAlarms().length);
  useEffect(() => {
    const update = () => setCount(getUnackedAlarms().length);
    update();
    const unsub = subscribeSim(update);
    const t = window.setInterval(update, 15_000);
    return () => { unsub(); window.clearInterval(t); };
  }, []);
  return count;
}
