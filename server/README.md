# MES-G Backend (Faz 3) — Kurulum

Bu klasör Render üzerinde çalışacak Node.js + PostgreSQL API'sidir. Frontend hâlâ statik sitede çalışır; API ayrı bir servistir.

## Yerel geliştirme

```bash
cd server
cp ../.env.example .env   # DATABASE_URL ve JWT_SECRET doldurun
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

API: http://localhost:4000/health

## Render kurulumu (kullanıcı adımları)

1. Render Dashboard → **New → PostgreSQL** → name `mes-g-db`, plan Free. `DATABASE_URL`'i kopyalayın.
2. Render Dashboard → **New → Web Service** → repo seçin, **Root Directory: `server`**, Build: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`, Start: `npm start`.
3. Env vars: `DATABASE_URL` (DB'den), `JWT_SECRET` (Generate), `CORS_ORIGIN` (frontend URL), `NODE_ENV=production`.
4. Frontend static site env var: `VITE_API_URL` = API URL (ör. https://mes-g-api.onrender.com). Render → Static Site → Environment → Add.
5. Redeploy frontend.

## Güvenlik notları
- Gizli anahtarlar (JWT_SECRET, DATABASE_URL) yalnızca Render env vars'ta; depoya konmaz.
- Frontend'de yalnızca `VITE_API_URL` (gizli değil) bulunur.
- Her tablo `tenantId` ile izole; JWT tenantId taşır.
- Tüm yazma işlemleri AuditLog'a kaydedilir.

## Geçiş (localStorage/Gist → DB)
- Mevcut demo verileri otomatik aktarılmaz. İlk kayıt için `/api/auth/register` ile tenant + admin oluşturun.
- Eski localStorage verileri için bir aktarım scripti (ileride) eklenecek; şu an demo modunda kalır.

## Mevcut yayın korunumu
- Statik site (`mes-g`) aynen kalır; API ayrı servis. Eski URL'ler çalışmaya devam eder.
- Frontend `VITE_API_URL` tanımlı değilse demo (localStorage) modunda çalışır.
