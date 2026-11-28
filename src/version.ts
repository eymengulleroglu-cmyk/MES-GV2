/**
 * MES-G Sürüm Bilgisi
 * --------------------
 * Her güncellemede bu dosya güncellenir:
 *  - Büyük özellik  -> ortadaki sayı artar  (1.2.0 -> 1.3.0)
 *  - Küçük düzeltme -> son sayı artar       (1.2.0 -> 1.2.1)
 *  - Büyük yeniden yazım -> ilk sayı artar  (1.2.0 -> 2.0.0)
 */

export const APP_VERSION = "1.9.8";

export interface Release {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const CHANGELOG: Release[] = [
  {
    version: "1.9.8",
    date: "28.11.2026",
    title: "Kurumsal Menü Rengi ve Odak Düzeltmesi",
    items: [
      "Sol menü grupları artık ince renk çubuğu, grup noktası ve aktif öğe rengiyle net ayrılıyor; neon/glow efekti kaldırıldı.",
      "Açık/koyu tema için ayrı --accent-foreground tanımlandı; mavi birincil düğmeler ve aktif öğeler tutarlı kontrast kullanıyor.",
      "Mobil çekmece tüm menü gruplarını içeriyor; Escape/arka plan kapatma ve klavye odağı düzenlendi.",
    ],
  },
  {
    version: "1.9.7",
    date: "28.11.2026",
    title: "Sol Menü Renk Ayrımı (Kurumsal)",
    items: [
      "Menü grup başlıkları ve aktif öğeler kurumsal palet renkleriyle (mavi, teal, mor, amber, yeşil, gri) kodlandı.",
      "Her grubun sol kenar çizgisi ve aktif öğe arka planı grup rengini taşır; aktif yazı beyaz.",
      "Renkler parlak/neon değil, kurumsal ve WCAG AA kontrastına uygun.",
    ],
  },
  {
    version: "1.9.6",
    date: "28.11.2026",
    title: "Tablo Arama ve Pano Bilgisi",
    items: [
      "Genel modül tablolarına arama kutusu eklendi (tüm alanlarda filtreleme).",
      "Pano başlığına veri kaynağı (demo) ve son güncelleme zamanı eklendi.",
    ],
  },
  {
    version: "1.9.5",
    date: "28.11.2026",
    title: "Erişilebilirlik ve Pano İyileştirme",
    items: [
      "Pano (Dashboard) üstündeki büyük logo kaldırıldı; sayfa başlığı ve KPI'lar ana odak.",
      "Onay penceresine role=\"dialog\", aria-modal, odak yönetimi ve görünür kayıt adı eklendi.",
      "Tablo başlıkları klavye ile çalıştırılabilir; aria-sort ve yön göstergesi eklendi.",
      "Düzenle/Sil düğmelerine erişilebilir ad (aria-label) verildi.",
    ],
  },
  {
    version: "1.9.4",
    date: "28.11.2026",
    title: "Backend Güvenlik ve Migration",
    items: [
      "Açık admin kaydı kaldırıldı; ilk yönetici tek kullanımlık SETUP_TOKEN ile oluşturulur.",
      "İstek gövdeleri Zod ile doğrulanır; sadece izin verilen alanlar güncellenir (mass assignment engeli).",
      "CORS güvenli varsayılan (origin belirtilmemişse kapalı), auth rotalarında hız sınırlama.",
      "Başlangıç Prisma migration'ı (migration.sql + lock) eklendi.",
    ],
  },
  {
    version: "1.9.3",
    date: "28.11.2026",
    title: "Rol Kilitlenmesi Düzeltmesi",
    items: [
      "Alt bilgide rol seçici eklendi — her rolde Ayarlar'a erişim olmadan rol değiştirilebilir.",
      "Kalite/operatör rolüne geçildiğinde menü daralır ama rol seçici her zaman görünür kalır.",
    ],
  },
  {
    version: "1.9.2",
    date: "28.11.2026",
    title: "Demo Etiketleri Kaldırıldı",
    items: [
      "'TASLAK / DEMO' ve 'DEMO SİMÜLASYONU' etiketleri kaldırıldı.",
      "Modül başlıkları ve simülasyon ekranı kurumsal görünümde.",
    ],
  },
  {
    version: "1.9.1",
    date: "28.11.2026",
    title: "Prompt Uyumu: Menü Renkleri, Doğrulama, Demo Etiketleri, README",
    items: [
      "Sol menüde her gruba farklı parlak renk verme kuralına uyuldu — tek kurumsal vurgu rengi kullanılıyor.",
      "Modül formlarında zorunlu alan işareti (*) ve istemci tarafı doğrulama + hata mesajı eklendi.",
      "Genel CRUD modülleri 'TASLAK / DEMO' etiketiyle işaretlendi.",
      "Planlama ekranına 'sonlu kapasite planlama değildir' notu eklendi.",
      "Ayarlar'a entegrasyon durumu kartı (PLC/SCADA/ERP: planlandı/desteklenmiyor) eklendi.",
      "OEE ve SPC modül açıklamalarına 'örnek değerler' notu eklendi.",
      "README güncel gerçek duruma göre yeniden yazıldı.",
    ],
  },
  {
    version: "1.9.0",
    date: "28.11.2026",
    title: "Rol Bazlı Menü ve Denetim Kaydı",
    items: [
      "Ayarlar'da rol seçimi (Yönetici/Planlama/Operatör/Bakım/Kalite) — menü görünürlüğü role göre filtrelenir.",
      "Denetim Kaydı modülü: ekleme/değiştirme/silme işlemleri rol ve zaman damgasıyla kaydedilir.",
      "Rol değişikliği anında menüyü günceller (sayfa yenileme gerekmez).",
    ],
  },
  {
    version: "1.8.3",
    date: "28.11.2026",
    title: "Açılış Animasyonu İyileştirme",
    items: [
      "Logo büyütüldü (300px) ve float + glow animasyonu eklendi.",
      "Üç katman pulse halka, gradient arka plan, daha büyük ve yumuşak geçişli ilerleme çubuğu.",
      "MES-G başlığı ve alt başlık staggered slide ile beliriyor.",
    ],
  },
  {
    version: "1.8.2",
    date: "28.11.2026",
    title: "Açılış Animasyonu",
    items: [
      "Splash ekranı yenilendi: gradient arka plan, pulse halkalar, fade/slide animasyonlar, ilerleme çubuğu.",
      "1.9 sn'de otomatik kapanır; tıklayarak atlanabilir.",
    ],
  },
  {
    version: "1.8.1",
    date: "28.11.2026",
    title: "Ayarlar: Bağlantı Modu ve Yedekleme",
    items: [
      "Ayarlar'a Bağlantı Modu kartı eklendi (Demo/API).",
      "Yedekleme / Geri Yükleme: tüm yerel verileri JSON indirme ve geri yükleme.",
      "Senkronizasyon kapatma ve veri sıfırlama artık uygulama içi onay penceresi kullanıyor.",
    ],
  },
  {
    version: "1.8.0",
    date: "28.11.2026",
    title: "Backend ve Güvenlik (Faz 3) — İskelet",
    items: [
      "server/ klasöründe Express + Prisma + PostgreSQL API iskeleti eklendi (auth, iş emri CRUD, tenant izolasyonu, denetim kaydı).",
      "render.yaml'a mes-g-api web servisi ve mes-g-db PostgreSQL veritabanı eklendi; mevcut statik site korundu.",
      ".env.example ile gerekli değişkenler dokümante edildi (gizli değerler depoya konmadı).",
      "Frontend VITE_API_URL ile API moduna geçebilir; tanımlı değilse demo (localStorage) modunda çalışır.",
      "server/README.md ile Render kurulum adımları ve geçiş planı yazıldı.",
    ],
  },
  {
    version: "1.7.0",
    date: "28.11.2026",
    title: "Veri Modeli ve İş Akışı (Faz 2)",
    items: [
      "İş emri oluşturmada makine çakışması engellendi; hedef adet ve zorunlu alanlar doğrulanır.",
      "Planlama sipariş durumunu ve oluşturulan iş emri numarasını sipariş kaydına yazar (sipariş → iş emri bağlantısı).",
      "Kalite Ölçüm Kayıtları modülü eklendi (ürün/lot/iş emri/makine/operatör/özellik/değer/sonuç/tarih).",
      "Stok Hareketleri modülü eklendi (giriş/çıkış/rezervasyon/düzeltme, birim, depo, lot, referans).",
      "Duruş & Fire ekranında fire oranı ve duruş süresi formülü açıkça gösterilir.",
    ],
  },
  {
    version: "1.6.0",
    date: "28.11.2026",
    title: "Kurumsal Tasarım & Kalite Temeli (Faz 1)",
    items: [
      "Renk paleti kurumsal mavi/teal sisteme geçirildi (#2563EB/#0F766E); açık/koyu tema tutarlı.",
      "Mobil hamburger menü eklendi — tüm sayfalara küçük ekrandan erişim.",
      "Açılış ekranı 1.2 sn'ye kısaltıldı ve tıklayarak atlanabilir.",
      "404 sayfası eklendi; bilinmeyen rotalar buraya düşer.",
      "Silme işlemleri uygulama içi onay penceresine (kayıt adı gösterilir) taşındı — tarayıcı confirm() kaldırıldı.",
      "Modül formlarında placeholder yerine görünür etiketler.",
      "Üretim Simülasyonu 'DEMO SİMÜLASYONU' olarak etiketlendi.",
      "Alt bilgi kişisel imzadan kurumsal 'MES-G · Üretim Yürütme Sistemi' markasına dönüştürüldü; Ford Otosan referansı nötrleştirildi.",
      "Kullanılmayan Vite başlangıç dosyaları (App.tsx, App.css, vite/react/hero.svg) temizlendi.",
    ],
  },
  {
    version: "1.5.4",
    date: "28.11.2026",
    title: "Sol Menü Yeniden Düzenleme",
    items: [
      "Sol menü gruplandırıldı: Planlama, Üretim, Canlı İzleme, Makine, Kalite, Stok, İzlenebilirlik, Raporlar, Yönetim.",
      "Her grup ve bölüm kendi rengiyle kodlandı; aktif öğe grubun rengiyle vurgulanır, sol kenar çizgisi grup rengini taşır.",
      "Üretim grubu artık 4 öğe (İş Emirleri, Üretim Girişi, Üretim Takibi, Vardiya Planı) — daha okunabilir.",
    ],
  },
  {
    version: "1.5.3",
    date: "28.11.2026",
    title: "Müşteriler Modülü + Pano Grafik İyileştirme",
    items: [
      "Müşteriler modülü eklendi (/yonetim/musteriler): müşteri kartları, Siparişler formunda müşteri kayıtlı listeden seçilir.",
      "Pano (Dashboard) grafikleri yenilendi: gradient çubuklar, durum dağılımı donut (legend'lı), yeni Makine OEE ve Duruş Pareto widget'ları.",
      "Andon panosu ProManage kokpiti tarzı OEE ve duruş Pareto grafikleri içerir.",
    ],
  },
  {
    version: "1.5.2",
    date: "28.11.2026",
    title: "Tüm Modüllerde Kayıtlı Veri Seçimi",
    items: [
      "ModuleCrud'da tüm modül formları akıllı hale geldi: durum/öncelik/önem/aktiflik açılır liste; makine, ürün, operatör, müşteri, arıza/fire nedeni kayıtlı verilerden seçilir.",
      "Sayısal alanlar number, tarih alanları date input olarak render edilir.",
      "Yeni kayıt eklerken artık metin yazmak yerine kayıtlı verilerden seçim yapılır (fabrika sistemi gibi).",
    ],
  },
  {
    version: "1.5.1",
    date: "28.11.2026",
    title: "Andon ProManage Kokpiti + İş Emri Ürün Seçimi",
    items: [
      "Andon panosuna ProManage tarzı kokpit grafikleri eklendi: makine OEE çubuk grafik ve duruş Pareto (yatay çubuk).",
      "İş Emirleri formunda ürün artık kayıtlı Ürünler listesinden seçilir (kod + ad), ürün kodu otomatik atanır.",
      "Global arama artık yeni sayfaları (Andon, Alarm, Planlama, Kayıp Analizi, İzlenebilirlik Sorgu) bulur.",
    ],
  },
  {
    version: "1.5.0",
    date: "28.11.2026",
    title: "ProManage Seviyesi: Andon, Alarm, Planlama",
    items: [
      "Andon Canlı Pano: makine durumları (yeşil/sarı/kırmızı), OEE, aktif vardiya, alarmlar ve olaylar 2 sn'de bir tazelenir — büyük ekran/TV için ideal.",
      "Olay & Alarm Merkezi: Alarm Kuralları modülündeki eşikler canlı verilere karşı değerlendirilir; onayla/tümünü onayla, sidebar'da kırmızı rozet.",
      "Alarm Kuralları modülü: düşük OEE, kritik stok, uzun arıza, SPC, geçmiş sipariş, yüksek fire — 6 kural ile hazır.",
      "Üretim Planlama: açık siparişlerden tek tıkla iş emri, termin riski rozetleri, makine önerisi, makine yükü ve bitiş tahmini.",
      "Vardiya Planı modülü: 3 vardiya tanımı; Andon ve Planlama aktif vardiyayı otomatik gösterir (gece yarısını aşan aralık dahil).",
      "Kayıp Analizi: duruş ve fire Pareto (kümülatif %80 çizgisi), OEE kayıp kırılımı ve kurallara dayalı otomatik öneriler.",
      "İzlenebilirlik Sorgu: lot/seri no ile ileri-geri izleme — hammadde → makine → operatör → kalite → duruş → müşteri siparişi.",
      "Lot kayıtlarına iş emri alanı eklendi; Lot Takibi modülünde iş emri sütunu görünür.",
    ],
  },
  {
    version: "1.4.1",
    date: "27.11.2026",
    title: "Simülasyon: Kilitlenme Düzeltmesi",
    items: [
      "Hiçbir emir üretimde değilken simülasyonun boşta kalması düzeltildi — sıradaki bekleyen emir otomatik başlar.",
      "Son emir “Bekliyor” durumunda takılı kalmıyordu; artık “Planlandı” ve “Bekliyor” emirler otomatik başlatılır.",
      "Bir alt sistem hatası olursa simülasyon durmaz; hata olay akışında görünür ve sonraki tikte tekrar denenir.",
    ],
  },
  {
    version: "1.4.0",
    date: "27.11.2026",
    title: "Simülasyon: Tüm Modüller Bağlandı",
    items: [
      "Stok akışı: üretim hammaddeleri tüketir, yarı mamul biriktirir, emir bitince mamule dönüşür.",
      "Hammadde tükenirse üretim durur; ~90 sn sonra sevkiyat olayıyla stok yenilenir.",
      "Müşteri siparişleri mamul stoğu hazır olunca otomatik olarak hazırlanır.",
      "Üretim Girişi: 100 adette bir operatör kaydı açılır (Yetkiler matrisine göre operatör seçilir).",
      "Kalite kontrolü: Kontrol Parametreleri limitleriyle rastgele ölçüm; sınır dışı → fire + SPC kartı uyarısı.",
      "Bakım Planları: periyot dolunca makine planlı bakıma girer (Arıza'dan farklı durum).",
      "OEE modülü arıza ve fire olaylarıyla canlı hesaplanır.",
      "Lot Takibi ve Seri No: emir tamamlanınca lot/SN oluşur, ~30 sn sonra kalite onayı alınır.",
      "4 rapor (Üretim/Verimlilik/Arıza/Kalite) İş Emirleri ve Duruş & Fire verisinden canlı hesaplanır.",
      "Tüm emirler bitince otomatik yeni vardiya başlar; simülasyon sayfasına stok, sipariş, OEE panelleri eklendi.",
    ],
  },
  {
    version: "1.3.0",
    date: "27.11.2026",
    title: "Canlı Üretim Simülasyonu",
    items: [
      "Pano'daki “Üretime Başla” ile fabrika normal üretim hızında canlı simülasyona başlar (1x/2x/4x hız).",
      "Simülasyon uygulamanın kendi verilerini kullanır: Üretim Takibi, İş Emirleri, Arıza Nedenleri, Hata Türleri, Makine Listesi.",
      "Rastgele arıza olayları Duruş & Fire'a yazılır; makine “Duruş”a geçer, onarım bitince üretime döner.",
      "Rastgele fire olayları Duruş & Fire'a işlenir; emirler hedefe ulaşınca tamamlanır ve sıradaki başlar.",
      "Pano KPI'ları, İş Emirleri ve Duruş & Fire sayfaları saniyede bir canlı güncellenir.",
      "Global arama artık modüllere sonradan eklenen kayıtları da bulur (canlı veri).",
    ],
  },
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
