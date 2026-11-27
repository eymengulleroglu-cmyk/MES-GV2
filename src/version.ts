/**
 * MES-G Sürüm Bilgisi
 * --------------------
 * Her güncellemede bu dosya güncellenir:
 *  - Büyük özellik  -> ortadaki sayı artar  (1.2.0 -> 1.3.0)
 *  - Küçük düzeltme -> son sayı artar       (1.2.0 -> 1.2.1)
 *  - Büyük yeniden yazım -> ilk sayı artar  (1.2.0 -> 2.0.0)
 */

export const APP_VERSION = "1.2.0";

export interface Release {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const CHANGELOG: Release[] = [
  {
    version: "1.2.0",
    date: "26.11.2026",
    title: "Bulut Senkronizasyonu",
    items: [
      "Tüm veriler (modüller, iş emirleri, duruş/fire, tema, pano düzeni) buluta kaydedilir.",
      "Ayarlar → Bulut Senkronizasyonu: token ile bağlanma, şimdi eşitleme, kapatma.",
      "Farklı bilgisayarlardan girişte aynı veriler otomatik görünür.",
      "Modül tablolarında sıralıyken silme/düzenleme yanlış satırı etkileyen hata düzeltildi.",
      "Kullanım Talimatı'na senkronizasyon bölümü eklendi.",
    ],
  },
  {
    version: "1.1.0",
    date: "24.11.2026",
    title: "Veri ve Pano Güncellemesi",
    items: [
      "13 veri grubu güncel kurgusal fabrika verisiyle yenilendi.",
      "Pano KPI'ları Üretim Takibi ile senkronize edildi (3.830 üretim).",
      "Duruş & Fire modülü: 8 arıza (265 dk) ve 9 fire (55 adet) kaydı.",
      "Türkçe sayı biçimlendirme ve genişletilmiş durum renkleri.",
      "Sol menüye Makine grubunda Duruş & Fire bağlantısı eklendi.",
    ],
  },
  {
    version: "1.0.0",
    date: "18.11.2026",
    title: "İlk Kurulum",
    items: [
      "React + TypeScript + Vite + Tailwind ile MES-G iskeleti.",
      "Üretim & Kalite, Stok & İzlenebilirlik, Raporlar & Yönetim bölümleri.",
      "Tüm modüllerde ekleme, düzenleme, silme, sıralama ve arama.",
      "Açık/koyu tema, açılış ekranı (splash), logo, Pano widget'ları.",
      "Render üzerinde canlı yayın ve test altyapısı (Vitest).",
    ],
  },
];
