import { describe, it, expect, beforeEach } from "vitest";
import { store } from "./store";

describe("MES-G demo verisi", () => {
  beforeEach(() => {
    store.reset();
  });

  it("iş merkezi sayısı 7", () => {
    expect(store.getWorkCenters().length).toBe(7);
  });

  it("üretim emri sayısı 8", () => {
    expect(store.getWorkOrders().length).toBe(8);
  });

  it("üretilen adet hedeften büyük değil", () => {
    for (const w of store.getWorkOrders()) {
      expect(w.producedQty).toBeLessThanOrEqual(w.targetQty);
    }
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
    const rec = store.startDowntime("wc-3", null, "Malzeme bekleniyor");
    expect(rec.endedAt).toBeNull();
    store.endDowntime(rec.id);
    const updated = store.getDowntimes().find((d) => d.id === rec.id)!;
    expect(updated.endedAt).not.toBeNull();
  });

  it("fire kaydı eklenir", () => {
    const before = store.getScraps().length;
    store.addScrap("wc-3", null, 3, "Ölçü dışı");
    expect(store.getScraps().length).toBe(before + 1);
  });
});