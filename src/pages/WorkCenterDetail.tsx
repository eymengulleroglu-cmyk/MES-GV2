import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { ArrowLeft, Play, Square, Plus } from "lucide-react";
import { useState } from "react";

const DOWNTIME_REASONS = ["Malzeme bekleniyor", "Araç arızası", "Planlı bakım", "Operatör bekliyor", "Diğer"] as const;
const SCRAP_REASONS = ["Ölçü dışı", "Yüzey hatası", "Malzeme hatası", "Montaj hatası", "Diğer"] as const;

export default function WorkCenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: wc } = useQuery({ queryKey: ["workCenter", id], queryFn: () => (id ? store.getWorkCenter(id) : null) });
  const { data: workOrders = [] } = useQuery({ queryKey: ["workOrders"], queryFn: () => store.getWorkOrders() });
  const { data: downtimes = [] } = useQuery({ queryKey: ["downtimes"], queryFn: () => store.getDowntimes() });
  const { data: scraps = [] } = useQuery({ queryKey: ["scraps"], queryFn: () => store.getScraps() });

  const [dtReason, setDtReason] = useState<string>(DOWNTIME_REASONS[0]);
  const [scrapQty, setScrapQty] = useState(1);
  const [scrapReason, setScrapReason] = useState<string>(SCRAP_REASONS[0]);

  const wo = wc?.activeWorkOrderId ? workOrders.find((w) => w.id === wc.activeWorkOrderId) : null;
  const activeDowntime = downtimes.find((d) => d.workCenterId === id && !d.endedAt);

  const invalidate = () => queryClient.invalidateQueries();

  const startDtMut = useMutation({
    mutationFn: async () => store.startDowntime(id!, wo?.id ?? null, dtReason as any),
    onSuccess: invalidate,
  });
  const endDtMut = useMutation({
    mutationFn: async () => { if (activeDowntime) store.endDowntime(activeDowntime.id); },
    onSuccess: invalidate,
  });
  const addScrapMut = useMutation({
    mutationFn: async () => store.addScrap(id!, wo?.id ?? null, scrapQty, scrapReason as any),
    onSuccess: invalidate,
  });
  const incMut = useMutation({
    mutationFn: async (delta: number) => { if (wo) store.setProducedQty(wo.id, wo.producedQty + delta); },
    onSuccess: invalidate,
  });

  if (!wc) return <div className="text-muted">İş merkezi bulunamadı.</div>;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="btn-ghost !px-2 !py-1.5 text-xs">
        <ArrowLeft size={14} /> Geri
      </button>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{wc.code}</h1>
            <p className="text-muted">{wc.name}</p>
          </div>
          <span className="text-sm font-semibold" style={{ color: wc.status === "Duruşta" ? "var(--warning)" : wc.status === "Üretimde" ? "var(--accent)" : "var(--text-muted)" }}>
            {wc.status}
          </span>
        </div>

        {wo ? (
          <div className="space-y-3">
            <div className="card p-3">
              <div className="text-xs text-muted">Aktif Emir</div>
              <div className="font-bold font-mono">{wo.code} — {wo.productName}</div>
              <div className="mt-2 h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: (wo.targetQty > 0 ? (wo.producedQty / wo.targetQty) * 100 : 0) + "%", backgroundColor: "var(--accent)" }} />
              </div>
              <div className="text-xs text-muted mt-1">{wo.producedQty} / {wo.targetQty} adet</div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => incMut.mutate(-1)} className="btn-ghost">-1</button>
              <button onClick={() => incMut.mutate(1)} className="btn-primary">+1 Adet</button>
              <button onClick={() => incMut.mutate(10)} className="btn-ghost">+10</button>
            </div>
          </div>
        ) : (
          <div className="text-muted text-sm">Bu iş merkezinde aktif emir yok. Emirler sayfasından atama yapın.</div>
        )}

        <div className="border-t pt-4 space-y-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold">Duruş</h2>
          {activeDowntime ? (
            <div className="space-y-2">
              <div className="text-sm">Aktif duruş: <strong>{activeDowntime.reason}</strong> — {new Date(activeDowntime.startedAt).toLocaleString("tr-TR")}</div>
              <button onClick={() => endDtMut.mutate()} className="btn-primary">
                <Square size={14} /> Duruşu Bitir
              </button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap items-center">
              <select className="input max-w-xs" value={dtReason} onChange={(e) => setDtReason(e.target.value)}>
                {DOWNTIME_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <button onClick={() => startDtMut.mutate()} className="btn-danger">
                <Play size={14} /> Duruş Başlat
              </button>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold">Fire Kaydet</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <input className="input max-w-[100px]" type="number" min={1} value={scrapQty} onChange={(e) => setScrapQty(Number(e.target.value))} />
            <select className="input max-w-xs" value={scrapReason} onChange={(e) => setScrapReason(e.target.value)}>
              {SCRAP_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button onClick={() => addScrapMut.mutate()} className="btn-ghost">
              <Plus size={14} /> Fire Ekle
            </button>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-2">Bu İş Merkezi Kayıtları</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Duruşlar</h3>
            <ul className="space-y-1 text-xs">
              {downtimes.filter((d) => d.workCenterId === id).slice(0, 5).map((d) => (
                <li key={d.id} className="border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  {d.reason} — {new Date(d.startedAt).toLocaleString("tr-TR")} {d.endedAt ? `→ ${new Date(d.endedAt).toLocaleTimeString("tr-TR")}` : "(devam)"}
                </li>
              ))}
              {downtimes.filter((d) => d.workCenterId === id).length === 0 && <li className="text-muted">Kayıt yok</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">Fireler</h3>
            <ul className="space-y-1 text-xs">
              {scraps.filter((s) => s.workCenterId === id).slice(0, 5).map((s) => (
                <li key={s.id} className="border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  {s.qty} adet — {s.reason} — {new Date(s.createdAt).toLocaleString("tr-TR")}
                </li>
              ))}
              {scraps.filter((s) => s.workCenterId === id).length === 0 && <li className="text-muted">Kayıt yok</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}