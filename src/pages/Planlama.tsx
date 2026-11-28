import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock, Plus, Factory, Truck, ArrowRight, Layers, Timer, AlertTriangle,
} from "lucide-react";
import { store } from "../data/store";
import { flowFor, subscribeSim } from "../data/simulation";
import { useAlarmCount } from "../data/alarms";
import { MODULES } from "../data/modules";

const K_ORDERS = "mesg-mod-v8-siparisler";
const K_TRACK = "mesg-mod-v8-uretim-takibi";
const K_SHIFTS = "mesg-mod-v8-vardiya-plani";

function readRows(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as any[];
  } catch { /* yoksay */ }
  const modKey = key.replace("mesg-mod-v8-", "");
  return MODULES[modKey]?.rows ?? [];
}

function writeRows(key: string, rows: any[]): void {
  localStorage.setItem(key, JSON.stringify(rows));
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function riskOf(dateStr: string, status: string): { label: string; color: string } {
  if (status === "Tamamlandı") return { label: "Tamamlandı", color: "#22c55e" };
  const d = daysUntil(dateStr);
  if (d < 0) return { label: `Gecikti ${Math.abs(d)} gün`, color: "#ef4444" };
  if (d <= 2) return { label: `${d} gün kaldı`, color: "#eab308" };
  return { label: `${d} gün`, color: "#38bdf8" };
}

/** Aktif vardaşayı bulur (gece yarısını aşan aralıklar dahil) */
function activeShift(): { name: string; range: string } | null {
  const rows = readRows(K_SHIFTS);
  const now = new Date();
  const t = now.getHours() * 60 + now.getMinutes();
  const parse = (s: string) => {
    const [h, m] = String(s ?? "").split(":").map((n) => parseInt(n, 10));
    return isNaN(h) ? -1 : h * 60 + (isNaN(m) ? 0 : m);
  };
  for (const r of rows) {
    const s = parse(r.start);
    const e = parse(r.end);
    if (s < 0 || e < 0) continue;
    const inRange = s <= e ? t >= s && t < e : t >= s || t < e;
    if (inRange) return { name: String(r.name), range: `${r.start}–${r.end}` };
  }
  return null;
}

export default function Planlama() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeSim(() => setTick((t) => t + 1));
    const t = window.setInterval(() => setTick((x) => x + 1), 15_000);
    return () => { unsub(); window.clearInterval(t); };
  }, []);

  const [toast, setToast] = useState<string | null>(null);
  const alarms = useAlarmCount();

  const orders = readRows(K_ORDERS);
  const track = readRows(K_TRACK);
  const machines = readRows("mesg-mod-v8-makine-listesi");
  const workCenters = store.getWorkCenters();
  const workOrders = store.getWorkOrders();

  const openOrders = orders.filter((o) => !["Tamamlandı", "İptal"].includes(String(o.status)));
  const shift = activeShift();

  // Makine yükü: o makinelerdeki (takip satırı) toplam hedef
  const loadOf = (machineCode: string) =>
    track
      .filter((r) => String(r.machine) === machineCode && String(r.status) !== "Tamamlandı")
      .reduce((a, r) => a + (Number(r.target) || 0), 0);

  const maxLoad = Math.max(1, ...machines.map((m) => loadOf(String(m.code))));

  /** Ürün için en uygun makine: aynı ürünün en çok üretildiği, yoksa en az yüklü */
  const suggestMachine = (product: string): string => {
    const byUsage = new Map<string, number>();
    for (const r of track) {
      if (String(r.product) === product || flowFor(String(r.product)) === flowFor(product)) {
        byUsage.set(String(r.machine), (byUsage.get(String(r.machine)) ?? 0) + 1);
      }
    }
    if (byUsage.size) {
      let best = "";
      let bestN = -1;
      for (const [code, n] of byUsage) {
        if (n > bestN) { best = code; bestN = n; }
      }
      return best;
    }
    let best = "";
    let bestLoad = Infinity;
    for (const m of machines) {
      const l = loadOf(String(m.code));
      if (l < bestLoad) { best = String(m.code); bestLoad = l; }
    }
    return best || (workCenters[0]?.code ?? "");
  };

  const nextWoCode = (): string => {
    let max = 0;
    for (const w of workOrders) {
      const n = parseInt(String(w.code).split("-").pop() ?? "0", 10);
      if (!isNaN(n) && n > max) max = n;
    }
    return `IE-2026-${String(max + 1).padStart(3, "0")}`;
  };

  const createFromOrder = (order: any) => {
    const product = String(order.product);
    const machineCode = suggestMachine(product);
    const wc = workCenters.find((w) => w.code === machineCode) ?? workCenters[0];
    if (!wc) return;
    const flow = flowFor(product);
    const qty = Number(order.qty) || 0;
    const code = nextWoCode();

    try {
      store.createWorkOrder({
        code,
        productName: product,
        productCode: flow ? flow.mamul : undefined,
        workCenterId: wc.id,
        targetQty: qty,
        priority: daysUntil(String(order.dueDate)) <= 2 ? "Acil" : "Yüksek",
        dueDate: String(order.dueDate),
      });
    } catch (e: any) {
      setToast(e?.message ?? "İş emri oluşturulamadı");
      window.setTimeout(() => setToast(null), 5000);
      return;
    }

    const next = readRows(K_TRACK);
    next.unshift({
      machine: wc.code,
      workOrder: code,
      product: flow ? flow.label : product,
      status: "Planlandı",
      produced: 0,
      target: qty,
      orderNo: String(order.orderNo),
    });
    writeRows(K_TRACK, next);

    // Siparişin durumunu güncelle
    const allOrders = readRows(K_ORDERS);
    const idx = allOrders.findIndex((o) => String(o.orderNo) === String(order.orderNo));
    if (idx >= 0) {
      allOrders[idx] = { ...allOrders[idx], status: "Üretimde", workOrder: code };
      writeRows(K_ORDERS, allOrders);
    }

    setToast(`${code} oluşturuldu → ${wc.code} · ${qty.toLocaleString("tr-TR")} adet`);
    window.setTimeout(() => setToast(null), 4000);
    setTick((t) => t + 1);
  };

  const hasWorkOrderFor = (orderNo: string) =>
    track.some((r) => String(r.orderNo) === String(orderNo));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock size={22} style={{ color: "var(--accent)" }} />
            Üretim Planlama
          </h1>
          <p className="text-muted text-sm">
            Siparişten iş emrine atama, makine yükü ve bitiş tahmini (ProManage tarzı planlama)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shift && (
            <span className="card px-3 py-2 text-sm font-semibold flex items-center gap-2">
              <Timer size={15} style={{ color: "var(--accent)" }} />
              {shift.name} <span className="text-muted font-normal">· {shift.range}</span>
            </span>
          )}
          {alarms > 0 && (
            <span className="card px-3 py-2 text-sm font-semibold flex items-center gap-2" style={{ color: "#ef4444" }}>
              <AlertTriangle size={15} /> {alarms} alarm
            </span>
          )}
        </div>
      </div>

      {toast && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2"
          style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
        >
          <Plus size={16} /> {toast}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Açık siparişler */}
        <div className="xl:col-span-2 card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Truck size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">Açık Siparişler</h2>
            <span className="ml-auto text-xs text-muted">{openOrders.length} sipariş iş emri bekliyor</span>
          </div>
          <div className="space-y-2 max-h-[32rem] overflow-auto pr-1">
            {openOrders.length === 0 && (
              <div className="text-sm" style={{ color: "var(--success)" }}>✓ Tüm siparişler planlandı.</div>
            )}
            {openOrders.map((o) => {
              const risk = riskOf(String(o.dueDate), String(o.status));
              const planned = hasWorkOrderFor(String(o.orderNo));
              const flow = flowFor(String(o.product));
              return (
                <div
                  key={String(o.orderNo)}
                  className="rounded-xl border p-3 flex items-center gap-3 flex-wrap"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
                >
                  <div className="min-w-[9rem]">
                    <div className="font-mono text-sm font-bold">{o.orderNo}</div>
                    <div className="text-xs text-muted truncate">{o.customer}</div>
                  </div>
                  <div className="flex-1 min-w-[10rem]">
                    <div className="text-sm font-medium">{o.product}</div>
                    <div className="text-xs text-muted">
                      {(Number(o.qty) || 0).toLocaleString("tr-TR")} adet · termin {String(o.dueDate)}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-1 rounded-full"
                    style={{ backgroundColor: `color-mix(in srgb, ${risk.color} 18%, transparent)`, color: risk.color }}
                  >
                    {risk.label}
                  </span>
                  {planned ? (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: "color-mix(in srgb, #22c55e 18%, transparent)", color: "#22c55e" }}>
                      Planlandı ✓
                    </span>
                  ) : (
                    <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => createFromOrder(o)}>
                      <Plus size={14} /> İş Emri Oluştur
                    </button>
                  )}
                  {flow && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--surface)" }}>
                      {flow.raw} → {flow.ym} → {flow.mamul}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Planlama özeti */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Layers size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">Planlama Özeti</h2>
          </div>
          {[
            { label: "Açık sipariş", value: openOrders.length, color: openOrders.length ? "#eab308" : "#22c55e" },
            { label: "Planlanan iş emri", value: workOrders.filter((w) => w.status === "Planlandı").length, color: "var(--accent)" },
            { label: "Üretimdeki iş emri", value: workOrders.filter((w) => w.status === "Üretimde").length, color: "#22c55e" },
            { label: "Vadesi gelen sipariş (≤2 gün)", value: openOrders.filter((o) => daysUntil(String(o.dueDate)) <= 2).length, color: "#ef4444" },
          ].map((k) => (
            <div key={k.label} className="flex items-center justify-between text-sm border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <span className="text-muted">{k.label}</span>
              <span className="font-bold text-lg" style={{ color: k.color }}>{k.value}</span>
            </div>
          ))}
          <Link to="/emirler" className="btn-ghost w-full justify-center">
            İş Emirlerini Gör <ArrowRight size={14} />
          </Link>
          <Link to="/siparisler" className="btn-ghost w-full justify-center">
            Siparişleri Düzenle <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Makine yükü */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Factory size={18} style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold">Makine Yükü &amp; Bitiş Tahmini</h2>
          <span className="ml-auto text-xs text-muted">Toplam planlı iş hedefi bazında</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {machines.map((m) => {
            const code = String(m.code);
            const load = loadOf(code);
            const pct = Math.round((load / maxLoad) * 100);
            const wc = workCenters.find((w) => w.code === code);
            const busy = track.find(
              (r) => String(r.machine) === code && String(r.status) === "Üretimde"
            );
            // Tahmini bitiş: iş emri kalan adet / vardiya başına tipik hız (sim: 600 adet/saat)
            let eta = "—";
            if (busy) {
              const remaining = Math.max(0, (Number(busy.target) || 0) - (Number(busy.produced) || 0));
              const hours = remaining / 600;
              eta = hours < 1
                ? `~${Math.max(5, Math.round(hours * 60))} dk`
                : `~${hours.toFixed(1)} sa`;
            }
            const color = pct > 75 ? "#ef4444" : pct > 40 ? "#eab308" : "var(--accent)";
            return (
              <div key={code} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-sm font-bold">{code}</span>
                  <span className="text-xs text-muted truncate">{String(m.name)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: String(m.status) === "Üretimde" ? "color-mix(in srgb, #22c55e 18%, transparent)" : "var(--surface-2)",
                      color: String(m.status) === "Üretimde" ? "#22c55e" : "var(--text-muted)",
                    }}
                  >
                    {String(m.status)}
                  </span>
                  {busy && <span className="font-mono">{String(busy.workOrder)}</span>}
                  {busy && <span className="ml-auto flex items-center gap-1 text-muted"><Timer size={12} /> {eta}</span>}
                  {wc && !busy && <span className="ml-auto text-muted">boşta</span>}
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: pct + "%", backgroundColor: color }} />
                </div>
                <div className="flex justify-between text-[11px] mt-1">
                  <span className="text-muted">Yük</span>
                  <span className="font-bold" style={{ color }}>{load.toLocaleString("tr-TR")} adet · %{pct}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted">
        Planlama sayfası: açık siparişlerden tek tıkla iş emri oluşturur. Makine önerisi aynı ürünün
        en çok üretildiği makine, yoksa en az yüklü makinedir. Bitiş tahmini 600 adet/saat varsayımına
        dayanır. <strong>Not:</strong> Bu ekran basit öneri verir; sonlu kapasite planlama (finite capacity scheduling) değildir. Oluşturulan iş emirleri <Link style={{ color: "var(--accent)" }} to="/emirler">İş Emirleri</Link> ve
        {" "}<Link style={{ color: "var(--accent)" }} to="/uretim/uretim-takibi">Üretim Takibi</Link> modüllerinde görünür.
      </p>
    </div>
  );
}
