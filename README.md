# MES-G — Üretim Yürütme Sistemi (MES)

Küçük ve orta ölçekli imalat işletmeleri için üretim yürütme sistemi (MES) prototipi. Render üzerinde yayımlanır.

## Teknoloji
- Frontend: React + TypeScript + Vite + Tailwind CSS (açık/koyu tema)
- React Router, React Query, Recharts
- Backend (Faz 3 iskeleti): Node.js + Express + Prisma + PostgreSQL (`server/`)

## Çalıştırma (frontend)
```bash
npm install
npm run dev
```
Üretim derlemesi:
```bash
npm run build
```

## Backend (isteğe bağlı)
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
Detaylar: `server/README.md`. Render kurulumu için `render.yaml` ve `.env.example` dosyalarına bakın.

## Modüller
- Üretim: Planlama, Siparişler, Ürünler, Müşteriler, İş Emirleri, Üretim Girişi, Üretim Takibi, Vardiya Planı, Üretim Simülasyonu (Demo), Andon Panosu, Olay & Alarm Merkezi
- Makine: İş Merkezleri, Makine Listesi, Arıza Nedenleri, Bakım Planları, OEE, Duruş & Fire
- Kalite: Kontrol Parametreleri, Kalite Ölçüm Kayıtları, Hata Türleri, SPC
- Stok: Hammadde, Stok Hareketleri, Yarı Mamul, Mamul
- İzlenebilirlik: Lot Takibi, Seri No Takibi, İzlenebilirlik Sorgu
- Raporlar: Üretim, Verimlilik, Arıza, Kalite, Kayıp Analizi
- Yönetim: Kullanıcılar, Müşteriler, Denetim Kaydı, Yetkiler, Alarm Kuralları, Sistem Ayarları, Kullanım Talimatı

## Demo verisi
Tüm veriler sentetik demodur. Simülasyon kayıtları "DEMO SİMÜLASYONU" olarak etiketlenir. Ayarlar ekranından sıfırlanabilir (onaylı). Gerçek müşteri/tedarikçi verisi kullanılmaz.

## Render
- Statik frontend: `npm install && npm run build`, yayın klasörü `./dist`, SPA rewrite `/* → /index.html`.
- API (Faz 3): ayrı web servisi (`server/`), PostgreSQL veritabanı. Gizli anahtarlar Render env vars'ta (`.env.example`).
- Gizli anahtarlar frontend koduna konmaz.