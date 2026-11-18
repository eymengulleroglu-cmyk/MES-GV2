export interface ModuleRow { [key: string]: string | number }

export interface ModuleConfig {
  title: string;
  description: string;
  columns: { key: string; label: string }[];
  rows: ModuleRow[];
}

const mk = (rows: ModuleRow[]) => rows;

export const MODULES: Record<string, ModuleConfig> = {
  "siparisler": {
    title: "Siparişler",
    description: "Müşteri siparişleri (otomobil fabrikası demo)",
    columns: [
      { key: "orderNo", label: "Sipariş No" },
      { key: "customer", label: "Müşteri" },
      { key: "product", label: "Ürün" },
      { key: "qty", label: "Miktar" },
      { key: "dueDate", label: "Termin" },
      { key: "status", label: "Durum" },
    ],
    rows: mk([
      { orderNo: "SP-2026-001", customer: "OEM A", product: "Piston P-200", qty: 1000, dueDate: "2026-11-30", status: "Açık" },
      { orderNo: "SP-2026-002", customer: "OEM B", product: "Fren Diski FD-300", qty: 500, dueDate: "2026-12-05", status: "Üretimde" },
      { orderNo: "SP-2026-003", customer: "OEM C", product: "Kapı Paneli KP-400", qty: 300, dueDate: "2026-12-10", status: "Planlandı" },
      { orderNo: "SP-2026-004", customer: "OEM A", product: "Egzoz Susturucusu ES-100", qty: 200, dueDate: "2026-12-15", status: "Planlandı" },
    ]),
  },
  "uretim-girisi": {
    title: "Üretim Girişi",
    description: "Üretimden gelen adet ve operatör girişleri (otomobil fabrikası demo)",
    columns: [
      { key: "id", label: "Kayıt No" },
      { key: "workOrder", label: "İş Emri" },
      { key: "operator", label: "Operatör" },
      { key: "qty", label: "Adet" },
      { key: "date", label: "Tarih" },
    ],
    rows: mk([
      { id: "UG-001", workOrder: "WO-1001", operator: "A. Yılmaz", qty: 50, date: "2026-11-17" },
      { id: "UG-002", workOrder: "WO-1002", operator: "B. Kaya", qty: 30, date: "2026-11-17" },
      { id: "UG-003", workOrder: "WO-1005", operator: "C. Demir", qty: 20, date: "2026-11-16" },
      { id: "UG-004", workOrder: "WO-1004", operator: "D. Şahin", qty: 40, date: "2026-11-16" },
    ]),
  },
  "uretim-takibi": {
    title: "Üretim Takibi (Makine)",
    description: "Makine bazlı anlık üretim takibi (otomobil fabrikası demo)",
    columns: [
      { key: "machine", label: "Makine" },
      { key: "workOrder", label: "İş Emri" },
      { key: "product", label: "Ürün" },
      { key: "status", label: "Durum" },
      { key: "produced", label: "Üretilen" },
      { key: "target", label: "Hedef" },
    ],
    rows: mk([
      { machine: "CNC-1", workOrder: "WO-1001", product: "Piston P-200", status: "Üretimde", produced: 320, target: 500 },
      { machine: "CNC-2", workOrder: "WO-1002", product: "Fren Diski FD-300", status: "Üretimde", produced: 180, target: 300 },
      { machine: "PRES-A", workOrder: "WO-1004", product: "Kapı Paneli KP-400", status: "Üretimde", produced: 120, target: 200 },
      { machine: "KYN-1", workOrder: "WO-1005", product: "Egzoz Susturucusu ES-100", status: "Duruşta", produced: 60, target: 150 },
    ]),
  },
  "makine-listesi": {
    title: "Makine Listesi",
    description: "Atölye makine ve iş merkezi kartları (otomobil fabrikası demo)",
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Ad" },
      { key: "type", label: "Tip" },
      { key: "status", label: "Durum" },
      { key: "location", label: "Konum" },
    ],
    rows: mk([
      { code: "CNC-1", name: "CNC Torna Hattı", type: "Torna", status: "Üretimde", location: "Hat A" },
      { code: "CNC-2", name: "CNC Freze Hattı", type: "Freze", status: "Üretimde", location: "Hat A" },
      { code: "PRES-A", name: "Pres Hattı A", type: "Pres", status: "Üretimde", location: "Hat B" },
      { code: "KYN-1", name: "Kaynak Robot Hattı", type: "Kaynak", status: "Duruşta", location: "Hat C" },
      { code: "BOYA-1", name: "Boya Hattı", type: "Boya", status: "Boşta", location: "Hat D" },
      { code: "MONT-1", name: "Montaj Hattı", type: "Montaj", status: "Boşta", location: "Hat E" },
      { code: "PAK-1", name: "Paketleme Hattı", type: "Paketleme", status: "Boşta", location: "Hat F" },
    ]),
  },
  "arizalar": {
    title: "Arızalar",
    description: "Makine arıza kayıtları (otomobil fabrikası demo)",
    columns: [
      { key: "id", label: "Arıza No" },
      { key: "machine", label: "Makine" },
      { key: "reason", label: "Neden" },
      { key: "severity", label: "Şiddet" },
      { key: "date", label: "Tarih" },
    ],
    rows: mk([
      { id: "AR-001", machine: "KYN-1", reason: "Kaynak robotu eksen hatası", severity: "Yüksek", date: "2026-11-17" },
      { id: "AR-002", machine: "CNC-1", reason: "Takım aşınması", severity: "Orta", date: "2026-11-16" },
      { id: "AR-003", machine: "PRES-A", reason: "Hidrolik kaçak", severity: "Yüksek", date: "2026-11-15" },
      { id: "AR-004", machine: "CNC-2", reason: "Soğutma sıvısı düşük", severity: "Düşük", date: "2026-11-14" },
    ]),
  },
  "bakim": {
    title: "Bakım Planları",
    description: "Periyodik bakım planları (otomobil fabrikası demo)",
    columns: [
      { key: "id", label: "Plan No" },
      { key: "machine", label: "Makine" },
      { key: "type", label: "Bakım Tipi" },
      { key: "interval", label: "Periyot" },
      { key: "next", label: "Sonraki Bakım" },
    ],
    rows: mk([
      { id: "BP-001", machine: "CNC-1", type: "Yağlama", interval: "Haftalık", next: "2026-11-20" },
      { id: "BP-002", machine: "PRES-A", type: "Filtre değişimi", interval: "Aylık", next: "2026-12-01" },
      { id: "BP-003", machine: "KYN-1", type: "Kalibrasyon", interval: "3 Aylık", next: "2027-01-15" },
      { id: "BP-004", machine: "BOYA-1", type: "Filtre temizliği", interval: "Haftalık", next: "2026-11-19" },
    ]),
  },
  "oee": {
    title: "OEE",
    description: "Kullanılabilirlik / Performans / Kalite (otomobil fabrikası demo)",
    columns: [
      { key: "machine", label: "Makine" },
      { key: "availability", label: "Kullanılabilirlik %" },
      { key: "performance", label: "Performans %" },
      { key: "quality", label: "Kalite %" },
      { key: "oee", label: "OEE %" },
    ],
    rows: mk([
      { machine: "CNC-1", availability: 92, performance: 88, quality: 97, oee: 78 },
      { machine: "CNC-2", availability: 90, performance: 85, quality: 96, oee: 74 },
      { machine: "PRES-A", availability: 85, performance: 90, quality: 95, oee: 73 },
      { machine: "KYN-1", availability: 70, performance: 75, quality: 92, oee: 49 },
      { machine: "BOYA-1", availability: 95, performance: 92, quality: 98, oee: 86 },
    ]),
  },
  "kalite-kontrol": {
    title: "Kalite Kontrol",
    description: "Kalite kontrol kayıtları (otomobil fabrikası demo)",
    columns: [
      { key: "id", label: "Kayıt No" },
      { key: "workOrder", label: "İş Emri" },
      { key: "product", label: "Ürün" },
      { key: "inspector", label: "Kontrolör" },
      { key: "result", label: "Sonuç" },
      { key: "date", label: "Tarih" },
    ],
    rows: mk([
      { id: "KK-001", workOrder: "WO-1001", product: "Piston P-200", inspector: "D. Şahin", result: "Uygun", date: "2026-11-17" },
      { id: "KK-002", workOrder: "WO-1002", product: "Fren Diski FD-300", inspector: "E. Yıldız", result: "Uygun", date: "2026-11-17" },
      { id: "KK-003", workOrder: "WO-1005", product: "Egzoz Susturucusu ES-100", inspector: "F. Arslan", result: "Uygun Değil", date: "2026-11-16" },
      { id: "KK-004", workOrder: "WO-1004", product: "Kapı Paneli KP-400", inspector: "G. Kaya", result: "Uygun", date: "2026-11-16" },
    ]),
  },
  "hata-kayitlari": {
    title: "Hata Kayıtları",
    description: "Kalite hata kayıtları (otomobil fabrikası demo)",
    columns: [
      { key: "id", label: "Hata No" },
      { key: "workOrder", label: "İş Emri" },
      { key: "product", label: "Ürün" },
      { key: "defect", label: "Hata" },
      { key: "qty", label: "Adet" },
      { key: "date", label: "Tarih" },
    ],
    rows: mk([
      { id: "HK-001", workOrder: "WO-1001", product: "Piston P-200", defect: "Ölçü dışı", qty: 4, date: "2026-11-17" },
      { id: "HK-002", workOrder: "WO-1002", product: "Fren Diski FD-300", defect: "Yüzey hatası", qty: 2, date: "2026-11-17" },
      { id: "HK-003", workOrder: "WO-1005", product: "Egzoz Susturucusu ES-100", defect: "Kaynak çatlağı", qty: 1, date: "2026-11-16" },
    ]),
  },
  "spc": {
    title: "SPC (İstatistiksel Proses Kontrol)",
    description: "Kontrol kartı özeti (otomobil fabrikası demo)",
    columns: [
      { key: "parameter", label: "Parametre" },
      { key: "mean", label: "Ortalama" },
      { key: "ucl", label: "Üst Limit" },
      { key: "lcl", label: "Alt Limit" },
      { key: "status", label: "Durum" },
    ],
    rows: mk([
      { parameter: "Piston Çapı (mm)", mean: 82.02, ucl: 82.10, lcl: 81.90, status: "Kontrolde" },
      { parameter: "Fren Diski Kalınlığı (mm)", mean: 22.01, ucl: 22.10, lcl: 21.90, status: "Kontrolde" },
      { parameter: "Kapı Paneli Genişliği (mm)", mean: 950.5, ucl: 952.0, lcl: 949.0, status: "Uyarı" },
    ]),
  },
  "hammadde": {
    title: "Hammadde Stok",
    description: "Hammadde stok durumu (otomobil fabrikası demo)",
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Ad" },
      { key: "qty", label: "Miktar" },
      { key: "unit", label: "Birim" },
      { key: "location", label: "Depo" },
    ],
    rows: mk([
      { code: "HM-001", name: "Çelik Mil Ø12", qty: 1200, unit: "adet", location: "Depo A" },
      { code: "HM-002", name: "Alüminyum Sac", qty: 450, unit: "kg", location: "Depo B" },
      { code: "HM-003", name: "Plastik Granül", qty: 800, unit: "kg", location: "Depo C" },
      { code: "HM-004", name: "Dökme Demir Blok", qty: 200, unit: "adet", location: "Depo A" },
      { code: "HM-005", name: "Bakır Tel", qty: 150, unit: "kg", location: "Depo D" },
    ]),
  },
  "yari-mamul": {
    title: "Yarı Mamul Stok",
    description: "Yarı mamul stok durumu (otomobil fabrikası demo)",
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Ad" },
      { key: "qty", label: "Miktar" },
      { key: "unit", label: "Birim" },
      { key: "location", label: "Depo" },
    ],
    rows: mk([
      { code: "YM-001", name: "İşlenmiş Piston", qty: 320, unit: "adet", location: "Depo A" },
      { code: "YM-002", name: "Preslenmiş Kapı Paneli", qty: 180, unit: "adet", location: "Depo B" },
      { code: "YM-003", name: "Kaynaklanmış Egzoz", qty: 90, unit: "adet", location: "Depo C" },
    ]),
  },
  "mamul": {
    title: "Mamul Stok",
    description: "Mamul stok durumu (otomobil fabrikası demo)",
    columns: [
      { key: "code", label: "Kod" },
      { key: "name", label: "Ad" },
      { key: "qty", label: "Miktar" },
      { key: "unit", label: "Birim" },
      { key: "location", label: "Depo" },
    ],
    rows: mk([
      { code: "MM-001", name: "Piston P-200", qty: 400, unit: "adet", location: "Depo D" },
      { code: "MM-002", name: "Fren Diski FD-300", qty: 200, unit: "adet", location: "Depo D" },
      { code: "MM-003", name: "Şanzıman Dişlisi SD-150", qty: 150, unit: "adet", location: "Depo E" },
    ]),
  },
  "lot-takibi": {
    title: "Lot Takibi",
    description: "Lot bazlı izlenebilirlik (otomobil fabrikası demo)",
    columns: [
      { key: "lot", label: "Lot No" },
      { key: "product", label: "Ürün" },
      { key: "qty", label: "Miktar" },
      { key: "status", label: "Durum" },
      { key: "date", label: "Tarih" },
    ],
    rows: mk([
      { lot: "LOT-2026-001", product: "Piston P-200", qty: 500, status: "Açık", date: "2026-11-17" },
      { lot: "LOT-2026-002", product: "Fren Diski FD-300", qty: 300, status: "Kapalı", date: "2026-11-16" },
      { lot: "LOT-2026-003", product: "Kapı Paneli KP-400", qty: 200, status: "Açık", date: "2026-11-15" },
    ]),
  },
  "seri-no": {
    title: "Seri No Takibi",
    description: "Seri numarası bazlı izlenebilirlik (otomobil fabrikası demo)",
    columns: [
      { key: "serial", label: "Seri No" },
      { key: "product", label: "Ürün" },
      { key: "workOrder", label: "İş Emri" },
      { key: "status", label: "Durum" },
    ],
    rows: mk([
      { serial: "SN-00001", product: "Piston P-200", workOrder: "WO-1001", status: "Sevk Edildi" },
      { serial: "SN-00002", product: "Piston P-200", workOrder: "WO-1001", status: "Stokta" },
      { serial: "SN-00003", product: "Fren Diski FD-300", workOrder: "WO-1002", status: "Stokta" },
      { serial: "SN-00004", product: "Egzoz Susturucusu ES-100", workOrder: "WO-1005", status: "Stokta" },
    ]),
  },
  "rapor-uretim": {
    title: "Üretim Raporu",
    description: "Üretim özet raporu (otomobil fabrikası demo)",
    columns: [
      { key: "period", label: "Dönem" },
      { key: "produced", label: "Üretilen" },
      { key: "target", label: "Hedef" },
      { key: "efficiency", label: "Verim %" },
    ],
    rows: mk([
      { period: "2026-11-17", produced: 500, target: 550, efficiency: 91 },
      { period: "2026-11-16", produced: 480, target: 500, efficiency: 96 },
      { period: "2026-11-15", produced: 420, target: 500, efficiency: 84 },
    ]),
  },
  "rapor-verimlilik": {
    title: "Verimlilik Raporu",
    description: "Makine verimlilik raporu (otomobil fabrikası demo)",
    columns: [
      { key: "machine", label: "Makine" },
      { key: "oee", label: "OEE %" },
      { key: "downtime", label: "Duruş (dk)" },
      { key: "scrap", label: "Fire" },
    ],
    rows: mk([
      { machine: "CNC-1", oee: 78, downtime: 45, scrap: 4 },
      { machine: "CNC-2", oee: 74, downtime: 60, scrap: 2 },
      { machine: "PRES-A", oee: 73, downtime: 90, scrap: 3 },
      { machine: "KYN-1", oee: 49, downtime: 120, scrap: 1 },
      { machine: "BOYA-1", oee: 86, downtime: 20, scrap: 0 },
    ]),
  },
  "rapor-ariza": {
    title: "Arıza Raporu",
    description: "Arıza özet raporu (otomobil fabrikası demo)",
    columns: [
      { key: "machine", label: "Makine" },
      { key: "count", label: "Arıza Sayısı" },
      { key: "totalDowntime", label: "Toplam Duruş (dk)" },
      { key: "mttr", label: "MTTR (dk)" },
    ],
    rows: mk([
      { machine: "KYN-1", count: 3, totalDowntime: 180, mttr: 60 },
      { machine: "CNC-1", count: 1, totalDowntime: 30, mttr: 30 },
      { machine: "PRES-A", count: 1, totalDowntime: 45, mttr: 45 },
      { machine: "CNC-2", count: 1, totalDowntime: 20, mttr: 20 },
    ]),
  },
  "rapor-kalite": {
    title: "Kalite Raporu",
    description: "Kalite özet raporu (otomobil fabrikası demo)",
    columns: [
      { key: "period", label: "Dönem" },
      { key: "inspected", label: "Kontrol Edilen" },
      { key: "defects", label: "Hatalı" },
      { key: "ppm", label: "PPM" },
    ],
    rows: mk([
      { period: "2026-11-17", inspected: 500, defects: 6, ppm: 12000 },
      { period: "2026-11-16", inspected: 480, defects: 4, ppm: 8333 },
      { period: "2026-11-15", inspected: 420, defects: 3, ppm: 7143 },
    ]),
  },
  "kullanicilar": {
    title: "Kullanıcılar",
    description: "Sistem kullanıcıları (otomobil fabrikası demo)",
    columns: [
      { key: "username", label: "Kullanıcı Adı" },
      { key: "name", label: "Ad Soyad" },
      { key: "role", label: "Rol" },
      { key: "status", label: "Durum" },
    ],
    rows: mk([
      { username: "admin", name: "Yönetici", role: "Admin", status: "Aktif" },
      { username: "planlayici", name: "Planlayıcı", role: "Planlama", status: "Aktif" },
      { username: "operator1", name: "Operatör 1", role: "Operatör", status: "Aktif" },
      { username: "kalite1", name: "Kalite Kontrolör", role: "Kalite", status: "Aktif" },
    ]),
  },
  "yetkiler": {
    title: "Yetkiler",
    description: "Rol yetki matrisi (otomobil fabrikası demo)",
    columns: [
      { key: "role", label: "Rol" },
      { key: "module", label: "Modül" },
      { key: "read", label: "Okuma" },
      { key: "write", label: "Yazma" },
    ],
    rows: mk([
      { role: "Admin", module: "Tümü", read: "Evet", write: "Evet" },
      { role: "Planlama", module: "Üretim", read: "Evet", write: "Evet" },
      { role: "Operatör", module: "Üretim Girişi", read: "Evet", write: "Evet" },
      { role: "Kalite", module: "Kalite", read: "Evet", write: "Evet" },
      { role: "Depo", module: "Stok", read: "Evet", write: "Evet" },
    ]),
  },
};