import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { store } from "../data/store";
import { Plus, Trash2, Pencil, ArrowUpDown } from "lucide-react";
import { useState } from "react";

const statusColor: Record<string, string> = {
  Planlandı: "var(--text-muted)",
  Üretimde: "var(--accent)",
  Tamamlandı: "var(--success)",
  İptal: "var(--danger)",
};

type SortKey = "code" | "productName" | "status" | "priority" | "targetQty" | "producedQty" | "dueDate";

export default function WorkOrders() {
  const queryClient = useQueryClient();
  const { data: workOrders = [] } = useQuery({ queryKey: ["workOrders"], queryFn: () => store.getWorkOrders() });
  const { data: workCenters = [] } = useQuery({ queryKey: ["workCenters"], queryFn: () => store.getWorkCenters() });

  const [filter, setFilter] = useState<string>("Tümü");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [form, setForm] = useState({ code: "", productName: "", targetQty: 100, priority: "Normal", dueDate: "", workCenterId: "", status: "Planlandı" });

  const statuses = ["Tümü", "Planlandı", "Üretimde", "Tamamlandı"];

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const filtered = (filter === "Tümü" ? workOrders : workOrders.filter((w) => w.status === filter))
    .slice()
    .sort((a, b) => {
      const va = (a as any)[sortKey];
      const vb = (b as any)[sortKey];
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb), "tr");
      return sortDir === "asc" ? cmp : -cmp;
    });

  const wcName = (id: string | null) => workCenters.find((w) => w.id === id)?.code ?? "—";

  const createMut = useMutation({
    mutationFn: async (data: any) => store.createWorkOrder({ ...data, workCenterId: data.workCenterId || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["workOrders"] }); setOpenCreate(false); setForm({ code: "", productName: "", targetQty: 100, priority: "Normal", dueDate: "", workCenterId: "", status: "Planlandı" }); },
  });

  const updateMut = useMutation({
    mutationFn: async (data: any) => store.updateWorkOrder(data.id, { ...data, workCenterId: data.workCenterId || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["workOrders"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => store.deleteWorkOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workOrders"] }),
  });

  const openEdit = (w: any) => {
    setEditing(w);
    setForm({ code: w.code, productName: w.productName, targetQty: w.targetQty, priority: w.priority, dueDate: w.dueDate, workCenterId: w.workCenterId ?? "", status: w.status });
    setOpenCreate(false);
  };

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="text-left p-3 cursor-pointer select-none" onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">{label} <ArrowUpDown size={12} /></span>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">İş Emirleri</h1>
          <p className="text-muted text-sm">Ekleme, düzenleme, silme ve sıralama</p>
        </div>
        <button onClick={() => { setOpenCreate(true); setEditing(null); setForm({ code: "", productName: "", targetQty: 100, priority: "Normal", dueDate: "", workCenterId: "", status: "Planlandı" }); }} className="btn-primary">
          <Plus size={16} /> Yeni Emir
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="btn-ghost !px-3 !py-1.5 text-xs" style={filter === s ? { backgroundColor: "var(--accent)", color: "#0b0e14" } : {}}>
            {s}
          </button>
        ))}
      </div>

      {openCreate && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold">Yeni Üretim Emri</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Emir No (WO-1009)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="input" placeholder="Ürün adı" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            <input className="input" type="number" placeholder="Hedef adet" value={form.targetQty} onChange={(e) => setForm({ ...form, targetQty: Number(e.target.value) })} />
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>Düşük</option><option>Normal</option><option>Yüksek</option><option>Acil</option>
            </select>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <select className="input" value={form.workCenterId} onChange={(e) => setForm({ ...form, workCenterId: e.target.value })}>
              <option value="">İş merkezi seç (opsiyonel)</option>
              {workCenters.map((wc) => <option key={wc.id} value={wc.id}>{wc.code} — {wc.name}</option>)}
            </select>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Planlandı</option><option>Üretimde</option><option>Tamamlandı</option><option>İptal</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMut.mutate(form)} className="btn-primary" disabled={!form.code || !form.productName || !form.dueDate}>Kaydet</button>
            <button onClick={() => setOpenCreate(false)} className="btn-ghost">İptal</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold">Düzenle — {editing.code}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Emir No" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="input" placeholder="Ürün adı" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            <input className="input" type="number" placeholder="Hedef adet" value={form.targetQty} onChange={(e) => setForm({ ...form, targetQty: Number(e.target.value) })} />
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>Düşük</option><option>Normal</option><option>Yüksek</option><option>Acil</option>
            </select>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <select className="input" value={form.workCenterId} onChange={(e) => setForm({ ...form, workCenterId: e.target.value })}>
              <option value="">İş merkezi seç (opsiyonel)</option>
              {workCenters.map((wc) => <option key={wc.id} value={wc.id}>{wc.code} — {wc.name}</option>)}
            </select>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Planlandı</option><option>Üretimde</option><option>Tamamlandı</option><option>İptal</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateMut.mutate({ id: editing.id, ...form })} className="btn-primary">Güncelle</button>
            <button onClick={() => setEditing(null)} className="btn-ghost">İptal</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--surface-2)" }}>
              <tr>
                <Th k="code" label="Emir No" />
                <Th k="productName" label="Ürün" />
                <th className="text-left p-3">İş Merkezi</th>
                <Th k="targetQty" label="Hedef" />
                <Th k="producedQty" label="Üretilen" />
                <th className="text-left p-3">İlerleme</th>
                <Th k="priority" label="Öncelik" />
                <Th k="status" label="Durum" />
                <Th k="dueDate" label="Teslim" />
                <th className="text-left p-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => {
                const pct = w.targetQty > 0 ? Math.round((w.producedQty / w.targetQty) * 100) : 0;
                return (
                  <tr key={w.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono">
                      <Link to={`/emirler/${w.id}`} className="hover:underline" style={{ color: "var(--accent)" }}>{w.code}</Link>
                    </td>
                    <td className="p-3">{w.productName}</td>
                    <td className="p-3">{wcName(w.workCenterId)}</td>
                    <td className="p-3">{w.targetQty}</td>
                    <td className="p-3">{w.producedQty}</td>
                    <td className="p-3 w-32">
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                        <div className="h-full rounded-full" style={{ width: pct + "%", backgroundColor: "var(--accent)" }} />
                      </div>
                      <span className="text-xs text-muted">{pct}%</span>
                    </td>
                    <td className="p-3">{w.priority}</td>
                    <td className="p-3"><span className="text-xs font-semibold" style={{ color: statusColor[w.status] }}>{w.status}</span></td>
                    <td className="p-3 text-xs">{w.dueDate}</td>
                    <td className="p-3 flex gap-1">
                      <button onClick={() => setDetail(w)} className="btn-ghost !px-2 !py-1 text-xs">Detay</button>
                      <button onClick={() => openEdit(w)} className="btn-ghost !px-2 !py-1 text-xs"><Pencil size={12} /></button>
                      <button onClick={() => { if (confirm("Silinsin mi?")) deleteMut.mutate(w.id); }} className="btn-danger !px-2 !py-1 text-xs"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setDetail(null)}>
          <div className="card p-5 w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">İş Emri — Detay</h2>
            <div className="space-y-2">
              {[
                ["Emir No", detail.code],
                ["Ürün", detail.productName],
                ["İş Merkezi", workCenters.find((w) => w.id === detail.workCenterId)?.code ?? "—"],
                ["Hedef", detail.targetQty],
                ["Üretilen", detail.producedQty],
                ["Öncelik", detail.priority],
                ["Durum", detail.status],
                ["Teslim", detail.dueDate],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  <span className="text-muted text-sm">{k}</span>
                  <span className="text-sm font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
            {detail.targetQty > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">İlerleme</span>
                  <span className="font-medium">{Math.round((detail.producedQty / detail.targetQty) * 100)}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: (detail.producedQty / detail.targetQty) * 100 + "%", backgroundColor: "var(--accent)" }} />
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