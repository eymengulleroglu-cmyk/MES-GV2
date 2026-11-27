import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { ArrowLeft, Play } from "lucide-react";
import { useState } from "react";

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: wo } = useQuery({ queryKey: ["workOrder", id], queryFn: () => (id ? store.getWorkOrder(id) : null) });
  const { data: workCenters = [] } = useQuery({ queryKey: ["workCenters"], queryFn: () => store.getWorkCenters() });
  const [qty, setQty] = useState<number | null>(null);

  const assignMut = useMutation({
    mutationFn: async (wcId: string | null) => { store.assignWorkOrder(id!, wcId); },
    onSuccess: () => { queryClient.invalidateQueries(); },
  });
  const startMut = useMutation({
    mutationFn: async () => { store.startWorkOrder(id!); },
    onSuccess: () => { queryClient.invalidateQueries(); },
  });
  const qtyMut = useMutation({
    mutationFn: async (q: number) => { store.setProducedQty(id!, q); },
    onSuccess: () => { queryClient.invalidateQueries(); },
  });

  if (!wo) return <div className="text-muted">Emir bulunamadı.</div>;

  const pct = wo.targetQty > 0 ? Math.round((wo.producedQty / wo.targetQty) * 100) : 0;
  const currentQty = qty ?? wo.producedQty;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="btn-ghost !px-2 !py-1.5 text-xs">
        <ArrowLeft size={14} /> Geri
      </button>
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold font-mono">{wo.code}</h1>
            <p className="text-muted">{wo.productName}</p>
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{wo.status}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="card p-3">
            <div className="text-xs text-muted">Hedef Adet</div>
            <div className="text-xl font-bold">{wo.targetQty}</div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-muted">Üretilen</div>
            <div className="text-xl font-bold">{wo.producedQty}</div>
          </div>
          <div className="card p-3">
            <div className="text-xs text-muted">İlerleme</div>
            <div className="text-xl font-bold">{pct}%</div>
          </div>
        </div>

        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
          <div className="h-full rounded-full" style={{ width: pct + "%", backgroundColor: "var(--accent)" }} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">İş Merkezi Ata</label>
          <select
            className="input"
            value={wo.workCenterId ?? ""}
            onChange={(e) => assignMut.mutate(e.target.value || null)}
          >
            <option value="">Atanmamış</option>
            {workCenters.map((wc) => (
              <option key={wc.id} value={wc.id}>{wc.code} — {wc.name}</option>
            ))}
          </select>
        </div>

        {wo.status !== "Tamamlandı" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Üretilen Adet Güncelle</label>
            <div className="flex gap-2">
              <input
                className="input"
                type="number"
                value={currentQty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button onClick={() => qtyMut.mutate(currentQty)} className="btn-primary">Kaydet</button>
              {wo.status === "Planlandı" && (
                <button onClick={() => startMut.mutate()} className="btn-ghost">
                  <Play size={14} /> Üretime Başla
                </button>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted">
          Öncelik: {wo.priority} · Teslim: {wo.dueDate} · Oluşturulma: {new Date(wo.createdAt).toLocaleString("tr-TR")}
        </div>
      </div>
    </div>
  );
}