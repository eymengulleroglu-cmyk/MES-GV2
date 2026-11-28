import { useEffect, useState } from "react";
import {
  Play, Pause, Clock, Factory, AlertTriangle, Activity, Bell, Gauge, TrendingDown,
} from "lucide-react";
import { isRunning, getEvents, getStats, subscribeSim } from "../data/simulation";
import { getUnackedAlarms } from "../data/alarms";
import type { ActiveAlarm } from "../data/alarms";
import { store } from "../data/store";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { MODULES } from "../data/modules";

function readRows(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as any[];
  } catch { /* yoksay */ }
  const modKey = key.replace("mesg-mod-v8-", "");
  return MODULES[modKey]?.rows ?? [];
}

const sevColor: Record<ActiveAlarm["severity"], string> = {
  Kritik: "#ef4444",
  "Uyarı": "#eab308",
  Bilgi: "#38bdf8",
};

/** Vardiya planından aktif vardaşayı bulur (gece yarısını aşan aralıklar dahil) */
function activeShift(): { code: string; name: string; range: string } | null {
  const rows = readRows("mesg-mod-v8-vardiya-plani");
  if (!rows.length) return null;
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
    if (inRange) return { code: String(r.code), name: String(r.name), range: `${r.start}–${r.end}` };
  }
  return null;
}

export default function Andon() {
  const [, setTick] = useState(0);
  const [now, setNow] = useState(new Date());
  const [running, setRunning] = useState(isRunning());

  useEffect(() => {
    const unsub = subscribeSim(() => {
      setRunning(isRunning());
      setTick((t) => t + 1);
    });
    const t = window.setInterval(() => {
      setNow(new Date());
      setTick((x) => x + 1);
    }, 2000);
    return () => { unsub(); window.clearInterval(t); };
  }, []);

  const machines = readRows("mesg-mod-v8-makine-listesi");
  const oeeRows = readRows("mesg-mod-v8-oee");
  const track = readRows("mesg-mod-v8-uretim-takibi");
  const events = getEvents();
  const stats = getStats();
  const alarms = getUnackedAlarms();
  const shift = activeShift();

  // Duruş nedeni → dakika (Pareto)
  const downtimeByReason = (() => {
    const map = new Map<string, number>();
    for (const d of store.getDowntimes()) {
      const end = d.endedAt ? new Date(d.endedAt).getTime() : Date.now();
      const mins = Math.max(1, Math.round((end - new Date(d.startedAt).getTime()) / 60000));
      map.set(d.reason, (map.get(d.reason) ?? 0) + mins);
    }
    return [...map].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  })();

  // (statusDist ve statusColorHex kullanılmıyor)
  const oeeAvg = oeeRows.length
    ? Math.round(oeeRows.reduce((s, r) => s + (Number(r.oee) || 0), 0) / oeeRows.length * 10) / 10
    : 0;
  const activeCount = machines.filter((m) => String(m.status) === "Üretimde").length;
  const downCount = machines.filter((m) => ["Duruş", "Planlı Bakım"].includes(String(m.status))).length;
  const critical = alarms.filter((a) => a.severity === "Kritik").length;

  const clock = now.toLocaleTimeString("tr-TR");
  const date = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const statusColor = (s: string) =>
    s === "Üretimde" ? "#22c55e" : s === "Boşta" ? "#eab308" : "#ef4444";

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory size={22} style={{ color: "var(--accent)" }} />
            ANDON — Canlı Fabrika Ekranı
          </h1>
          <p className="text-muted text-sm">{date}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {shift && (
            <span className="card px-4 py-2 text-sm font-semibold">
              {shift.name} <span className="text-muted font-normal">· {shift.range}</span>
            </span>
          )}
          <span className="card px-4 py-2 text-lg font-bold font-mono flex items-center gap-2">
            <Clock size={16} style={{ color: "var(--accent)" }} /> {clock}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full"
            style={{
              backgroundColor: running ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "var(--surface-2)",
              color: running ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: running ? "var(--accent)" : "var(--text-muted)" }} />
            {running ? "Simülasyon Canlı" : "Simülasyon Durduruldu"}
          </span>
        </div>
      </div>

      {/* KPI şeridi */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Fabrika OEE", value: `%${oeeAvg}`, icon: Gauge, color: oeeAvg >= 75 ? "#22c55e" : oeeAvg >= 60 ? "#eab308" : "#ef4444" },
          { label: "Üretimdeki makine", value: `${activeCount}/${machines.length}`, icon: Play, color: "#22c55e" },
          { label: "Duruşta", value: String(downCount), icon: Pause, color: downCount ? "#ef4444" : "#22c55e" },
          { label: "Vardiyada üretilen", value: stats.produced.toLocaleString("tr-TR"), icon: Activity, color: "var(--accent)" },
          { label: "Açık alarm", value: String(alarms.length), icon: Bell, color: critical ? "#ef4444" : alarms.length ? "#eab308" : "#22c55e" },
        ].map((k) => (
          <div key={k.label} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted">{k.label}</span>
              <k.icon size={16} style={{ color: k.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Makine kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {machines.map((m) => {
          const code = String(m.code);
          const st = String(m.status);
          const color = statusColor(st);
          const oee = oeeRows.find((r) => String(r.machine) === code);
          const job = track.find((r) => String(r.machine) === code && String(r.status) === "Üretimde");
          const target = job ? Number(job.target) || 0 : 0;
          const produced = job ? Number(job.produced) || 0 : 0;
          const pct = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;
          const dark = st === "Duruş" || st === "Planlı Bakım";
          return (
            <div
              key={code}
              className="rounded-2xl p-4 shadow-card flex flex-col gap-2 min-h-[9.5rem]"
              style={{ backgroundColor: color, color: dark ? "#fff" : "#0b0e14" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold font-mono">{code}</span>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,.22)", color: dark ? "#fff" : "#0b0e14" }}>
                  {st}
                </span>
              </div>
              <div className="text-xs font-medium opacity-90 truncate">{String(m.name)}</div>
              {job ? (
                <>
                  <div className="text-xs font-mono font-semibold mt-1">{String(job.workOrder)}</div>
                  <div className="text-xs opacity-90 truncate">{String(job.product)}</div>
                  <div className="mt-auto">
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span>{produced.toLocaleString("tr-TR")} / {target.toLocaleString("tr-TR")}</span>
                      <span>%{pct}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,.25)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: pct + "%", backgroundColor: dark ? "#fff" : "#0b0e14" }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs font-medium mt-1 opacity-80">
                  {st === "Boşta" ? "İş bekliyor" : st === "Planlı Bakım" ? "Planlı bakım" : "Arıza / müdahale bekliyor"}
                </div>
              )}
              {oee && (
                <div className="text-[11px] font-bold mt-1">OEE %{Number(oee.oee) || 0}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grafikler — ProManage kokpit tarzı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Gauge size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">Makine OEE</h2>
            <span className="ml-auto text-xs text-muted">%75 hedefi</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={oeeRows.map((r) => ({ machine: String(r.machine), oee: Number(r.oee) || 0 }))} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="machine" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 12 }} formatter={(v: any) => [`%${v}`, "OEE"]} />
                <Bar dataKey="oee" name="OEE %" radius={[6, 6, 0, 0]}>
                  {oeeRows.map((r, i) => {
                    const v = Number(r.oee) || 0;
                    return <Cell key={i} fill={v >= 75 ? "#22c55e" : v >= 60 ? "#eab308" : "#ef4444"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} style={{ color: "#ef4444" }} />
            <h2 className="font-semibold">Duruş Pareto (dk)</h2>
            <span className="ml-auto text-xs text-muted">en büyük nedenler</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimeByReason} layout="vertical" margin={{ top: 8, right: 8, left: 60, bottom: 4 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} width={140} />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 12 }} formatter={(v: any) => [`${v} dk`, "Süre"]} />
                <Bar dataKey="value" name="Dakika" radius={[0, 6, 6, 0]}>
                  {downtimeByReason.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#ef4444" : "#eab308"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alarmlar */}
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} style={{ color: critical ? "#ef4444" : "var(--warning)" }} />
            <h2 className="font-semibold">Aktif Alarmlar</h2>
            <span className="ml-auto text-xs text-muted">{alarms.length} açık · onaylanmamış</span>
          </div>
          {alarms.length === 0 && (
            <div className="text-sm" style={{ color: "var(--success)" }}>✓ Aktif alarm yok — fabrika normal.</div>
          )}
          <div className="space-y-1.5 max-h-64 overflow-auto">
            {alarms.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm border-b pb-1.5" style={{ borderColor: "var(--border)" }}>
                <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: sevColor[a.severity] }} />
                <div className="flex-1">
                  <div className="font-medium">{a.text}</div>
                  <div className="text-xs text-muted">{a.ruleName} · değer: {a.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Olay akışı */}
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Activity size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">Son Olaylar</h2>
            <span className="ml-auto text-xs text-muted">son {events.length} olay</span>
          </div>
          {events.length === 0 && <div className="text-sm text-muted">Henüz olay yok.</div>}
          <div className="space-y-1.5 max-h-64 overflow-auto">
            {events.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-sm border-b pb-1.5" style={{ borderColor: "var(--border)" }}>
                <span className="font-mono text-xs text-muted pt-0.5">{e.time}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ backgroundColor: "var(--surface-2)", color: "var(--accent)" }}>
                  {e.kind}
                </span>
                <span className="flex-1">{e.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted">
        Andon ekranı ProManage tarzı gerçek zamanlı izlemedir: makine durumları (Yeşil = üretimde,
        Sarı = boşta, Kırmızı = duruş), OEE, aktif vardiya, alarmlar ve olaylar 2 sn'de bir tazelenir.
        Büyük ekran/TV için açıp tam ekran (F11) yapabilirsiniz.
      </p>
    </div>
  );
}
