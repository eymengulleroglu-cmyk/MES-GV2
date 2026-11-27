import { useQuery } from "@tanstack/react-query";
import { store } from "../data/store";

function minutesBetween(a: string, b: string | null) {
  const end = b ? new Date(b).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(a).getTime()) / 60000));
}

export default function DowntimeScrap() {
  const { data: downtimes = [] } = useQuery({ queryKey: ["downtimes"], queryFn: () => store.getDowntimes() });
  const { data: scraps = [] } = useQuery({ queryKey: ["scraps"], queryFn: () => store.getScraps() });
  const { data: workCenters = [] } = useQuery({ queryKey: ["workCenters"], queryFn: () => store.getWorkCenters() });
  const { data: workOrders = [] } = useQuery({ queryKey: ["workOrders"], queryFn: () => store.getWorkOrders() });

  const wcName = (id: string) => workCenters.find((w) => w.id === id)?.code ?? id;
  const woCode = (id: string | null) => (id ? workOrders.find((w) => w.id === id)?.code ?? "—" : "—");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Duruş & Fire Kayıtları</h1>
        <p className="text-muted text-sm">Tüm duruş ve fire kayıtlarını görüntüle</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-3">Duruşlar</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "var(--surface-2)" }}>
                <tr>
                  <th className="text-left p-2">İş Merkezi</th>
                  <th className="text-left p-2">Emir</th>
                  <th className="text-left p-2">Neden</th>
                  <th className="text-left p-2">Başlangıç</th>
                  <th className="text-left p-2">Süre (dk)</th>
                </tr>
              </thead>
              <tbody>
                {downtimes.map((d) => (
                  <tr key={d.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="p-2">{wcName(d.workCenterId)}</td>
                    <td className="p-2 font-mono text-xs">{woCode(d.workOrderId)}</td>
                    <td className="p-2">{d.reason}</td>
                    <td className="p-2 text-xs">{new Date(d.startedAt).toLocaleString("tr-TR")}</td>
                    <td className="p-2">{minutesBetween(d.startedAt, d.endedAt)}{!d.endedAt ? " (devam)" : ""}</td>
                  </tr>
                ))}
                {downtimes.length === 0 && <tr><td colSpan={5} className="p-2 text-muted">Kayıt yok</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-3">Fireler</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "var(--surface-2)" }}>
                <tr>
                  <th className="text-left p-2">İş Merkezi</th>
                  <th className="text-left p-2">Emir</th>
                  <th className="text-left p-2">Adet</th>
                  <th className="text-left p-2">Neden</th>
                  <th className="text-left p-2">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {scraps.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="p-2">{wcName(s.workCenterId)}</td>
                    <td className="p-2 font-mono text-xs">{woCode(s.workOrderId)}</td>
                    <td className="p-2">{s.qty}</td>
                    <td className="p-2">{s.reason}</td>
                    <td className="p-2 text-xs">{new Date(s.createdAt).toLocaleString("tr-TR")}</td>
                  </tr>
                ))}
                {scraps.length === 0 && <tr><td colSpan={5} className="p-2 text-muted">Kayıt yok</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}