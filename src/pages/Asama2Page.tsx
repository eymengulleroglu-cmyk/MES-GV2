import { useState } from "react";
import { MODULES } from "../data/modules";

export default function Asama2Page() {
  const keys = Object.keys(MODULES);
  const [selected, setSelected] = useState(keys[0]);
  const [rows, setRows] = useState(MODULES[keys[0]].rows);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const changeModule = (k: string) => {
    setSelected(k);
    setRows(MODULES[k].rows);
    setEditing(null);
    setForm({});
  };

  const startEdit = (i: number) => {
    setEditing(i);
    const r = rows[i];
    const f: Record<string, string> = {};
    Object.keys(r).forEach((k) => (f[k] = String(r[k])));
    setForm(f);
  };

  const saveEdit = () => {
    if (editing === null) return;
    const updated = [...rows];
    updated[editing] = { ...form };
    setRows(updated);
    setEditing(null);
    setForm({});
  };

  const cfg = MODULES[selected];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">2. Aşama — Veri Düzenleme</h1>
      <p className="text-muted text-sm">Modül seçin, düzenlemek istediğiniz kaydı seçin.</p>

      <div className="card p-4">
        <select className="input" value={selected} onChange={(e) => changeModule(e.target.value)}>
          {keys.map((k) => <option key={k} value={k}>{MODULES[k].title}</option>)}
        </select>
      </div>

      {editing !== null && (
        <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="card p-4 space-y-3">
          <h2 className="font-semibold">Düzenle</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {cfg.columns.map((c) => (
              <input key={c.key} className="input" placeholder={c.label} value={form[c.key] ?? ""} onChange={(e) => setForm({ ...form, [c.key]: e.target.value })} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Kaydet</button>
            <button type="button" onClick={() => { setEditing(null); setForm({}); }} className="btn-ghost">İptal</button>
          </div>
        </form>
      )}

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
                    <button onClick={() => startEdit(i)} className="btn-ghost !px-2 !py-1 text-xs">Düzenle</button>
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