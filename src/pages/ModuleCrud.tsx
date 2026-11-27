import { useState, useEffect } from "react";
import { MODULES } from "../data/modules";
import { Plus, Trash2, Pencil, ArrowUpDown } from "lucide-react";

type SortDir = "asc" | "desc";

/** Sayıları Türkçe biçimde göster (2.000 / 78,5) */
function fmt(v: any): string {
  if (typeof v === "number") return v.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  return String(v ?? "");
}

function statusColor(val: any): string {
  const v = String(val).toLowerCase();
  if (v.includes("tamam") || v.includes("uygun") || v.includes("aktif") || v.includes("açık") || v.includes("kontrolde") || v.includes("onaylandı") || v.includes("kontrol alt") || v.includes("evet")) return "var(--success)";
  if (v.includes("üretimde") || v.includes("normal") || v.includes("orta")) return "var(--accent)";
  if (v.includes("duruş") || v.includes("uyarı") || v.includes("planlı") || v.includes("planlandı") || v.includes("bekliyor") || v.includes("kalite kontrol")) return "var(--warning)";
  if (v.includes("iptal") || v.includes("hata") || v.includes("yüksek") || v.includes("değil") || v.includes("hayır")) return "var(--danger)";
  return "var(--text-muted)";
}

function isStatusKey(key: string) {
  const k = key.toLowerCase();
  return k.includes("status") || k.includes("durum") || k.includes("result") || k.includes("sonuç") || k.includes("severity") || k.includes("şiddet") || k.includes("priority") || k.includes("öncelik") || k.includes("read") || k.includes("write") || k.includes("okuma") || k.includes("yazma");
}

function isHigherBetter(key: string) {
  const k = key.toLowerCase();
  return k.includes("oee") || k.includes("verim") || k.includes("efficiency") || k.includes("kalite") || k.includes("quality") || k.includes("availability") || k.includes("performance") || k.includes("%");
}

function isLowerBetter(key: string) {
  const k = key.toLowerCase();
  return k.includes("downtime") || k.includes("duruş") || k.includes("scrap") || k.includes("fire") || k.includes("defect") || k.includes("hata") || k.includes("ppm") || k.includes("mttr") || k.includes("count") || k.includes("sayı");
}

function numericColor(key: string, val: any): string {
  const n = Number(val);
  if (isNaN(n)) return "var(--text)";
  if (isHigherBetter(key)) {
    if (n >= 90) return "#22c55e";
    if (n >= 75) return "#84cc16";
    if (n >= 60) return "#eab308";
    if (n >= 40) return "#f97316";
    return "#ef4444";
  }
  if (isLowerBetter(key)) {
    if (n <= 10) return "#22c55e";
    if (n <= 30) return "#84cc16";
    if (n <= 60) return "#eab308";
    if (n <= 90) return "#f97316";
    return "#ef4444";
  }
  return "var(--text)";
}

export default function ModuleCrud({ moduleKey }: { moduleKey: string }) {
  const cfg = MODULES[moduleKey];
  const storageKey = "mesg-mod-v8-" + moduleKey;

  const [rows, setRows] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return cfg?.rows ?? [];
  });

  const persist = (r: any[]) => {
    try { localStorage.setItem(storageKey, JSON.stringify(r)); } catch { /* ignore */ }
  };
  const [sortKey, setSortKey] = useState(cfg?.columns[0].key ?? "");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<"table" | "cards">("table");
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setRows(JSON.parse(raw));
      else setRows(cfg?.rows ?? []);
    } catch { setRows(cfg?.rows ?? []); }
    setEditing(null);
    setForm({});
    setOpenCreate(false);
  }, [moduleKey, storageKey, cfg]);

  if (!cfg) return <div className="text-muted">Modül bulunamadı.</div>;

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const sorted = rows.slice().sort((a, b) => {
    const va = (a as any)[sortKey];
    const vb = (b as any)[sortKey];
    const cmp = typeof va === "number" ? va - (vb as number) : String(va).localeCompare(String(vb), "tr");
    return sortDir === "asc" ? cmp : -cmp;
  });

  const addRow = (e: React.FormEvent) => {
    e.preventDefault();
    setRows((prev) => {
      const next = [form, ...prev];
      persist(next);
      return next;
    });
    setForm({});
    setOpenCreate(false);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing === null) return;
    setRows((prev) => {
      const updated = [...prev];
      updated[editing] = { ...form };
      persist(updated);
      return updated;
    });
    setEditing(null);
    setForm({});
  };

  const startEdit = (r: any) => {
    const idx = rows.indexOf(r);
    if (idx < 0) return;
    setEditing(idx);
    const f: Record<string, string> = {};
    Object.keys(r).forEach((k) => (f[k] = String(r[k])));
    setForm(f);
    setOpenCreate(false);
  };

  const remove = (r: any) => {
    const idx = rows.indexOf(r);
    if (idx < 0) return;
    if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      setRows((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        persist(next);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{cfg.title}</h1>
          <p className="text-muted text-sm">{cfg.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("table")} className="btn-ghost !px-3 !py-1.5 text-xs" style={view === "table" ? { backgroundColor: "var(--accent)", color: "#0b0e14" } : {}}>Tablo</button>
          <button onClick={() => setView("cards")} className="btn-ghost !px-3 !py-1.5 text-xs" style={view === "cards" ? { backgroundColor: "var(--accent)", color: "#0b0e14" } : {}}>Kart</button>
          <button onClick={() => { setOpenCreate(true); setEditing(null); setForm({}); }} className="btn-primary">
            <Plus size={16} /> Yeni Kayıt
          </button>
        </div>
      </div>

      {openCreate && (
        <form onSubmit={addRow} className="card p-4 space-y-3">
          <h2 className="font-semibold">Yeni Kayıt</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {cfg.columns.map((c) => (
              <input key={c.key} className="input" placeholder={c.label} value={form[c.key] ?? ""} onChange={(e) => setForm({ ...form, [c.key]: e.target.value })} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Kaydet</button>
            <button type="button" onClick={() => setOpenCreate(false)} className="btn-ghost">İptal</button>
          </div>
        </form>
      )}

      {editing !== null && (
        <form onSubmit={saveEdit} className="card p-4 space-y-3">
          <h2 className="font-semibold">Düzenle</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {cfg.columns.map((c) => (
              <input key={c.key} className="input" placeholder={c.label} value={form[c.key] ?? ""} onChange={(e) => setForm({ ...form, [c.key]: e.target.value })} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Güncelle</button>
            <button type="button" onClick={() => { setEditing(null); setForm({}); }} className="btn-ghost">İptal</button>
          </div>
        </form>
      )}

      {view === "table" ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "var(--surface-2)" }}>
                <tr>
                  {cfg.columns.map((c) => (
                    <th key={c.key} className="text-left p-3 cursor-pointer select-none" onClick={() => toggleSort(c.key)}>
                      <span className="inline-flex items-center gap-1">{c.label} <ArrowUpDown size={12} /></span>
                    </th>
                  ))}
                  <th className="text-left p-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-[var(--surface-2)] transition" style={{ borderColor: "var(--border)" }}>
                    {cfg.columns.map((c) => (
                      <td key={c.key} className="p-3">
                        {isStatusKey(c.key) ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "var(--surface-2)", color: statusColor(r[c.key]) }}>{fmt(r[c.key])}</span>
                        ) : (isHigherBetter(c.key) || isLowerBetter(c.key)) ? (
                          <span className="font-semibold" style={{ color: numericColor(c.key, r[c.key]) }}>{fmt(r[c.key])}</span>
                        ) : (
                          fmt(r[c.key])
                        )}
                      </td>
                    ))}
                    <td className="p-3 flex gap-1">
                      <button onClick={() => setDetail(r)} className="btn-ghost !px-2 !py-1 text-xs">Detay</button>
                      <button onClick={() => startEdit(r)} className="btn-ghost !px-2 !py-1 text-xs"><Pencil size={12} /></button>
                      <button onClick={() => remove(r)} className="btn-danger !px-2 !py-1 text-xs"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr><td colSpan={cfg.columns.length + 1} className="p-3 text-muted">Kayıt yok</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((r, i) => (
            <div key={i} className="card p-4 hover:shadow-glow transition transform hover:-translate-y-1 cursor-pointer" onClick={() => setDetail(r)}>
              {cfg.columns.map((c) => (
                <div key={c.key} className="flex justify-between border-b py-1 text-sm" style={{ borderColor: "var(--border)" }}>
                  <span className="text-muted">{c.label}</span>
                  {isStatusKey(c.key) ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--surface-2)", color: statusColor(r[c.key]) }}>{fmt(r[c.key])}</span>
                  ) : (
                    <span className="font-medium">{fmt(r[c.key])}</span>
                  )}
                </div>
              ))}
              <div className="flex gap-1 mt-3">
                <button onClick={(e) => { e.stopPropagation(); startEdit(r); }} className="btn-ghost !px-2 !py-1 text-xs"><Pencil size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); remove(r); }} className="btn-danger !px-2 !py-1 text-xs"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {sorted.length === 0 && <div className="text-muted">Kayıt yok</div>}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setDetail(null)}>
          <div className="card p-5 w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{cfg.title} — Detay</h2>
            <div className="space-y-2">
              {cfg.columns.map((c) => (
                <div key={c.key} className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  <span className="text-muted text-sm">{c.label}</span>
                  <span className="text-sm font-medium" style={{ color: isStatusKey(c.key) ? statusColor(detail[c.key]) : (isHigherBetter(c.key) || isLowerBetter(c.key)) ? numericColor(c.key, detail[c.key]) : "var(--text)" }}>{fmt(detail[c.key])}</span>
                </div>
              ))}
            </div>
            {detail.produced !== undefined && detail.target !== undefined && Number(detail.target) > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">İlerleme</span>
                  <span className="font-medium">{Math.round((Number(detail.produced) / Number(detail.target)) * 100)}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: (Number(detail.produced) / Number(detail.target)) * 100 + "%", backgroundColor: "var(--accent)" }} />
                </div>
              </div>
            )}
            {detail.oee !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">OEE</span>
                  <span className="font-medium">{fmt(detail.oee)}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: detail.oee + "%", backgroundColor: "var(--accent)" }} />
                </div>
              </div>
            )}
            {detail.efficiency !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Verim</span>
                  <span className="font-medium">{fmt(detail.efficiency)}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: detail.efficiency + "%", backgroundColor: "var(--accent)" }} />
                </div>
              </div>
            )}
            <button onClick={() => setDetail(null)} className="btn-ghost">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}