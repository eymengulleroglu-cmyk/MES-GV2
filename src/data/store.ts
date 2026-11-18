import type {
  WorkOrder,
  WorkCenter,
  DowntimeRecord,
  ScrapRecord,
  WorkOrderStatus,
  DowntimeReason,
  ScrapReason,
} from "./types";

const STORAGE_KEY = "mesg-demo-data-v3";

interface DemoData {
  workCenters: WorkCenter[];
  workOrders: WorkOrder[];
  downtimes: DowntimeRecord[];
  scraps: ScrapRecord[];
}

function seed(): DemoData {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const days = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const workCenters: WorkCenter[] = [
    { id: "wc-1", code: "CNC-1", name: "CNC Torna Hattı", status: "Üretimde", activeWorkOrderId: "wo-1" },
    { id: "wc-2", code: "CNC-2", name: "CNC Freze Hattı", status: "Üretimde", activeWorkOrderId: "wo-2" },
    { id: "wc-3", code: "PRES-A", name: "Pres Hattı A", status: "Üretimde", activeWorkOrderId: "wo-4" },
    { id: "wc-4", code: "KYN-1", name: "Kaynak Robot Hattı", status: "Üretimde", activeWorkOrderId: "wo-5" },
    { id: "wc-5", code: "BOYA-1", name: "Boya Hattı", status: "Boşta", activeWorkOrderId: null },
    { id: "wc-6", code: "MONT-1", name: "Montaj Hattı", status: "Boşta", activeWorkOrderId: null },
    { id: "wc-7", code: "PAK-1", name: "Paketleme Hattı", status: "Boşta", activeWorkOrderId: null },
  ];

  const workOrders: WorkOrder[] = [
    { id: "wo-1", code: "WO-1001", productName: "Piston P-200", workCenterId: "wc-1", targetQty: 500, producedQty: 320, status: "Üretimde", priority: "Yüksek", dueDate: days(2), createdAt: iso(new Date(now.getTime() - 86400000)) },
    { id: "wo-2", code: "WO-1002", productName: "Fren Diski FD-300", workCenterId: "wc-2", targetQty: 300, producedQty: 180, status: "Üretimde", priority: "Normal", dueDate: days(1), createdAt: iso(new Date(now.getTime() - 172800000)) },
    { id: "wo-3", code: "WO-1003", productName: "Şanzıman Dişlisi SD-150", workCenterId: null, targetQty: 800, producedQty: 0, status: "Planlandı", priority: "Normal", dueDate: days(5), createdAt: iso(new Date(now.getTime() - 43200000)) },
    { id: "wo-4", code: "WO-1004", productName: "Kapı Paneli KP-400", workCenterId: "wc-3", targetQty: 200, producedQty: 120, status: "Üretimde", priority: "Düşük", dueDate: days(7), createdAt: iso(new Date(now.getTime() - 21600000)) },
    { id: "wo-5", code: "WO-1005", productName: "Egzoz Susturucusu ES-100", workCenterId: "wc-4", targetQty: 150, producedQty: 60, status: "Üretimde", priority: "Acil", dueDate: days(0), createdAt: iso(new Date(now.getTime() - 259200000)) },
    { id: "wo-6", code: "WO-1006", productName: "Motor Bloğu MB-500", workCenterId: "wc-2", targetQty: 100, producedQty: 100, status: "Tamamlandı", priority: "Normal", dueDate: days(-1), createdAt: iso(new Date(now.getTime() - 604800000)) },
    { id: "wo-7", code: "WO-1007", productName: "Süspansiyon Kolu SK-220", workCenterId: "wc-3", targetQty: 400, producedQty: 400, status: "Tamamlandı", priority: "Normal", dueDate: days(-2), createdAt: iso(new Date(now.getTime() - 691200000)) },
    { id: "wo-8", code: "WO-1008", productName: "Far Çerçevesi FC-80", workCenterId: null, targetQty: 600, producedQty: 0, status: "Planlandı", priority: "Yüksek", dueDate: days(3), createdAt: iso(new Date(now.getTime() - 10800000)) },
  ];

  const downtimes: DowntimeRecord[] = [
    { id: "dt-1", workCenterId: "wc-5", workOrderId: null, reason: "Planlı bakım", startedAt: iso(new Date(now.getTime() - 3600000)), endedAt: null },
    { id: "dt-2", workCenterId: "wc-1", workOrderId: "wo-1", reason: "Malzeme bekleniyor", startedAt: iso(new Date(now.getTime() - 86400000)), endedAt: iso(new Date(now.getTime() - 82800000)) },
    { id: "dt-3", workCenterId: "wc-4", workOrderId: "wo-5", reason: "Araç arızası", startedAt: iso(new Date(now.getTime() - 172800000)), endedAt: iso(new Date(now.getTime() - 169200000)) },
  ];

  const scraps: ScrapRecord[] = [
    { id: "sc-1", workCenterId: "wc-1", workOrderId: "wo-1", qty: 4, reason: "Ölçü dışı", createdAt: iso(new Date(now.getTime() - 7200000)) },
    { id: "sc-2", workCenterId: "wc-2", workOrderId: "wo-2", qty: 2, reason: "Yüzey hatası", createdAt: iso(new Date(now.getTime() - 14400000)) },
    { id: "sc-3", workCenterId: "wc-4", workOrderId: "wo-5", qty: 1, reason: "Malzeme hatası", createdAt: iso(new Date(now.getTime() - 18000000)) },
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