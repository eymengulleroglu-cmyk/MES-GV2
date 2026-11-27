import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { store } from "../data/store";
import { Factory, Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";

const statusColor: Record<string, string> = {
  Boşta: "var(--text-muted)",
  Üretimde: "var(--accent)",
  Duruşta: "var(--warning)",
};

export default function WorkCenters() {
  const queryClient = useQueryClient();
  const { data: workCenters = [] } = useQuery({ queryKey: ["workCenters"], queryFn: () => store.getWorkCenters() });
  const { data: workOrders = [] } = useQuery({ queryKey: ["workOrders"], queryFn: () => store.getWorkOrders() });

  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ code: "", name: "", status: "Boşta" });

  const woMap = new Map(workOrders.map((w) => [w.id, w]));

  const createMut = useMutation({
    mutationFn: async (data: any) => store.createWorkCenter(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["workCenters"] }); setOpenCreate(false); setForm({ code: "", name: "", status: "Boşta" }); },
  });
  const updateMut = useMutation({
    mutationFn: async (data: any) => store.updateWorkCenter(data.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["workCenters"] }); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: async (id: string) => store.deleteWorkCenter(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workCenters", "workOrders"] }),
  });

  const openEdit = (wc: any) => {
    setEditing(wc);
    setForm({ code: wc.code, name: wc.name, status: wc.status });
    setOpenCreate(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">İş Merkezleri</h1>
          <p className="text-muted text-sm">Ekleme, düzenleme ve silme</p>
        </div>
        <button onClick={() => { setOpenCreate(true); setEditing(null); setForm({ code: "", name: "", status: "Boşta" }); }} className="btn-primary">
          <Plus size={16} /> Yeni İş Merkezi
        </button>
      </div>

      {openCreate && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold">Yeni İş Merkezi</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="input" placeholder="Kod (CNC-3)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="input" placeholder="Ad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Boşta</option><option>Üretimde</option><option>Duruşta</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMut.mutate(form)} className="btn-primary" disabled={!form.code || !form.name}>Kaydet</button>
            <button onClick={() => setOpenCreate(false)} className="btn-ghost">İptal</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold">Düzenle — {editing.code}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="input" placeholder="Kod" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="input" placeholder="Ad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Boşta</option><option>Üretimde</option><option>Duruşta</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateMut.mutate({ id: editing.id, ...form })} className="btn-primary">Güncelle</button>
            <button onClick={() => setEditing(null)} className="btn-ghost">İptal</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {workCenters.map((wc) => {
          const wo = wc.activeWorkOrderId ? woMap.get(wc.activeWorkOrderId) : null;
          return (
            <div key={wc.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Factory size={18} style={{ color: "var(--accent)" }} />
                  <span className="font-bold">{wc.code}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: statusColor[wc.status] }}>{wc.status}</span>
              </div>
              <div className="text-sm text-muted mb-2">{wc.name}</div>
              {wo ? (
                <div className="text-sm mb-2">
                  <div className="font-medium">{wo.code}</div>
                  <div className="text-xs text-muted">{wo.productName}</div>
                </div>
              ) : (
                <div className="text-xs text-muted mb-2">Aktif emir yok</div>
              )}
              <div className="flex gap-1">
                <Link to={`/is-merkezleri/${wc.id}`} className="btn-ghost !px-2 !py-1 text-xs">Detay</Link>
                <button onClick={() => openEdit(wc)} className="btn-ghost !px-2 !py-1 text-xs"><Pencil size={12} /></button>
                <button onClick={() => { if (confirm("Silinsin mi?")) deleteMut.mutate(wc.id); }} className="btn-danger !px-2 !py-1 text-xs"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}