import { useState } from "react";
import { MODULES } from "../data/modules";

export default function Asama3Page() {
  const keys = Object.keys(MODULES);
  const [selected, setSelected] = useState(keys[0]);
  const [rows, setRows] = useState(MODULES[keys[0]].rows);

  const changeModule = (k: string) => {
    setSelected(k);
    setRows(MODULES[k].rows);
  };

  const remove = (i: number) => {
    if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      setRows(rows.filter((_, idx) => idx !== i));
    }
  };

  const cfg = MODULES[selected];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">3. Aşama — Veri Silme</h1>
      <p className="text-muted text-sm">Modül seçin, silmek istediğiniz kaydı seçin.</p>

      <div className="card p-4">
        <select className="input" value={selected} onChange={(e) => changeModule(e.target.value)}>
          {keys.map((k) => <option key={k} value={k}>{MODULES[k].title}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--surface-2)" }}>
              <tr>
                {cfg.columns.map((c) => <th key={c.key} className="text-left p-3">{c.label}</th>)}
                <th className="text-left p-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                  {cfg.columns.map((c) => <td key={c.key} className="p-3">{String(r[c.key] ?? "")}</td>)}
                  <td className="p-3">
                    <button onClick={() => remove(i)} className="btn-danger !px-2 !py-1 text-xs">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}