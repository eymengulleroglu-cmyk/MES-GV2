import type {
  WorkOrder,
  WorkCenter,
  DowntimeRecord,
  ScrapRecord,
  WorkOrderStatus,
  WorkOrderPriority,
  DowntimeReason,
  ScrapReason,
} from "./types";

const STORAGE_KEY = "mesg-data-v7";

interface DemoData {
  workCenters: WorkCenter[];
  workOrders: WorkOrder[];
  downtimes: DowntimeRecord[];
  scraps: ScrapRecord[];
}

function seed(): DemoData {
  const iso = (d: Date) => d.toISOString();

  const workCenters: WorkCenter[] = [
    { id: "wc-1", code: "CNC-001", name: "CNC Torna 1", status: "Üretimde", activeWorkOrderId: "wo-1" },
    { id: "wc-2", code: "CNC-002", name: "CNC Torna 2", status: "Üretimde", activeWorkOrderId: "wo-2" },
    { id: "wc-3", code: "CNC-003", name: "CNC Dik İşleme Merkezi", status: "Boşta", activeWorkOrderId: null },
    { id: "wc-4", code: "CNC-004", name: "CNC Freze", status: "Boşta", activeWorkOrderId: null },
    { id: "wc-5", code: "PRS-001", name: "Hidrolik Pres 200 Ton", status: "Üretimde", activeWorkOrderId: "wo-3" },
    { id: "wc-6", code: "KYN-001", name: "Robotik Kaynak İstasyonu", status: "Boşta", activeWorkOrderId: null },
    { id: "wc-7", code: "MON-001", name: "Montaj Hattı", status: "Boşta", activeWorkOrderId: null },
    { id: "wc-8", code: "KLT-001", name: "Kalite Kontrol İstasyonu", status: "Boşta", activeWorkOrderId: null },
    { id: "wc-9", code: "PAK-001", name: "Paketleme İstasyonu", status: "Boşta", activeWorkOrderId: null },
  ];

  const wcId = (code: string) => workCenters.find((w) => w.code === code)?.id ?? null;

  //ürün rotasyonları (iş emri -> kullanılan iş merkezleri sırası)
  const routing = (productCode: string): string[] => {
    switch (productCode) {
      case "URN-001": return ["CNC-001", "CNC-003", "KLT-001", "PAK-001"];
      case "URN-002": return ["CNC-002", "CNC-004", "KLT-001", "PAK-001"];
      case "URN-003": return ["PRS-001", "KYN-001", "KLT-001", "PAK-001"];
      case "URN-004": return ["CNC-003", "CNC-004", "KLT-001", "PAK-001"];
      case "URN-005": return ["CNC-001", "CNC-003", "MON-001", "KLT-001", "PAK-001"];
      default: return [];
    }
  };

  const raw: [string, string, string, number, string, WorkOrderPriority, number, WorkOrderStatus][] = [
    ["IE-2026-001", "URN-001", "Flanş Bağlantı Parçası", 2000, "2026-12-02", "Yüksek", 1210, "Üretimde"],
    ["IE-2026-002", "URN-002", "Çelik Mil 25 mm", 1500, "2026-12-03", "Normal", 970, "Üretimde"],
    ["IE-2026-003", "URN-003", "Motor Bağlantı Braketi", 1200, "2026-12-04", "Yüksek", 790, "Üretimde"],
    ["IE-2026-004", "URN-004", "Alüminyum Gövde", 800, "2026-12-05", "Normal", 0, "Planlandı"],
    ["IE-2026-005", "URN-005", "Rulman Yatağı", 1000, "2026-12-06", "Normal", 860, "Üretimde"],
    ["IE-2026-006", "URN-002", "Çelik Mil 25 mm", 2500, "2026-12-08", "Yüksek", 0, "Planlandı"],
    ["IE-2026-007", "URN-001", "Flanş Bağlantı Parçası", 1800, "2026-12-09", "Normal", 0, "Planlandı"],
    ["IE-2026-008", "URN-003", "Motor Bağlantı Braketi", 1500, "2026-12-10", "Kritik", 0, "Planlandı"],
    ["IE-2026-009", "URN-004", "Alüminyum Gövde", 1000, "2026-12-11", "Normal", 0, "Planlandı"],
    ["IE-2026-010", "URN-005", "Rulman Yatağı", 1600, "2026-12-12", "Yüksek", 0, "Planlandı"],
    ["IE-2026-011", "URN-001", "Flanş Bağlantı Parçası", 3000, "2026-12-14", "Normal", 0, "Planlandı"],
    ["IE-2026-012", "URN-002", "Çelik Mil 25 mm", 1200, "2026-12-15", "Normal", 0, "Planlandı"],
    ["IE-2026-013", "URN-003", "Motor Bağlantı Braketi", 2000, "2026-12-16", "Yüksek", 0, "Planlandı"],
    ["IE-2026-014", "URN-004", "Alüminyum Gövde", 1400, "2026-12-17", "Normal", 0, "Planlandı"],
    ["IE-2026-015", "URN-005", "Rulman Yatağı", 2200, "2026-12-18", "Kritik", 0, "Planlandı"],
  ];

  const workOrders: WorkOrder[] = raw.map(([code, productCode, productName, targetQty, dueDate, priority, producedQty, status], i) => ({
    id: "wo-" + (i + 1),
    code,
    productName,
    productCode,
    routing: routing(productCode),
    workCenterId: wcId(routing(productCode)[0] ?? ""),
    targetQty,
    producedQty,
    status,
    priority,
    dueDate,
    createdAt: iso(new Date("2026-11-18T08:00:00")),
  }));

  // Arıza Raporu'ndan türetilmiş duruş kayıtları: 8 arıza, toplam 265 dk
  const downtimes: DowntimeRecord[] = [
    { id: "dt-seed-1", workCenterId: "wc-1", workOrderId: "wo-1", reason: "Takım kırılması", startedAt: iso(new Date("2026-11-24T08:40:00")), endedAt: iso(new Date("2026-11-24T09:13:00")) },
    { id: "dt-seed-2", workCenterId: "wc-1", workOrderId: "wo-1", reason: "Takım kırılması", startedAt: iso(new Date("2026-11-24T13:20:00")), endedAt: iso(new Date("2026-11-24T13:52:00")) },
    { id: "dt-seed-3", workCenterId: "wc-2", workOrderId: "wo-2", reason: "Motor aşırı ısınması", startedAt: iso(new Date("2026-11-24T10:05:00")), endedAt: iso(new Date("2026-11-24T10:40:00")) },
    { id: "dt-seed-4", workCenterId: "wc-3", workOrderId: "wo-4", reason: "Soğutma sıvısı sistemi arızası", startedAt: iso(new Date("2026-11-24T15:10:00")), endedAt: iso(new Date("2026-11-24T16:00:00")) },
    { id: "dt-seed-5", workCenterId: "wc-4", workOrderId: "wo-2", reason: "Rulman aşınması", startedAt: iso(new Date("2026-11-25T09:30:00")), endedAt: iso(new Date("2026-11-25T10:10:00")) },
    { id: "dt-seed-6", workCenterId: "wc-5", workOrderId: "wo-3", reason: "Hidrolik basınç düşmesi", startedAt: iso(new Date("2026-11-25T11:00:00")), endedAt: iso(new Date("2026-11-25T11:30:00")) },
    { id: "dt-seed-7", workCenterId: "wc-7", workOrderId: "wo-5", reason: "Konveyör sıkışması", startedAt: iso(new Date("2026-11-25T14:15:00")), endedAt: iso(new Date("2026-11-25T14:40:00")) },
    { id: "dt-seed-8", workCenterId: "wc-9", workOrderId: "wo-1", reason: "Paketleme mekanizması arızası", startedAt: iso(new Date("2026-11-25T16:00:00")), endedAt: iso(new Date("2026-11-25T16:20:00")) },
  ];

  // Verimlilik Raporu'ndan türetilmiş fire kayıtları: makine bazlı toplam 55 adet
  const scraps: ScrapRecord[] = [
    { id: "sc-seed-1", workCenterId: "wc-1", workOrderId: "wo-1", qty: 12, reason: "Ölçü Dışı", createdAt: iso(new Date("2026-11-24T11:00:00")) },
    { id: "sc-seed-2", workCenterId: "wc-2", workOrderId: "wo-2", qty: 8, reason: "Yüzey Hatası", createdAt: iso(new Date("2026-11-24T12:30:00")) },
    { id: "sc-seed-3", workCenterId: "wc-3", workOrderId: "wo-4", qty: 7, reason: "Çapak", createdAt: iso(new Date("2026-11-24T16:30:00")) },
    { id: "sc-seed-4", workCenterId: "wc-4", workOrderId: "wo-2", qty: 6, reason: "Ölçü Dışı", createdAt: iso(new Date("2026-11-25T10:30:00")) },
    { id: "sc-seed-5", workCenterId: "wc-5", workOrderId: "wo-3", qty: 8, reason: "Yüzey Hatası", createdAt: iso(new Date("2026-11-25T12:00:00")) },
    { id: "sc-seed-6", workCenterId: "wc-6", workOrderId: "wo-3", qty: 5, reason: "Kaynak Hatası", createdAt: iso(new Date("2026-11-25T13:00:00")) },
    { id: "sc-seed-7", workCenterId: "wc-7", workOrderId: "wo-5", qty: 4, reason: "Montaj Hatası", createdAt: iso(new Date("2026-11-25T15:00:00")) },
    { id: "sc-seed-8", workCenterId: "wc-8", workOrderId: "wo-1", qty: 2, reason: "Görsel Hata", createdAt: iso(new Date("2026-11-25T15:30:00")) },
    { id: "sc-seed-9", workCenterId: "wc-9", workOrderId: "wo-1", qty: 3, reason: "Eksik İşlem", createdAt: iso(new Date("2026-11-25T16:40:00")) },
  ];

  return { workCenters, workOrders, downtimes, scraps };
}

let data: DemoData = load();

function load(): DemoData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoData;
  } catch {
    /* ignore */
  }
  const s = seed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const store = {
  reset() {
    const s = seed();
    data = s;
    save();
    return data;
  },
  getWorkCenters() { return [...data.workCenters]; },
  getWorkOrders() { return [...data.workOrders]; },
  getDowntimes() { return [...data.downtimes]; },
  getScraps() { return [...data.scraps]; },
  getWorkCenter(id: string) { return data.workCenters.find((w) => w.id === id) ?? null; },
  getWorkOrder(id: string) { return data.workOrders.find((w) => w.id === id) ?? null; },
  createWorkOrder(input: Omit<WorkOrder, "id" | "createdAt" | "producedQty" | "status"> & { status?: WorkOrderStatus }) {
    if (!input.code || !input.productName || !input.dueDate) throw new Error("Emir no, ürün ve termin zorunludur.");
    if (!input.targetQty || input.targetQty <= 0) throw new Error("Hedef adet 0'dan büyük olmalıdır.");
    if (input.workCenterId) {
      const busy = data.workOrders.find((w) => w.workCenterId === input.workCenterId && (w.status === "Üretimde" || w.status === "Planlandı"));
      if (busy) throw new Error("Bu iş merkezinde zaten aktif bir iş emri var (" + busy.code + "). Önce onu tamamlayın veya başka makine seçin.");
    }
    const wo: WorkOrder = {
      id: "wo-" + Date.now(),
      code: input.code,
      productName: input.productName,
      workCenterId: input.workCenterId,
      targetQty: input.targetQty,
      producedQty: 0,
      status: input.status ?? "Planlandı",
      priority: input.priority,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
    };
    data.workOrders.unshift(wo);
    save();
    return wo;
  },
  assignWorkOrder(workOrderId: string, workCenterId: string | null) {
    const wo = data.workOrders.find((w) => w.id === workOrderId);
    if (!wo) return;
    if (wo.workCenterId) {
      const prev = data.workCenters.find((w) => w.id === wo.workCenterId);
      if (prev && prev.activeWorkOrderId === wo.id) { prev.activeWorkOrderId = null; prev.status = "Boşta"; }
    }
    wo.workCenterId = workCenterId;
    if (workCenterId) {
      const wc = data.workCenters.find((w) => w.id === workCenterId);
      if (wc) { wc.activeWorkOrderId = wo.id; if (wo.status === "Planlandı") wo.status = "Üretimde"; wc.status = wo.status === "Tamamlandı" ? "Boşta" : "Üretimde"; }
    }
    save();
  },
  setProducedQty(workOrderId: string, qty: number) {
    const wo = data.workOrders.find((w) => w.id === workOrderId);
    if (!wo) return;
    wo.producedQty = Math.max(0, Math.min(wo.targetQty, qty));
    if (wo.producedQty >= wo.targetQty && wo.targetQty > 0) {
      wo.status = "Tamamlandı";
      if (wo.workCenterId) {
        const wc = data.workCenters.find((w) => w.id === wo.workCenterId);
        if (wc && wc.activeWorkOrderId === wo.id) { wc.activeWorkOrderId = null; wc.status = "Boşta"; }
      }
    } else if (wo.status === "Tamamlandı" && wo.producedQty < wo.targetQty) {
      wo.status = "Üretimde";
    }
    save();
  },
  startWorkOrder(workOrderId: string) {
    const wo = data.workOrders.find((w) => w.id === workOrderId);
    if (!wo) return;
    wo.status = "Üretimde";
    if (wo.workCenterId) {
      const wc = data.workCenters.find((w) => w.id === wo.workCenterId);
      if (wc) { wc.activeWorkOrderId = wo.id; wc.status = "Üretimde"; }
    }
    save();
  },
  updateWorkOrder(id: string, patch: Partial<WorkOrder>) {
    const wo = data.workOrders.find((w) => w.id === id);
    if (!wo) return;
    if (patch.workCenterId && patch.workCenterId !== wo.workCenterId) {
      const busy = data.workOrders.find((w) => w.id !== id && w.workCenterId === patch.workCenterId && (w.status === "Üretimde" || w.status === "Planlandı"));
      if (busy) throw new Error("Bu iş merkezinde zaten aktif bir iş emri var (" + busy.code + ").");
    }
    if (patch.targetQty !== undefined && patch.targetQty <= 0) throw new Error("Hedef adet 0'dan büyük olmalıdır.");
    Object.assign(wo, patch);
    save();
  },
  deleteWorkOrder(id: string) {
    data.workOrders = data.workOrders.filter((w) => w.id !== id);
    save();
  },
  startDowntime(workCenterId: string, workOrderId: string | null, reason: DowntimeReason) {
    const rec: DowntimeRecord = { id: "dt-" + Date.now(), workCenterId, workOrderId, reason, startedAt: new Date().toISOString(), endedAt: null };
    data.downtimes.unshift(rec);
    const wc = data.workCenters.find((w) => w.id === workCenterId);
    if (wc) wc.status = "Duruşta";
    save();
    return rec;
  },
  endDowntime(id: string) {
    const rec = data.downtimes.find((d) => d.id === id);
    if (!rec || rec.endedAt) return;
    rec.endedAt = new Date().toISOString();
    const wc = data.workCenters.find((w) => w.id === rec.workCenterId);
    if (wc) wc.status = wc.activeWorkOrderId ? "Üretimde" : "Boşta";
    save();
  },
  addScrap(workCenterId: string, workOrderId: string | null, qty: number, reason: ScrapReason) {
    const rec: ScrapRecord = { id: "sc-" + Date.now(), workCenterId, workOrderId, qty, reason, createdAt: new Date().toISOString() };
    data.scraps.unshift(rec);
    save();
    return rec;
  },
  createWorkCenter(input: { code: string; name: string; status?: WorkCenter["status"] }) {
    const wc: WorkCenter = { id: "wc-" + Date.now(), code: input.code, name: input.name, status: input.status ?? "Boşta", activeWorkOrderId: null };
    data.workCenters.push(wc);
    save();
    return wc;
  },
  updateWorkCenter(id: string, patch: Partial<WorkCenter>) {
    const wc = data.workCenters.find((w) => w.id === id);
    if (!wc) return;
    Object.assign(wc, patch);
    save();
  },
  deleteWorkCenter(id: string) {
    data.workCenters = data.workCenters.filter((w) => w.id !== id);
    data.workOrders.forEach((wo) => { if (wo.workCenterId === id) wo.workCenterId = null; });
    save();
  },
};