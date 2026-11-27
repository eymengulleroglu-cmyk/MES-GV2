import { useParams } from "react-router-dom";
import { MODULES } from "../data/modules";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function ModulePage({ moduleKey }: { moduleKey?: string }) {
  const params = useParams();
  const key = moduleKey ?? params.key;
  const cfg = key ? MODULES[key] : undefined;
  const [rows, setRows] = useState(cfg?.rows ?? []);

  if (!cfg) {
    return <div className="text-muted">Modül bulunamadı.</div>;
  }

  const addRow = () => {
    const newRow: Record<string, string | number> = { ...cfg.rows[0] };
    const idKey = cfg.columns[0].key;
    newRow[idKey] = idKey.toUpperCase().slice(0, 2) + "-" + (rows.length + 100);
    setRows([newRow, ...rows]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{cfg.title}</h1>
          <p className="text-muted text-sm">{cfg.description}</p>
        </div>
        <button onClick={addRow} className="btn-primary">
          <Plus size={16} /> Yeni Kayıt
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--surface-2)" }}>
              <tr>
                {cfg.columns.map((c) => (
                  <th key={c.key} className="text-left p-3">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                  {cfg.columns.map((c) => (
                    <td key={c.key} className="p-3">{String(r[c.key] ?? "")}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={cfg.columns.length} className="p-3 text-muted">Kayıt yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}