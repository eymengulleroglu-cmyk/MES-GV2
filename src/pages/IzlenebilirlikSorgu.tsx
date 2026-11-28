import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, ArrowRight, ArrowLeft, Boxes, Factory, ShieldCheck, Package,
  Truck, Wrench, Barcode, GitBranch,
} from "lucide-react";
import { store } from "../data/store";
import { flowFor } from "../data/simulation";
import { MODULES } from "../data/modules";

function readRows(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as any[];
  } catch { /* yoksay */ }
  const modKey = key.replace("mesg-mod-v8-", "");
  return MODULES[modKey]?.rows ?? [];
}

interface TraceStep {
  icon: typeof Factory;
  title: string;
  detail: string;
  color: string;
}

export default function IzlenebilirlikSorgu() {
  const [query, setQuery] = useState("");

  const lots = readRows("mesg-mod-v8-lot-takibi");
  const serials = readRows("mesg-mod-v8-seri-no");
  const entries = readRows("mesg-mod-v8-uretim-girisi");
  const rawStock = readRows("mesg-mod-v8-hammadde");
  const spcRows = readRows("mesg-mod-v8-spc");
  const orders = readRows("mesg-mod-v8-siparisler");

  const allIds = useMemo(() => {
    const ids = new Set<string>();
    lots.forEach((l) => ids.add(String(l.lot)));
    serials.forEach((s) => ids.add(String(s.serial)));
    return [...ids];
  }, [lots, serials]);

  const q = query.trim().toUpperCase();

  const result = useMemo(() => {
    if (!q) return null;

    const lot = lots.find((l) => String(l.lot).toUpperCase() === q);
    const sn = serials.find((s) => String(s.serial).toUpperCase() === q);

    if (!lot && !sn) return { found: false as const, steps: [] as TraceStep[] };

    const product = String(lot?.product ?? sn?.product ?? "");
    const woCode = String(lot?.workOrder ?? sn?.workOrder ?? "");
    const flow = flowFor(product);

    const workOrders = store.getWorkOrders();
    const wo = workOrders.find((w) => w.code === woCode) ?? null;
    const wc = wo?.workCenterId ? store.getWorkCenter(wo.workCenterId) : null;

    const operators = entries.filter((e) => String(e.workOrder) === woCode);
    const relatedLots = lots.filter(
      (l) => String(l.workOrder) === woCode || String(l.product) === product
    );
    const relatedSns = serials.filter(
      (s) => String(s.workOrder) === woCode || String(s.product) === product
    );
    const downtimes = store.getDowntimes().filter((d) => wo != null && d.workOrderId === wo.id);
    const spc = spcRows.filter((s) =>
      flow && String(s.parameter).toLowerCase().includes(flow.label.toLowerCase().split(" ")[0])
    );
    const relatedOrders = orders.filter(
      (o) => String(o.product) === product
    );

    const steps: TraceStep[] = [];

    // 1) Başlangıç noktası
    steps.push({
      icon: lot ? Boxes : Barcode,
      title: lot ? `Lot: ${lot.lot}` : `Seri No: ${sn!.serial}`,
      detail: `${product} · ${lot ? `${lot.qty} adet` : "tekil ürün"} · durum: ${String(lot?.status ?? sn?.status)}`,
      color: "var(--accent)",
    });

    // 2) Hammadde (geri izleme)
    if (flow) {
      const raw = rawStock.find((r) => String(r.code) === flow.raw);
      const used = lot ? Math.round((Number(lot.qty) || 0) * flow.rawPerUnit) : 0;
      steps.push({
        icon: Package,
        title: `Hammadde: ${flow.raw} — ${raw?.name ?? "—"}`,
        detail: `${lot ? `Tüketim: ${used.toLocaleString("tr-TR")} ${raw?.unit ?? ""} · ` : ""}depo: ${raw?.location ?? "—"}${raw ? ` · kalan stok: ${Number(raw.qty).toLocaleString("tr-TR")} ${raw.unit ?? ""}` : ""}`,
        color: "#f59e0b",
      });
      steps.push({
        icon: GitBranch,
        title: `Yarı Mamul: ${flow.ym}`,
        detail: `Ara stokta işlendi → mamul kodu ${flow.mamul}`,
        color: "#38bdf8",
      });
    }

    // 3) İş emri + makine
    if (wo) {
      steps.push({
        icon: Factory,
        title: `İş Emri: ${wo.code}`,
        detail: `${wc ? `${wc.code} — ${wc.name}` : "iş merkezi atanmadı"} · hedef ${wo.targetQty.toLocaleString("tr-TR")} · üretilen ${wo.producedQty.toLocaleString("tr-TR")} · öncelik: ${wo.priority} · termin ${wo.dueDate}`,
        color: "#22c55e",
      });
    } else if (woCode) {
      steps.push({
        icon: Factory,
        title: `İş Emri: ${woCode}`,
        detail: "İş emri kaydı bulunamadı (silinmiş olabilir)",
        color: "#eab308",
      });
    }

    // 4) Operatörler (ileri izleme)
    if (operators.length) {
      steps.push({
        icon: Wrench,
        title: "Üretim Girişi — Operatörler",
        detail: operators
          .map((e) => `${String(e.operator)} (${e.qty} adet, ${e.date})`)
          .join(" · "),
        color: "#a78bfa",
      });
    }

    // 5) Kalite / SPC
    steps.push({
      icon: ShieldCheck,
      title: "Kalite Kontrol",
      detail: spc.length
        ? spc.map((s) => `${s.parameter}: ortalama ${s.mean} (LCL ${s.lcl} / UCL ${s.ucl}) → ${s.status}`).join(" · ")
        : "SPC parametresi eşleşmedi — genel kalite onayı geçerli",
      color: spc.some((s) => String(s.status) !== "Kontrol Altında") ? "#ef4444" : "#22c55e",
    });

    // 6) Duruşlar
    steps.push({
      icon: Wrench,
      title: "Üretim Sırasında Duruşlar",
      detail: downtimes.length
        ? downtimes
            .map((d) => `${d.reason}${d.endedAt ? "" : " (açık)"}`)
            .join(" · ")
        : "Bu iş emriyle ilişkili duruş kaydı yok",
      color: downtimes.length ? "#eab308" : "#22c55e",
    });

    // 7) Stok akışı (mamul)
    if (flow) {
      const mamul = readRows("mesg-mod-v8-mamul").find((m) => String(m.code) === flow.mamul);
      steps.push({
        icon: Package,
        title: `Mamul Stok: ${flow.mamul}`,
        detail: mamul
          ? `${mamul.name} · kalan: ${Number(mamul.qty).toLocaleString("tr-TR")} ${mamul.unit ?? ""}`
          : "Mamul stok kartı eşleşmedi",
        color: "#38bdf8",
      });
    }

    // 8) İlişkili lotlar / seri no'lar
    steps.push({
      icon: Boxes,
      title: `İlişkili Lotlar (${relatedLots.length})`,
      detail: relatedLots.slice(0, 6).map((l) => `${l.lot} (${l.status})`).join(" · ") || "yok",
      color: "var(--accent)",
    });
    steps.push({
      icon: Barcode,
      title: `İlişkili Seri Nolar (${relatedSns.length})`,
      detail: relatedSns.slice(0, 6).map((s) => `${s.serial} (${s.status})`).join(" · ") || "yok",
      color: "var(--accent)",
    });

    // 9) Müşteri siparişi (ileri izleme)
    if (relatedOrders.length) {
      steps.push({
        icon: Truck,
        title: `Müşteri Siparişleri (${relatedOrders.length})`,
        detail: relatedOrders
          .slice(0, 5)
          .map((o) => `${o.orderNo} — ${o.customer} (${o.status})`)
          .join(" · "),
        color: "#f472b6",
      });
    }

    return { found: true as const, steps, product };
  }, [q, lots, serials, entries, rawStock, spcRows, orders]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search size={22} style={{ color: "var(--accent)" }} />
          İzlenebilirlik Sorgu
        </h1>
        <p className="text-muted text-sm">
          Lot No veya Seri No girin: ileri izleme (hammadde → makine → kalite → müşteri siparişi) ve
          geri izleme tek akışta (ProManage izlenebilirlik tarzı)
        </p>
      </div>

      {/* Arama */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[16rem]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              list="izlenebilirlik-ids"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="LOT-261127-006 veya SN-FLN-000001 …"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-transparent font-mono text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
            />
            <datalist id="izlenebilirlik-ids">
              {allIds.map((id) => <option key={id} value={id} />)}
            </datalist>
          </div>
          <button className="btn-primary" onClick={() => setQuery(query.trim())}>
            <Search size={16} /> Sorgula
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted">Hızlı seçim:</span>
          {allIds.slice(0, 6).map((id) => (
            <button
              key={id}
              className="text-[11px] font-mono px-2 py-1 rounded-lg border hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setQuery(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Sonuç */}
      {!result && (
        <div className="card p-8 text-center text-muted text-sm">
          Bir lot veya seri no girin. Örnek: <span className="font-mono">LOT-261124-001</span> ya da{" "}
          <span className="font-mono">SN-FLN-000001</span>
        </div>
      )}

      {result && !result.found && (
        <div className="card p-6 text-center">
          <div className="text-lg font-semibold mb-1" style={{ color: "#ef4444" }}>
            "{query}" bulunamadı
          </div>
          <div className="text-sm text-muted">
            Lot/Seri No listesinden seçin veya kodu kontrol edin.
          </div>
        </div>
      )}

      {result?.found && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <GitBranch size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">İzlenebilirlik Zinciri</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: "var(--surface-2)" }}>
              {query.trim().toUpperCase()}
            </span>
            <span className="ml-auto flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1"><ArrowLeft size={12} /> geri izleme (hammadde)</span>
              <span className="flex items-center gap-1">ileri izleme (müşteri) <ArrowRight size={12} /></span>
            </span>
          </div>

          <div className="space-y-0">
            {result.steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                {/* çizgi */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${s.color} 16%, transparent)`, color: s.color }}
                  >
                    <s.icon size={16} />
                  </div>
                  {i < result.steps.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[1.5rem]" style={{ backgroundColor: "var(--border)" }} />
                  )}
                </div>
                {/* içerik */}
                <div className="pb-4 flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: s.color }}>{s.title}</div>
                  <div className="text-sm text-muted break-words">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <Link to="/izlenebilirlik/lot" className="btn-ghost !py-1.5 text-xs">Lot Takibi</Link>
            <Link to="/izlenebilirlik/seri-no" className="btn-ghost !py-1.5 text-xs">Seri No</Link>
            <Link to="/emirler" className="btn-ghost !py-1.5 text-xs">İş Emirleri</Link>
            <Link to="/durus-fire" className="btn-ghost !py-1.5 text-xs">Duruş &amp; Fire</Link>
            <Link to="/kalite/spc" className="btn-ghost !py-1.5 text-xs">SPC</Link>
          </div>
        </div>
      )}
    </div>
  );
}
