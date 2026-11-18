import { useState } from "react";
import { MODULES } from "../data/modules";

export default function Asama1Page() {
  const keys = Object.keys(MODULES);
  const [selected, setSelected] = useState(keys[0]);
  const cfg = MODULES[selected];
  const [form, setForm] = useState<Record<string, string>>({});
  const [rows, setRows] = useState(cfg.rows);

  const changeModule = (k: string) => {
    setSelected(k);
    setForm({});
    setRows(MODULES[k].rows);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRow = { ...form };
    setRows([newRow, ...rows]);
    setForm({});
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">1. Aşama — Veri Girme</h1>
      <p className="text-muted text-sm">Modül seçin, alanları tek tek doldurun ve kaydedin.</p>

      <div className="card p-4 space-y-3">
        <label className="text-sm font-medium">Modül</label>
        <select className="input" value={selected} onChange={(e) => changeModule(e.target.value)}>
          {keys.map((k) => (
            <option key={k} value={k}>{MODULES[k].title}</option>
          ))}
        </select>
      </div>

      <form onSubmit={submit} className="card p-4 space-y-3">
        <h2 className="font-semibold">Yeni Kayıt</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {cfg.columns.map((c) => (
            <input
              key={c.key}
              className="input"
              placeholder={c.label}
              value={form[c.key] ?? ""}
              onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
            />
          ))}
        </div>
        <button type="submit" className="btn-primary">Kaydet</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--surface-2)" }}>
              <tr>{cfg.columns.map((c) => <th key={c.key} className="text-left p-3">{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                  {cfg.columns.map((c) => <td key={c.key} className="p-3">{String(r[c.key] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}