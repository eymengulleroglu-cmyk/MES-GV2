import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, TrendingDown, Scissors, Gauge, Lightbulb, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ComposedChart, Line, Cell, Legend,
} from "recharts";
import { store } from "../data/store";
import { subscribeSim } from "../data/simulation";
import { MODULES } from "../data/modules";

function readRows(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as any[];
  } catch { /* yoksay */ }
  const modKey = key.replace("mesg-mod-v8-", "");
  return MODULES[modKey]?.rows ?? [];
}

interface ParetoRow {
  name: string;
  value: number;
  count: number;
  cum: number; // kümülatif %
}

function toPareto(entries: { name: string; value: number; count: number }[]): ParetoRow[] {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((a, e) => a + e.value, 0) || 1;
  let run = 0;
  return sorted.map((e) => {
    run += e.value;
    return { ...e, cum: Math.round((run / total) * 1000) / 10 };
  });
}

const tipStyle = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--text)",
  fontSize: 12,
} as const;

export default function KayipAnalizi() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeSim(() => setTick((t) => t + 1));
    const t = window.setInterval(() => setTick((x) => x + 1), 15_000);
    return () => { unsub(); window.clearInterval(t); };
  }, []);

  const downtimes = store.getDowntimes();
  const scraps = store.getScraps();
  const oeeRows = readRows("mesg-mod-v8-oee");

  // --- Duruş Pareto (dakika) ---
  const downtimePareto = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    for (const d of downtimes) {
      const end = d.endedAt ? new Date(d.endedAt).getTime() : Date.now();
      const mins = Math.max(1, Math.round((end - new Date(d.startedAt).getTime()) / 60000));
      const cur = map.get(d.reason) ?? { value: 0, count: 0 };
      cur.value += mins;
      cur.count += 1;
      map.set(d.reason, cur);
    }
    return toPareto([...map].map(([name, v]) => ({ name, ...v })));
  }, [downtimes]);

  // --- Fire Pareto (adet) ---
  const scrapPareto = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    for (const s of scraps) {
      const cur = map.get(s.reason) ?? { value: 0, count: 0 };
      cur.value += s.qty;
      cur.count += 1;
      map.set(s.reason, cur);
    }
    return toPareto([...map].map(([name, v]) => ({ name, ...v })));
  }, [scraps]);

  // --- OEE kayıp kırılımı (100-K, 100-P, 100-Q ortalaması) ---
  const oeeLoss = useMemo(() => {
    if (!oeeRows.length) return [];
    const avg = (k: string) =>
      Math.round(oeeRows.reduce((a, r) => a + (Number(r[k]) || 0), 0) / oeeRows.length * 10) / 10;
    const a = avg("availability");
    const p = avg("performance");
    const q = avg("quality");
    return [
      { name: "Kullanılabilirlik Kaybı", kayip: Math.round((100 - a) * 10) / 10, value: Math.round((100 - a) * 10) / 10, fill: "#ef4444" },
      { name: "Performans Kaybı", kayip: Math.round((100 - p) * 10) / 10, value: Math.round((100 - p) * 10) / 10, fill: "#eab308" },
      { name: "Kalite Kaybı", kayip: Math.round((100 - q) * 10) / 10, value: Math.round((100 - q) * 10) / 10, fill: "#38bdf8" },
    ];
  }, [oeeRows]);

  const avgOee = oeeRows.length
    ? Math.round(oeeRows.reduce((a, r) => a + (Number(r.oee) || 0), 0) / oeeRows.length * 10) / 10
    : 0;

  const totalDowntime = downtimePareto.reduce((a, r) => a + r.value, 0);
  const totalScrap = scrapPareto.reduce((a, r) => a + r.value, 0);
  const totalProduced = store.getWorkOrders().reduce((a, w) => a + w.producedQty, 0);
  const scrapPct = totalProduced > 0 ? Math.round((totalScrap / totalProduced) * 1000) / 10 : 0;

  // --- Kurallı öneriler ---
  const oneriler: { text: string; color: string }[] = [];
  const topDown = downtimePareto[0];
  if (topDown && topDown.cum <= 80) {
    const top2 = downtimePareto.slice(0, 2).map((r) => r.name).join(" ve ");
    oneriler.push({
      text: `Toplam duruşun %${Math.round(topDown.cum)}'i "${topDown.name}" kaynaklı. ${downtimePareto.length > 1 ? `İlk iki neden (${top2}) toplamın %${downtimePareto[1]?.cum ?? topDown.cum}'ini oluşturuyor — bu iki nedeni kök neden analiziyle ele alın.` : "Kök neden analiziyle önceliklendirin."}`,
      color: "#ef4444",
    });
  }
  const topScrap = scrapPareto[0];
  if (topScrap && scrapPct > 2) {
    oneriler.push({
      text: `Fire oranı %${scrapPct} — eşik (%2) üzerinde. En büyük fire nedeni "${topScrap.name}" (${topScrap.value} adet). SPC ve kontrol planını bu özellik için gözden geçirin.`,
      color: "#eab308",
    });
  }
  if (avgOee < 75) {
    oneriler.push({
      text: `Fabrika OEE ortalaması %${avgOee} — hedef (%75) altında. OEE kayıp kırılımında en büyük pay "${[...oeeLoss].sort((a, b) => b.kayip - a.kayip)[0]?.name ?? "—"}" kaybında. İyileştirmeye buradan başlayın.`,
      color: "#eab308",
    });
  }
  const lowMachines = oeeRows.filter((r) => (Number(r.oee) || 0) < 75);
  if (lowMachines.length) {
    oneriler.push({
      text: `${lowMachines.length} makinenin OEE'si %75 altında: ${lowMachines.map((r) => `${r.machine} (%${r.oee})`).join(", ")}. Bu makinelerde duruş ve performans kayıplarını inceleyin.`,
      color: "#38bdf8",
    });
  }
  if (!oneriler.length) {
    oneriler.push({ text: "Kayıplar hedeflerin altında — mevcut performansı koruyun.", color: "#22c55e" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={22} style={{ color: "var(--accent)" }} />
            Kayıp Analizi — Pareto
          </h1>
          <p className="text-muted text-sm">
            Duruş ve fire nedenlerinin Pareto analizi, OEE kayıp kırılımı ve otomatik öneriler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/durus-fire" className="btn-ghost">Duruş &amp; Fire Kaydı <ArrowRight size={14} /></Link>
        </div>
      </div>

      {/* Özet KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Toplam duruş", value: `${totalDowntime} dk`, icon: TrendingDown, color: totalDowntime > 60 ? "#ef4444" : "#eab308" },
          { label: "Toplam fire", value: `${totalScrap} adet`, icon: Scissors, color: scrapPct > 2 ? "#ef4444" : "#22c55e" },
          { label: "Fire oranı", value: `%${scrapPct}`, icon: Scissors, color: scrapPct > 2 ? "#ef4444" : "#22c55e" },
          { label: "Fabrika OEE", value: `%${avgOee}`, icon: Gauge, color: avgOee >= 75 ? "#22c55e" : "#eab308" },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted">{k.label}</span>
              <k.icon size={16} style={{ color: k.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Duruş Pareto */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} style={{ color: "#ef4444" }} />
            <h2 className="font-semibold">Duruş Pareto (dakika)</h2>
            <span className="ml-auto text-xs text-muted">%80 kuralı: kırmızı çizgi</span>
          </div>
          {downtimePareto.length === 0 ? (
            <div className="text-sm text-muted">Henüz duruş kaydı yok.</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={downtimePareto} margin={{ top: 8, right: 8, left: -18, bottom: 64 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <Tooltip contentStyle={tipStyle} formatter={(v: any, n: any) => (n === "value" ? [`${v} dk`, "Süre"] : n === "cum" ? [`%${v}`, "Kümülatif"] : [v, String(n)])} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="value" name="Süre (dk)" radius={[6, 6, 0, 0]}>
                    {downtimePareto.map((r, i) => (
                      <Cell key={i} fill={r.cum <= 80 ? "#ef4444" : "#eab308"} />
                    ))}
                  </Bar>
                  <Line yAxisId="r" type="monotone" dataKey="cum" name="Kümülatif %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-1 max-h-40 overflow-auto">
            {downtimePareto.map((r) => (
              <div key={r.name} className="flex items-center gap-2 text-xs border-b pb-1" style={{ borderColor: "var(--border)" }}>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="font-mono">{r.value} dk</span>
                <span className="text-muted">×{r.count}</span>
                <span className="font-bold" style={{ color: r.cum <= 80 ? "#ef4444" : "#eab308" }}>%{r.cum}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fire Pareto */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Scissors size={18} style={{ color: "#eab308" }} />
            <h2 className="font-semibold">Fire Pareto (adet)</h2>
            <span className="ml-auto text-xs text-muted">Kümülatif %80: kırmızı</span>
          </div>
          {scrapPareto.length === 0 ? (
            <div className="text-sm text-muted">Henüz fire kaydı yok.</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={scrapPareto} margin={{ top: 8, right: 8, left: -18, bottom: 64 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <Tooltip contentStyle={tipStyle} formatter={(v: any, n: any) => (n === "value" ? [`${v} adet`, "Fire"] : n === "cum" ? [`%${v}`, "Kümülatif"] : [v, String(n)])} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="value" name="Fire (adet)" radius={[6, 6, 0, 0]}>
                    {scrapPareto.map((r, i) => (
                      <Cell key={i} fill={r.cum <= 80 ? "#f59e0b" : "#fbbf24"} />
                    ))}
                  </Bar>
                  <Line yAxisId="r" type="monotone" dataKey="cum" name="Kümülatif %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-1 max-h-40 overflow-auto">
            {scrapPareto.map((r) => (
              <div key={r.name} className="flex items-center gap-2 text-xs border-b pb-1" style={{ borderColor: "var(--border)" }}>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="font-mono">{r.value} adet</span>
                <span className="text-muted">×{r.count}</span>
                <span className="font-bold" style={{ color: r.cum <= 80 ? "#f59e0b" : "#eab308" }}>%{r.cum}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* OEE kayıp kırılımı */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Gauge size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">OEE Kayıp Kırılımı</h2>
            <span className="ml-auto text-xs text-muted">100 − Kullanılabilirlik / Performans / Kalite</span>
          </div>
          {oeeLoss.length === 0 ? (
            <div className="text-sm text-muted">OEE verisi yok.</div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={oeeLoss} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} unit="%" />
                    <Tooltip contentStyle={tipStyle} formatter={(v: any) => [`%${v}`, "Kayıp"]} />
                    <Bar dataKey="kayip" name="Kayıp %" radius={[6, 6, 0, 0]}>
                      {oeeLoss.map((r, i) => <Cell key={i} fill={r.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted">Ortalama OEE:</span>
                <span className="font-bold text-xl" style={{ color: avgOee >= 75 ? "#22c55e" : "#eab308" }}>%{avgOee}</span>
                <span className="text-muted ml-auto">Hedef: %75</span>
              </div>
            </>
          )}
        </div>

        {/* Öneriler */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} style={{ color: "var(--warning)" }} />
            <h2 className="font-semibold">Otomatik Öneriler</h2>
            <span className="ml-auto text-xs text-muted">kurallara dayalı</span>
          </div>
          <div className="space-y-2">
            {oneriler.map((o, i) => (
              <div
                key={i}
                className="rounded-xl p-3 text-sm border flex items-start gap-2"
                style={{ borderColor: "var(--border)", backgroundColor: `color-mix(in srgb, ${o.color} 8%, transparent)` }}
              >
                <Lightbulb size={15} style={{ color: o.color }} className="shrink-0 mt-0.5" />
                <span>{o.text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            Öneriler Pareto kümülatif %80 kuralı, fire %2 eşiği ve OEE %75 hedefinden üretilir.
            Kalıcı kök neden analizi için{" "}
            <Link to="/durus-fire" style={{ color: "var(--accent)" }}>Duruş &amp; Fire</Link> modülündeki
            kayıtları güncelleyin.
          </p>
        </div>
      </div>
    </div>
  );
}
