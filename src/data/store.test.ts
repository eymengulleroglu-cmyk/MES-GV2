import { describe, it, expect, beforeEach } from "vitest";
import { store } from "./store";

describe("MES-G veri katmanı", () => {
  beforeEach(() => {
    store.reset();
  });

  it("iş merkezi sayısı 9", () => {
    expect(store.getWorkCenters().length).toBe(9);
  });

  it("iş emri sayısı 15", () => {
    expect(store.getWorkOrders().length).toBe(15);
  });

  it("iş emirleri ürün kodu ve rotasyon içerir", () => {
    for (const w of store.getWorkOrders()) {
      expect(w.productCode).toBeTruthy();
      expect((w.routing ?? []).length).toBeGreaterThan(0);
    }
  });

  it("ürün rotasyonları geçerli iş merkezi kodları kullanır", () => {
    const codes = new Set(store.getWorkCenters().map((c) => c.code));
    for (const w of store.getWorkOrders()) {
      for (const c of w.routing ?? []) expect(codes.has(c)).toBe(true);
    }
  });

  it("üretilen adet hedeften büyük değil", () => {
    const wo = store.getWorkOrders()[0];
    store.setProducedQty(wo.id, 999999);
    expect(store.getWorkOrder(wo.id)!.producedQty).toBe(wo.targetQty);
  });

  it("durum değerleri geçerli", () => {
    const valid = ["Planlandı", "Üretimde", "Tamamlandı", "İptal"];
    for (const w of store.getWorkOrders()) {
      expect(valid).toContain(w.status);
    }
  });

  it("sentetik veri: yasaklı kelimeler yok", () => {
    const all = JSON.stringify(store.getWorkOrders()) + JSON.stringify(store.getWorkCenters()) + JSON.stringify(store.getDowntimes()) + JSON.stringify(store.getScraps());
    const forbidden = ["Ford", "Otosan", "Bosch", "Siemens", "Toyota"];
    for (const f of forbidden) {
      expect(all).not.toContain(f);
    }
  });

  it("duruş kaydı başlat/bitir çalışır", () => {
    const wc = store.createWorkCenter({ code: "MK-1", name: "Test Makine" });
    const rec = store.startDowntime(wc.id, null, "Malzeme bekleniyor");
    expect(rec.endedAt).toBeNull();
    store.endDowntime(rec.id);
    const updated = store.getDowntimes().find((d) => d.id === rec.id)!;
    expect(updated.endedAt).not.toBeNull();
  });

  it("fire kaydı eklenir", () => {
    const wc = store.createWorkCenter({ code: "MK-2", name: "Test Makine 2" });
    store.addScrap(wc.id, null, 3, "Ölçü dışı");
    expect(store.getScraps().length).toBe(10); // 9 seed + 1 yeni
  });

  it("duruş kayıtları arıza raporuyla tutarlı: 8 kayıt, 265 dk", () => {
    const dts = store.getDowntimes();
    expect(dts.length).toBe(8);
    const totalMin = dts.reduce((s, d) => {
      const end = d.endedAt ? new Date(d.endedAt).getTime() : 0;
      return s + Math.round((end - new Date(d.startedAt).getTime()) / 60000);
    }, 0);
    expect(totalMin).toBe(265);
    expect(dts.every((d) => d.endedAt)).toBe(true);
  });

  it("fire kayıtları verimlilik raporuyla tutarlı: 9 kayıt, 55 adet", () => {
    const scraps = store.getScraps();
    expect(scraps.length).toBe(9);
    expect(scraps.reduce((s, r) => s + r.qty, 0)).toBe(55);
  });

  it("üretilen toplamı üretim raporuyla tutarlı: 3.830", () => {
    const total = store.getWorkOrders().reduce((s, w) => s + w.producedQty, 0);
    expect(total).toBe(3830);
  });
});
