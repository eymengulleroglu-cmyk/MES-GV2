export type WorkOrderStatus = "Planlandı" | "Üretimde" | "Tamamlandı" | "İptal";
export type WorkOrderPriority = "Düşük" | "Normal" | "Yüksek" | "Acil";

export interface WorkOrder {
  id: string;
  code: string;
  productName: string;
  workCenterId: string | null;
  targetQty: number;
  producedQty: number;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  dueDate: string; // ISO date
  createdAt: string;
}

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  status: "Boşta" | "Üretimde" | "Duruşta";
  activeWorkOrderId: string | null;
}

export type DowntimeReason = "Malzeme bekleniyor" | "Araç arızası" | "Planlı bakım" | "Operatör bekliyor" | "Diğer";
export type ScrapReason = "Ölçü dışı" | "Yüzey hatası" | "Malzeme hatası" | "Montaj hatası" | "Diğer";

export interface DowntimeRecord {
  id: string;
  workCenterId: string;
  workOrderId: string | null;
  reason: DowntimeReason;
  startedAt: string; // ISO
  endedAt: string | null;
}

export interface ScrapRecord {
  id: string;
  workCenterId: string;
  workOrderId: string | null;
  qty: number;
  reason: ScrapReason;
  createdAt: string;
}