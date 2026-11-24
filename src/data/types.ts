export type WorkOrderStatus = "Planlandı" | "Üretimde" | "Tamamlandı" | "İptal";
export type WorkOrderPriority = "Düşük" | "Normal" | "Yüksek" | "Acil" | "Kritik";

export interface WorkOrder {
  id: string;
  code: string;
  productName: string;
  productCode?: string;
  routing?: string[]; // iş merkezi kodu sırası (rotasyon)
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

export type DowntimeReason = string; // Arıza Nedenleri modülündeki nedenler (ör. "Takım kırılması")
export type ScrapReason = string; // Hata Türleri modülündeki nedenler (ör. "Ölçü Dışı")

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