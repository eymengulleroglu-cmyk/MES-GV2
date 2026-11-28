import { useEffect, useState } from "react";
import {
  Play, Pause, Gauge, Package, CheckCircle2, AlertTriangle, Wrench,
  Activity, Database, Boxes, ClipboardList, ShieldCheck, Factory,
} from "lucide-react";
import {
  isRunning, getSpeed, setSimSpeed, getEvents, getStats,
  startSim, stopSim, subscribeSim, type SimEvent,
} from "../data/simulation";
import { MODULES } from "../data/modules";

function readRows(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as any[];
  } catch { /* yoksay */ }
  const modKey = key.replace("mesg-mod-v8-", "");
  return MODULES[modKey]?.rows ?? [];
}

const kindColor: Record<SimEvent["kind"], string> = {
  uretim: "var(--accent)",
  emir: "var(--success)",
  ariza: "var(--warning)",
  fire: "var(--danger)",
  kalite: "#38bdf8",
  bakim: "#f97316",
  stok: "#94a3b8",
  siparis: "#8b5cf6",
  lot: "#06b6d4",
  hata: "#f43f5e",
};

const kindLabel: Record<SimEvent["kind"], string> = {
  uretim: "Üretim",
  emir: "Emir",
  ariza: "Arıza",
  fire: "Fire",
  kalite: "Kalite",
  bakim: "Bakım",
  stok: "Stok",
  siparis: "Sipariş",
  lot: "Lot",
  hata: "Hata",
};

function seedTotal(key: string): number {
  const modKey = key.replace("mesg-mod-v8-", "");
  return (MODULES[modKey]?.rows ?? []).reduce((s, r) => s + (Number(r.qty) || 0), 0);
}

export default function Simulasyon() {
  const [running, setRunning] = useState(isRunning());
  const [speed, setSpeed] = useState(getSpeed());
  const [events, setEvents] = useState<SimEvent[]>(getEvents());
  const [stats, setStats] = useState(getStats());
  const [, setTick] = useState(0);

  useEffect(
    () =>
      subscribeSim(() => {
        setRunning(isRunning());
        setEvents(getEvents());
        setStats(getStats());
        setTick((t) => t + 1);
      }),
    [],
  );

  // Canlı modül verileri
  const track = readRows("mesg-mod-v8-uretim-takibi");
  const ham = readRows("mesg-mod-v8-hammadde");
  const ym = readRows("mesg-mod-v8-yari-mamul");
  const mam = readRows("mesg-mod-v8-mamul");
  const sips = readRows("mesg-mod-v8-siparisler");
  const oeeRows = readRows("mesg-mod-v8-oee");
  const machines = readRows("mesg-mod-v8-makine-listesi");
  const lots = readRows("mesg-mod-v8-lot-takibi");
  const serials = readRows("mesg-mod-v8-seri-no");
  const spc = readRows("mesg-mod-v8-spc");

  const active = track.filter((r) => String(r.status) === "Üretimde");
  const planned = track.filter((r) => ["Planlandı", "Bekliyor"].includes(String(r.status)));
  const done = track.filter((r) => String(r.status) === "Tamamlandı");

  const statCards = [
    { title: "Bu oturumda üretilen", value: stats.produced.toLocaleString("tr-TR"), icon: Package, color: "var(--accent)" },
    { title: "Tamamlanan iş emri", value: String(stats.completed), icon: CheckCircle2, color: "var(--success)" },
    { title: "Arıza olayı", value: String(stats.downtimes), icon: Wrench, color: "var(--warning)" },
    { title: "Fire (adet)", value: String(stats.scraps), icon: AlertTriangle, color: "var(--danger)" },
    { title: "Kalite kontrolü", value: String(stats.checks), icon: ShieldCheck, color: "#38bdf8" },
    { title: "Planlı bakım", value: String(stats.maintenance), icon: Factory, color: "#f97316" },
    { title: "Hazırlanan sipariş", value: String(stats.orders), icon: ClipboardList, color: "#8b5cf6" },
    { title: "Oluşturulan lot", value: String(stats.lots), icon: Boxes, color: "#06b6d4" },
  ];

  // Stok seviyeleri (tohum toplamına göre yüzde)
  const stocks = [
    { key: "mesg-mod-v8-hammadde", label: "Hammadde", rows: ham, color: "var(--warning)" },
    { key: "mesg-mod-v8-yari-mamul", label: "Yarı Mamul", rows: ym, color: "#38bdf8" },
    { key: "mesg-mod-v8-mamul", label: "Mamul", rows: mam, color: "var(--success)" },
  ].map((s) => {
    const total = s.rows.reduce((a, r) => a + (Number(r.qty) || 0), 0);
    const base = seedTotal(s.key) || 1;
    return { ...s, total, pct: Math.min(100, Math.round((total / base) * 100)) };
  });

  // Açık siparişler + mamul karşılığı
  const openSips = sips.filter((s) => String(s.status) !== "Tamamlandı").slice(0, 6);
  const mamulOf = (product: string) => {
    const p = product.toLowerCase();
    const row = mam.find((m) => String(m.name).toLowerCase() === p)
      ?? mam.find((m) => p.includes(String(m.name).toLowerCase().split(" ")[0]));
    return row ? Number(row.qty) || 0 : 0;
  };

  const spcWarning = spc.filter((s) => String(s.status) !== "Kontrol Altında").length;
  const lotApproved = lots.filter((l) => String(l.status) === "Onaylandı").length;
  const machineStatus = (code: string) => String(machines.find((m) => String(m.code) === code)?.status ?? "Boşta");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Üretim Simülasyonu</h1>
          <p className="text-muted text-sm">
            Tüm modüller bağlı: üretim, stok, kalite, bakım, sipariş, izlenebilirlik ve raporlar canlı hareket eder.
            <span className="ml-2 font-semibold" style={{ color: "var(--accent)" }}>Vardiya {stats.shift}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: running ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "var(--surface-2)",
              color: running ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: running ? "var(--accent)" : "var(--text-muted)" }} />
            {running ? "Canlı" : "Durduruldu"}
          </span>
          <button onClick={() => (running ? stopSim() : startSim())} className={running ? "btn-danger" : "btn-primary"}>
            {running ? <><Pause size={16} /> Durdur</> : <><Play size={16} /> Üretime Başla</>}
          </button>
        </div>
      </div>

      {/* Hız */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <Gauge size={18} style={{ color: "var(--accent)" }} />
        <span className="font-semibold text-sm">Hız</span>
        <div className="flex gap-2">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => { setSimSpeed(s); setSpeed(s); }}
              className="btn-ghost !px-3 !py-1.5 text-xs"
              style={speed === s ? { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" } : {}}
            >
              {s}x
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">
          1x = gerçek zaman. Tüm emirler bitince otomatik olarak yeni vardiya başlar.
        </span>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div key={c.title} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">{c.title}</span>
              <c.icon size={18} style={{ color: c.color }} />
            </div>
            <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Canlı iş emirleri */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">Canlı İş Emirleri</h2>
            <span className="ml-auto text-xs text-muted">
              {active.length} üretimde · {planned.length} planlı · {done.length} tamamlandı
            </span>
          </div>
          <div className="space-y-3">
            {active.length === 0 && planned.length === 0 && (
              <div className="text-muted text-sm">
                {done.length === 0
                  ? "Başlamak için sağ üstteki “Üretime Başla” düğmesine basın."
                  : "Tüm emirler tamamlandı — yeni vardiya hazırlanıyor..."}
              </div>
            )}
            {[...active, ...planned].slice(0, 8).map((r, i) => {
              const target = Number(r.target) || 0;
              const produced = Number(r.produced) || 0;
              const pct = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;
              const isActive = String(r.status) === "Üretimde";
              return (
                <div key={i} className="border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="font-medium truncate">
                      {r.machine} — <span className="text-muted font-mono text-xs">{r.workOrder}</span>
                      <span className="ml-2 text-xs" style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>
                        {machineStatus(String(r.machine))}
                      </span>
                    </span>
                    <span className="text-xs font-semibold" style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>
                      {isActive ? `${produced.toLocaleString("tr-TR")} / ${target.toLocaleString("tr-TR")}` : String(r.status)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: pct + "%", backgroundColor: isActive ? "var(--accent)" : "var(--text-muted)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Olay akışı */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
            <h2 className="font-semibold">Olay Akışı</h2>
            <span className="ml-auto text-xs text-muted">son {events.length} olay</span>
          </div>
          <div className="space-y-1.5 max-h-[26rem] overflow-auto pr-1">
            {events.length === 0 && <div className="text-muted text-sm">Henüz olay yok.</div>}
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-sm border-b pb-1.5" style={{ borderColor: "var(--border)" }}>
                <span className="font-mono text-xs text-muted pt-0.5">{e.time}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--surface-2)", color: kindColor[e.kind] }}
                >
                  {kindLabel[e.kind]}
                </span>
                <span className="flex-1">{e.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stok akışı */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Boxes size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">Stok Akışı (Hammadde → Yarı Mamul → Mamul)</h2>
          </div>
          {stocks.map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.label}</span>
                <span className="text-xs text-muted">
                  {s.total.toLocaleString("tr-TR")} toplam · <span style={{ color: s.color }}>%{s.pct}</span>
                </span>
              </div>
              <div className="mt-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: s.pct + "%", backgroundColor: s.color }} />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted">
            Üretim hammaddeleri tüketir, yarı mamul biriktirir; emir tamamlanınca mamule dönüşür.
            Hammadde tükenirse üretim durur, ~90 sn sonra sevkiyat gelir.
          </p>
        </div>

        {/* Siparişler */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} style={{ color: "#8b5cf6" }} />
            <h2 className="font-semibold">Müşteri Siparişleri</h2>
            <span className="ml-auto text-xs text-muted">{stats.orders} hazırlandı</span>
          </div>
          <div className="space-y-2">
            {openSips.length === 0 && <div className="text-muted text-sm">Tüm siparişler hazırlandı ✓</div>}
            {openSips.map((s) => {
              const need = Number(s.qty) || 0;
              const have = mamulOf(String(s.product ?? ""));
              const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0;
              const st = String(s.status);
              return (
                <div key={String(s.orderNo)} className="border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="font-medium truncate">
                      <span className="font-mono text-xs">{s.orderNo}</span>
                      <span className="text-muted"> · {s.customer}</span>
                    </span>
                    <span className="text-xs font-semibold" style={{ color: st === "Üretimde" ? "var(--accent)" : "var(--text-muted)" }}>
                      {st} · {have.toLocaleString("tr-TR")}/{need.toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: pct + "%", backgroundColor: "#8b5cf6" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OEE */}
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Factory size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">Canlı OEE</h2>
            <span className="ml-auto text-xs text-muted">Arıza → kullanılabilirlik, fire → kalite etkiler</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "var(--surface-2)" }}>
                <tr>
                  <th className="text-left p-2">Makine</th>
                  <th className="text-right p-2">Kull. %</th>
                  <th className="text-right p-2">Performans %</th>
                  <th className="text-right p-2">Kalite %</th>
                  <th className="text-right p-2">OEE %</th>
                  <th className="text-left p-2">Durum</th>
                </tr>
              </thead>
              <tbody>
                {oeeRows.map((r, i) => {
                  const oee = Number(r.oee) || 0;
                  const color = oee >= 80 ? "#22c55e" : oee >= 65 ? "#eab308" : "#ef4444";
                  const st = machineStatus(String(r.machine));
                  return (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="p-2 font-medium">{r.machine}</td>
                      <td className="p-2 text-right">{r.availability}</td>
                      <td className="p-2 text-right">{r.performance}</td>
                      <td className="p-2 text-right">{r.quality}</td>
                      <td className="p-2 text-right font-bold" style={{ color }}>{oee}</td>
                      <td className="p-2 text-xs" style={{ color: st === "Üretimde" ? "var(--accent)" : st === "Duruş" || st === "Planlı Bakım" ? "var(--warning)" : "var(--text-muted)" }}>
                        {st}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kalite & İzlenebilirlik */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: "#38bdf8" }} />
            <h2 className="font-semibold">Kalite &amp; İzlenebilirlik</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Yapılan kontrol", value: stats.checks, color: "#38bdf8" },
              { label: "SPC kartı uyarısı", value: spcWarning, color: spcWarning ? "var(--warning)" : "var(--success)" },
              { label: "Oluşturulan lot", value: stats.lots, color: "#06b6d4" },
              { label: "Lot onaylandı", value: lotApproved, color: "var(--success)" },
              { label: "Seri no kaydı", value: serials.length, color: "var(--accent)" },
              { label: "Fire (adet)", value: stats.scraps, color: "var(--danger)" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3" style={{ backgroundColor: "var(--surface-2)" }}>
                <div className="text-xs text-muted">{s.label}</div>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            Her üretim tik'i rastgele kalite kontrolü tetikler (Kontrol Parametreleri limitleri esas alınır).
            Sınır dışı değer → fire kaydı + SPC kartı uyarısı. Emir tamamlanınca Lot ve Seri No oluşturulur,
            ~30 sn sonra kalite onayı alınır.
          </p>
        </div>
      </div>

      {/* Veri kaynakları */}
      <div className="card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Database size={18} style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold">Simülasyonun Veri Kaynakları — Tüm Modüller</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <ul className="space-y-1">
            <li className="font-semibold" style={{ color: "var(--accent)" }}>Üretim</li>
            <li className="text-muted">· Ürünler — ürün/stok eşleşmesi</li>
            <li className="text-muted">· Siparişler — mamul hazır olunca sevke hazırlanır</li>
            <li className="text-muted">· İş Emirleri — adetler ve tamamlanma</li>
            <li className="text-muted">· Üretim Girişi — operatör kayıtları (100 adette bir)</li>
            <li className="text-muted">· Üretim Takibi — canlı üretim satırları</li>
          </ul>
          <ul className="space-y-1">
            <li className="font-semibold" style={{ color: "var(--accent)" }}>Makine &amp; Kalite</li>
            <li className="text-muted">· Makine Listesi — Duruş/Bakım/Üretimde durumları</li>
            <li className="text-muted">· Arıza Nedenleri — rastgele arıza nedenleri</li>
            <li className="text-muted">· Bakım Planları — periyot dolunca planlı bakım</li>
            <li className="text-muted">· OEE — arıza/fire ile canlı hesap</li>
            <li className="text-muted">· Kontrol Parametreleri · Hata Türleri · SPC</li>
          </ul>
          <ul className="space-y-1">
            <li className="font-semibold" style={{ color: "var(--accent)" }}>Stok · İzlenebilirlik · Yönetim</li>
            <li className="text-muted">· Hammadde → Yarı Mamul → Mamul akışı</li>
            <li className="text-muted">· Lot Takibi · Seri No — emir bitince oluşur</li>
            <li className="text-muted">· Raporlar — 4 rapor canlı hesaplanır</li>
            <li className="text-muted">· Kullanıcılar — operatör seçimi</li>
            <li className="text-muted">· Yetkiler — rol matrisine göre üretim girişi</li>
          </ul>
        </div>
        <p className="text-xs text-muted">
          Kayıtlar localStorage'a yazıldığı için ilgili modül sayfalarında, Pano KPI'larında ve
          (senkronizasyon açıkken) bulutta anında görünür.
        </p>
      </div>
    </div>
  );
}
