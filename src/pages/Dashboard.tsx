import { useQuery } from "@tanstack/react-query";
import { store } from "../data/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CheckCircle2, Package, Clock, AlertTriangle, Settings, GripVertical, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "../components/Logo";

function minutesBetween(a: string, b: string | null) {
  const end = b ? new Date(b).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(a).getTime()) / 60000));
}

type WidgetSize = "sm" | "md" | "lg";
interface WidgetInstance { id: string; size: WidgetSize }

const CATALOG = [
  { id: "kpi-produced", title: "Toplam Üretilen Adet", size: "sm" as WidgetSize },
  { id: "kpi-completed", title: "Tamamlanan Emir", size: "sm" as WidgetSize },
  { id: "kpi-downtime", title: "Toplam Duruş (dk)", size: "sm" as WidgetSize },
  { id: "kpi-scrap", title: "Fire Oranı", size: "sm" as WidgetSize },
  { id: "kpi-orders", title: "Açık Sipariş Sayısı", size: "sm" as WidgetSize },
  { id: "chart-produced", title: "İş Merkezine Göre Üretilen Adet", size: "md" as WidgetSize },
  { id: "chart-status", title: "Emir Durum Dağılımı", size: "md" as WidgetSize },
  { id: "recent-activity", title: "Son Aktiviteler", size: "md" as WidgetSize },
  { id: "wo-summary", title: "İş Emri Özeti", size: "lg" as WidgetSize },
  { id: "machine-status", title: "Makine Durumu", size: "md" as WidgetSize },
  { id: "downtime-summary", title: "Duruş Özeti", size: "md" as WidgetSize },
  { id: "scrap-summary", title: "Fire Özeti", size: "md" as WidgetSize },
];

const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: "kpi-produced", size: "sm" },
  { id: "kpi-completed", size: "sm" },
  { id: "kpi-downtime", size: "sm" },
  { id: "kpi-scrap", size: "sm" },
  { id: "chart-produced", size: "md" },
  { id: "recent-activity", size: "md" },
];

export default function Dashboard() {
  const { data: workOrders = [] } = useQuery({ queryKey: ["workOrders"], queryFn: () => store.getWorkOrders() });
  const { data: workCenters = [] } = useQuery({ queryKey: ["workCenters"], queryFn: () => store.getWorkCenters() });
  const { data: downtimes = [] } = useQuery({ queryKey: ["downtimes"], queryFn: () => store.getDowntimes() });
  const { data: scraps = [] } = useQuery({ queryKey: ["scraps"], queryFn: () => store.getScraps() });

  const [editMode, setEditMode] = useState(false);
  const [layout, setLayout] = useState<WidgetInstance[]>(() => {
    try {
      const raw = localStorage.getItem("mesg-dashboard-layout");
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return DEFAULT_LAYOUT;
  });

  useEffect(() => {
    localStorage.setItem("mesg-dashboard-layout", JSON.stringify(layout));
  }, [layout]);

  const totalProduced = workOrders.reduce((s, w) => s + w.producedQty, 0);
  const completed = workOrders.filter((w) => w.status === "Tamamlandı").length;
  const totalDowntimeMin = downtimes.reduce((s, d) => s + minutesBetween(d.startedAt, d.endedAt), 0);
  const totalScrap = scraps.reduce((s, r) => s + r.qty, 0);
  const scrapRate = totalProduced + totalScrap > 0 ? (totalScrap / (totalProduced + totalScrap)) * 100 : 0;

  const chartData = workCenters.map((wc) => ({
    name: wc.code,
    adet: workOrders.filter((w) => w.workCenterId === wc.id).reduce((s, w) => s + w.producedQty, 0),
  }));

  const recent = [...downtimes.slice(0, 3), ...scraps.slice(0, 3)]
    .sort((a, b) => ("startedAt" in a ? a.startedAt : a.createdAt).localeCompare("startedAt" in b ? b.startedAt : b.createdAt))
    .reverse()
    .slice(0, 5);

  const openOrders = workOrders.filter((w) => w.status === "Planlandı" || w.status === "Üretimde").length;
  const kpiValue: Record<string, string> = {
    "kpi-produced": totalProduced.toLocaleString("tr-TR"),
    "kpi-completed": completed.toString(),
    "kpi-downtime": totalDowntimeMin.toString(),
    "kpi-scrap": scrapRate.toFixed(1) + "%",
    "kpi-orders": openOrders.toString(),
  };
  const kpiColor: Record<string, string> = {
    "kpi-produced": "var(--accent)",
    "kpi-completed": "var(--success)",
    "kpi-downtime": "var(--warning)",
    "kpi-scrap": "var(--danger)",
    "kpi-orders": "var(--accent)",
  };
  const kpiIcon: Record<string, any> = {
    "kpi-produced": Package,
    "kpi-completed": CheckCircle2,
    "kpi-downtime": Clock,
    "kpi-scrap": AlertTriangle,
    "kpi-orders": Package,
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= layout.length) return;
    const next = [...layout];
    [next[i], next[j]] = [next[j], next[i]];
    setLayout(next);
  };
  const removeWidget = (i: number) => setLayout((l) => l.filter((_, idx) => idx !== i));
  const setSize = (i: number, size: WidgetSize) => setLayout((l) => l.map((w, idx) => (idx === i ? { ...w, size } : w)));
  const addWidget = (id: string) => {
    if (layout.find((w) => w.id === id)) return;
    const cat = CATALOG.find((c) => c.id === id)!;
    setLayout((l) => [...l, { id, size: cat.size }]);
  };

  const sizeClass: Record<WidgetSize, string> = {
    sm: "col-span-1",
    md: "col-span-1 md:col-span-2",
    lg: "col-span-1 md:col-span-3",
  };

  const renderWidget = (w: WidgetInstance) => {
    const cat = CATALOG.find((c) => c.id === w.id);
    if (!cat) return null;
    switch (w.id) {
      case "kpi-produced":
      case "kpi-completed":
      case "kpi-downtime":
      case "kpi-scrap": {
        const Icon = kpiIcon[w.id];
        return (
          <div className="card p-4 h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">{cat.title}</span>
              <Icon size={18} style={{ color: kpiColor[w.id] }} />
            </div>
            <div className="kpi-value" style={{ color: kpiColor[w.id] }}>{kpiValue[w.id]}</div>
          </div>
        );
      }
      case "chart-produced":
        return (
          <div className="card p-4 h-full">
            <h2 className="text-base font-semibold mb-3">{cat.title}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--accent-soft)" }}
                    contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
                    itemStyle={{ color: "var(--text)" }}
                    labelStyle={{ color: "var(--accent)", fontWeight: 600 }}
                  />
                  <Bar dataKey="adet" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case "recent-activity":
        return (
          <div className="card p-4 h-full">
            <h2 className="text-base font-semibold mb-3">{cat.title}</h2>
            <ul className="space-y-2">
              {recent.length === 0 && <li className="text-muted text-sm">Henüz aktivite yok.</li>}
              {recent.map((r) => {
                const isDt = "startedAt" in r;
                return (
                  <li key={(r as any).id} className="flex items-center justify-between text-sm border-b pb-2" style={{ borderColor: "var(--border)" }}>
                    <span>{isDt ? `Duruş — ${(r as any).reason}` : `Fire — ${(r as any).qty} adet (${(r as any).reason})`}</span>
                    <span className="text-muted text-xs">{new Date(isDt ? (r as any).startedAt : (r as any).createdAt).toLocaleString("tr-TR")}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      case "wo-summary":
        return (
          <div className="card p-4 h-full">
            <h2 className="text-base font-semibold mb-3">{cat.title}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "var(--surface-2)" }}>
                  <tr><th className="text-left p-2">Emir</th><th className="text-left p-2">Ürün</th><th className="text-left p-2">Durum</th><th className="text-left p-2">İlerleme</th></tr>
                </thead>
                <tbody>
                  {workOrders.slice(0, 8).map((w) => {
                    const pct = w.targetQty > 0 ? Math.round((w.producedQty / w.targetQty) * 100) : 0;
                    return (
                      <tr key={w.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="p-2 font-mono text-xs">{w.code}</td>
                        <td className="p-2">{w.productName}</td>
                        <td className="p-2 text-xs">{w.status}</td>
                        <td className="p-2">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "chart-status": {
        const statusCounts = ["Planlandı", "Üretimde", "Tamamlandı", "İptal"].map((s) => ({
          name: s,
          adet: workOrders.filter((w) => w.status === s).length,
        }));
        return (
          <div className="card p-4 h-full">
            <h2 className="text-base font-semibold mb-3">{cat.title}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--accent-soft)" }}
                    contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
                    itemStyle={{ color: "var(--text)" }}
                    labelStyle={{ color: "var(--accent)", fontWeight: 600 }}
                  />
                  <Bar dataKey="adet" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
      case "downtime-summary":
        return (
          <div className="card p-4 h-full">
            <h2 className="text-base font-semibold mb-3">{cat.title}</h2>
            <ul className="space-y-2">
              {downtimes.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span>{d.reason}</span>
                  <span className="text-muted text-xs">{Math.round((d.endedAt ? new Date(d.endedAt).getTime() - new Date(d.startedAt).getTime() : Date.now() - new Date(d.startedAt).getTime()) / 60000)} dk</span>
                </li>
              ))}
              {downtimes.length === 0 && <li className="text-muted text-sm">Kayıt yok</li>}
            </ul>
          </div>
        );
      case "scrap-summary":
        return (
          <div className="card p-4 h-full">
            <h2 className="text-base font-semibold mb-3">{cat.title}</h2>
            <ul className="space-y-2">
              {scraps.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span>{s.reason}</span>
                  <span className="text-muted text-xs">{s.qty} adet</span>
                </li>
              ))}
              {scraps.length === 0 && <li className="text-muted text-sm">Kayıt yok</li>}
            </ul>
          </div>
        );
      case "machine-status":
        return (
          <div className="card p-4 h-full">
            <h2 className="text-base font-semibold mb-3">{cat.title}</h2>
            <ul className="space-y-2">
              {workCenters.map((wc) => (
                <li key={wc.id} className="flex items-center justify-between text-sm border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span className="font-medium">{wc.code} — {wc.name}</span>
                  <span className="text-xs font-semibold" style={{ color: wc.status === "Üretimde" ? "var(--accent)" : wc.status === "Duruşta" ? "var(--warning)" : "var(--text-muted)" }}>{wc.status}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Logo size={128} />
          <div>
            <h1 className="text-2xl font-bold">Pano</h1>
            <p className="text-muted text-sm">Özelleştirilebilir dashboard (sentetik demo verisi)</p>
          </div>
        </div>
        <button onClick={() => setEditMode((v) => !v)} className="btn-ghost">
          <Settings size={16} /> {editMode ? "Düzenlemeyi Bitir" : "Panoyu Düzenle"}
        </button>
      </div>

      {editMode && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold">Widget Ekle</h2>
          <div className="flex flex-wrap gap-2">
            {CATALOG.filter((c) => !layout.find((w) => w.id === c.id)).map((c) => (
              <button key={c.id} onClick={() => addWidget(c.id)} className="btn-ghost !px-3 !py-1.5 text-xs">
                <Plus size={12} /> {c.title}
              </button>
            ))}
            {CATALOG.every((c) => layout.find((w) => w.id === c.id)) && <span className="text-muted text-sm">Tüm widget'lar eklendi.</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {layout.map((w, i) => (
          <div key={w.id + i} className={sizeClass[w.size] + " relative"}>
            {editMode && (
              <div className="absolute top-2 right-2 z-10 flex gap-1 bg-[var(--surface)] rounded-lg p-1 shadow-card">
                <button onClick={() => move(i, -1)} className="btn-ghost !px-1.5 !py-1 text-xs" title="Yukarı"><GripVertical size={12} /></button>
                <button onClick={() => move(i, 1)} className="btn-ghost !px-1.5 !py-1 text-xs" title="Aşağı"><GripVertical size={12} /></button>
                <select value={w.size} onChange={(e) => setSize(i, e.target.value as WidgetSize)} className="input !w-16 !px-1 !py-0.5 text-xs">
                  <option value="sm">Küçük</option>
                  <option value="md">Orta</option>
                  <option value="lg">Büyük</option>
                </select>
                <button onClick={() => removeWidget(i)} className="btn-danger !px-1.5 !py-1 text-xs"><Trash2 size={12} /></button>
              </div>
            )}
            {renderWidget(w)}
          </div>
        ))}
      </div>
    </div>
  );
}