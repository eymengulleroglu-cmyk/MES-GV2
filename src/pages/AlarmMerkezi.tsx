import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, CheckCheck, ShieldAlert, Settings2, Clock3 } from "lucide-react";
import {
  evaluateAlarms, getUnackedAlarms, getAckedAlarms, ackAlarm, ackAll,
  type ActiveAlarm, type AlarmSeverity,
} from "../data/alarms";
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

const sevColor: Record<ActiveAlarm["severity"], string> = {
  Kritik: "#ef4444",
  "Uyarı": "#eab308",
  Bilgi: "#38bdf8",
};

const sevBg: Record<ActiveAlarm["severity"], string> = {
  Kritik: "color-mix(in srgb, #ef4444 15%, transparent)",
  "Uyarı": "color-mix(in srgb, #eab308 15%, transparent)",
  Bilgi: "color-mix(in srgb, #38bdf8 15%, transparent)",
};

export default function AlarmMerkezi() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeSim(() => setTick((t) => t + 1));
    const t = window.setInterval(() => setTick((x) => x + 1), 10_000);
    return () => { unsub(); window.clearInterval(t); };
  }, []);

  const [version, setVersion] = useState(0); // onay sonrası yenileme
  const refresh = () => setVersion((v) => v + 1);
  void version;

  const unacked = getUnackedAlarms();
  const acked = getAckedAlarms();
  const rules = readRows("mesg-mod-v8-alarm-kurallari");
  const all = evaluateAlarms();
  const critical = all.filter((a) => a.severity === "Kritik").length;

  const handleAck = (id: string) => { ackAlarm(id); refresh(); };
  const handleAckAll = () => { ackAll(); refresh(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={22} style={{ color: "var(--accent)" }} />
            Olay &amp; Alarm Merkezi
          </h1>
          <p className="text-muted text-sm">
            Alarm Kuralları modülündeki eşikler canlı verilere karşı sürekli değerlendirilir
            (ProManage "Olay Modülü" tarzı).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/yonetim/alarm-kurallari" className="btn-ghost">
            <Settings2 size={16} /> Kurallar
          </Link>
          <button className="btn-primary" onClick={handleAckAll} disabled={!unacked.length}>
            <CheckCheck size={16} /> Tümünü Onayla ({unacked.length})
          </button>
        </div>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Açık alarm", value: all.length, color: all.length ? "#ef4444" : "#22c55e" },
          { label: "Kritik", value: critical, color: critical ? "#ef4444" : "#22c55e" },
          { label: "Onaylanmamış", value: unacked.length, color: unacked.length ? "#eab308" : "#22c55e" },
          { label: "Aktif kural", value: rules.filter((r) => String(r.active) === "Evet").length, color: "var(--accent)" },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <div className="text-xs text-muted mb-1">{k.label}</div>
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Onaylanmamış alarmlar */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} style={{ color: critical ? "#ef4444" : "var(--warning)" }} />
            <h2 className="font-semibold">Müdadele Bekleyenler</h2>
            <span className="ml-auto text-xs text-muted">{unacked.length} yeni</span>
          </div>
          {unacked.length === 0 && (
            <div className="text-sm" style={{ color: "var(--success)" }}>✓ Onaylanmamış alarm yok.</div>
          )}
          <div className="space-y-2 max-h-[28rem] overflow-auto pr-1">
            {unacked.map((a) => (
              <div key={a.id} className="rounded-xl p-3 border" style={{ backgroundColor: sevBg[a.severity], borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: sevColor[a.severity], color: "#0b0e14" }}>
                        {a.severity}
                      </span>
                      <span className="text-xs font-mono text-muted">{a.ruleCode}</span>
                      <span className="text-xs font-semibold">{a.target}</span>
                    </div>
                    <div className="text-sm font-medium mt-1">{a.text}</div>
                    <div className="text-xs text-muted mt-0.5">Güncel değer: <strong style={{ color: sevColor[a.severity] }}>{a.value}</strong></div>
                  </div>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs shrink-0" onClick={() => handleAck(a.id)}>
                    <BellOff size={14} /> Onayla
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Onaylananlar */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock3 size={18} style={{ color: "var(--success)" }} />
            <h2 className="font-semibold">Onaylananlar</h2>
            <span className="ml-auto text-xs text-muted">{acked.length} kayıt</span>
          </div>
          {acked.length === 0 && <div className="text-sm text-muted">Henüz onaylanan alarm yok.</div>}
          <div className="space-y-1.5 max-h-[28rem] overflow-auto pr-1">
            {acked.map(({ alarm, at }) => (
              <div key={alarm.id} className="flex items-start gap-2 text-sm border-b pb-1.5 opacity-70" style={{ borderColor: "var(--border)" }}>
                <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: sevColor[alarm.severity] }} />
                <div className="flex-1">
                  <div>{alarm.text}</div>
                  <div className="text-xs text-muted">
                    {alarm.target} · onay: {new Date(at).toLocaleString("tr-TR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kural tablosu */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 size={18} style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold">İzlenen Kurallar</h2>
          <Link to="/yonetim/alarm-kurallari" className="ml-auto text-xs font-semibold" style={{ color: "var(--accent)" }}>
            Düzenle →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--surface-2)" }}>
              <tr>
                <th className="text-left p-2">Kod</th>
                <th className="text-left p-2">Kural</th>
                <th className="text-left p-2">Hedef</th>
                <th className="text-right p-2">Eşik</th>
                <th className="text-left p-2">Önem</th>
                <th className="text-left p-2">Aktif</th>
                <th className="text-right p-2">Şu anki durum</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => {
                const count = all.filter((a) => a.ruleCode === String(r.code)).length;
                return (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="p-2 font-mono text-xs">{r.code}</td>
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-muted">{r.target}</td>
                    <td className="p-2 text-right font-semibold">{r.threshold}</td>
                    <td className="p-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: sevBg[String(r.severity) as AlarmSeverity] ?? sevBg.Bilgi, color: sevColor[String(r.severity) as AlarmSeverity] ?? "#38bdf8" }}>
                        {String(r.severity)}
                      </span>
                    </td>
                    <td className="p-2 text-xs">{String(r.active)}</td>
                    <td className="p-2 text-right font-semibold" style={{ color: count ? "#ef4444" : "#22c55e" }}>
                      {count ? `${count} alarm` : "Normal"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
