import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MODULES } from "../data/modules";
import { store } from "../data/store";
import { Search, X } from "lucide-react";

interface SearchItem {
  label: string;
  sub: string;
  path: string;
}

function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  // modules
  Object.entries(MODULES).forEach(([key, cfg]) => {
    cfg.rows.forEach((r) => {
      const vals = cfg.columns.map((c) => String(r[c.key] ?? "")).join(" ");
      items.push({ label: vals.split(" ")[0] || cfg.title, sub: cfg.title + " — " + vals, path: "/modul/" + key });
    });
  });
  // work orders
  store.getWorkOrders().forEach((w) => {
    items.push({ label: w.code, sub: "İş Emri — " + w.productName + " (" + w.status + ")", path: "/emirler" });
  });
  // work centers
  store.getWorkCenters().forEach((wc) => {
    items.push({ label: wc.code, sub: "İş Merkezi — " + wc.name + " (" + wc.status + ")", path: "/is-merkezleri" });
  });
  // map module key routes
  const routeMap: Record<string, string> = {
    "uretim-girisi": "/uretim/uretim-girisi",
    "uretim-takibi": "/uretim/uretim-takibi",
    "makine-listesi": "/makine/liste",
    "arizalar": "/makine/arizalar",
    "bakim": "/makine/bakim",
    "oee": "/makine/oee",
    "kalite-kontrol": "/kalite/kontrol",
    "hata-kayitlari": "/kalite/hata",
    "spc": "/kalite/spc",
    "hammadde": "/stok/hammadde",
    "yari-mamul": "/stok/yari-mamul",
    "mamul": "/stok/mamul",
    "lot-takibi": "/izlenebilirlik/lot",
    "seri-no": "/izlenebilirlik/seri-no",
    "rapor-uretim": "/raporlar/uretim",
    "rapor-verimlilik": "/raporlar/verimlilik",
    "rapor-ariza": "/raporlar/ariza",
    "rapor-kalite": "/raporlar/kalite",
    "kullanicilar": "/yonetim/kullanicilar",
    "yetkiler": "/yonetim/yetkiler",
    "siparisler": "/siparisler",
    "urunler": "/urunler",
  };
  return items.map((it) => {
    // fix path for module keys
    const m = it.path.match(/^\/modul\/(.+)$/);
    if (m && routeMap[m[1]]) it.path = routeMap[m[1]];
    return it;
  });
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const index = useMemo(() => buildIndex(), []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return index.filter((it) => it.sub.toLowerCase().includes(query)).slice(0, 20);
  }, [q, index]);

  return (
    <div className="relative">
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-ghost !px-2 !py-1.5" aria-label="Ara">
          <Search size={18} />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              className="input !pl-8 !py-1.5 w-48 md:w-64"
              placeholder="Ara... (CNC-1)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button onClick={() => { setOpen(false); setQ(""); }} className="btn-ghost !px-2 !py-1.5">
            <X size={16} />
          </button>
        </div>
      )}
      {open && q.trim() && (
        <div className="absolute top-full mt-2 left-0 w-72 max-h-80 overflow-auto card p-2 z-50">
          {results.length === 0 && <div className="text-muted text-sm p-2">Sonuç yok</div>}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { navigate(r.path); setOpen(false); setQ(""); }}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] text-sm"
            >
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-muted truncate">{r.sub}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}