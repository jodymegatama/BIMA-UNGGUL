# BIMA UNGGUL — Bina Madrasah Unggul

Sistem Informasi Input, Validasi, dan Pemeringkatan Capaian Mutu Madrasah di lingkungan Kantor Kementerian Agama Kabupaten Pasuruan.

Dikelola oleh **Seksi Pendidikan Madrasah (Pendma) Kankemenag Kab. Pasuruan** untuk seluruh madrasah MI / MTs / MA (Negeri & Swasta).

Alur: **Input Operator → Validasi Admin → Skor Otomatis → Leaderboard Publik**

---

## Fitur Utama

- **3 Zona Role**: Publik (read-only), Operator Madrasah, Admin Pendma
- **9 Indikator Mutu** berbobot (konfigurasi per periode): diklat, penghargaan individu/institusi, prestasi siswa, lulus jenjang lanjutan, rapor >85, siswa lanjutan unggulan, giat inovatif, rasio penerimaan
- **6 Kelompok Pemeringkatan** terpisah: MI/MTs/MA × Negeri/Swasta — ranking + tie-breaker deterministik
- **Skor Live** — `Σ(capaian disetujui × bobot)` realtime tanpa cache, leaderboard update otomatis setelah approve/revoke/ubah bobot
- **Validasi Berjenjang** — approve / reject (alasan wajib) / revoke, antrian dengan filter status/madrasah/indikator/periode
- **Manajemen Periode** — lifecycle `belum_dimulai → aktif → cutoff → penyelesaian_validasi → finalisasi → arsip`, guard anti-overlap (1 periode aktif saja)
- **Ekspor Laporan** — PDF (pdfkit) & Excel (exceljs) per periode/kelompok
- **Audit Trail & Notifikasi** — log lengkap per aksi + notifikasi in-app
- **Dark / Light Mode** — toggle persisten di semua zona

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + Vite 8 + React Router 7 + Tailwind CSS 4 + ApexCharts + Phosphor Icons |
| Backend | Express 5 (ESM) + Prisma 5 + MySQL 8 |
| Auth | JWT (access 15m + refresh httpOnly cookie 7d) + bcrypt |
| Monorepo | npm workspaces (root `package.json`) |
| Deploy | Nginx (serve `dist` + proxy `/api`) + PM2 (backend) / Docker Compose |

## Struktur Project

```
bima-unggul/
├── package.json              # workspaces frontend + backend + script orkestrasi
├── backend/
│   ├── src/
│   │   ├── app.js            # Express app factory
│   │   ├── server.js         # bootstrap listen
│   │   ├── config/env.js    # validasi env wajib saat boot
│   │   ├── routes/           # auth, public, operator, admin, notification
│   │   ├── controllers/      # handler tipis
│   │   ├── services/         # business logic
│   │   └── middlewares/      # authMiddleware, roleMiddleware
│   ├── prisma/
│   │   ├── schema.prisma     # 10 model, 11 enum
│   │   ├── seed.js           # seed 9 indikator master
│   │   ├── seed-demo.js      # seed 39 madrasah demo Pasuruan (opsional, dev only)
│   │   └── migrations/       # ter-versioning
│   └── ecosystem.config.js   # PM2
└── frontend/
    ├── src/
    │   ├── App.jsx + router.jsx
    │   ├── pages/            # public / auth / operator / admin
    │   ├── components/       # per zona + shared/ui
    │   ├── context/          # AuthContext, OperatorContext
    │   ├── hooks/            # useTheme, useRevealOnScroll
    │   └── lib/api.js        # fetch wrapper + auto-refresh 401
    ├── vite.config.js        # proxy dev /api → backend
    └── tailwind.config.js
```

## Prasyarat

- Node.js ≥ 20 (rekomendasi 22 LTS)
- MySQL 8.0+
- NPM 10+

## Setup Lokal

### 1. Install

```bash
npm install   # dari root, install frontend + backend sekaligus
```

### 2. Environment

**Backend** — copy `backend/.env.example` → `backend/.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/bima_unggul"
PORT=3000
NODE_ENV=development
JWT_SECRET=isi_min_32_karakter_random
JWT_REFRESH_SECRET=isi_min_32_karakter_random_lain
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:5173
```

> `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` wajib — `env.js` menolak boot jika kosong di production.

**Frontend** — tidak butuh `.env` untuk dev (proxy Vite tangani `/api`). Untuk build produksi, set `frontend/.env.production`:

```env
VITE_API_URL=https://domain-anda/api
# kosong = same-origin (jika Nginx proxy /api ke backend di domain sama)
```

### 3. Database

```bash
npx prisma generate --schema=backend/prisma/schema.prisma
npm run db:migrate        # atau: npx prisma migrate dev --schema=backend/prisma/schema.prisma
npm run db:seed           # seed 9 indikator master (wajib)
# opsional dev:
node backend/prisma/seed-demo.js   # 39 madrasah demo Pasuruan → periode 2026/2027 (jangan di produksi)
```

Buat admin pertama (via seed atau register lalu approve di DB).

### 4. Jalankan Dev

```bash
npm run dev               # backend (3000) + frontend (5173) bersamaan
# atau terpisah:
npm run backend:dev
npm run frontend:dev
```

- Frontend: http://localhost:5173
- Backend health: http://localhost:3000/api/health
- API base: http://localhost:3000/api

## Script Penting

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | dev backend+frontend |
| `npm run build` | build frontend → `frontend/dist` |
| `npm run lint` | ESLint kedua workspace |
| `npm test` | Vitest (backend + frontend) |
| `npx prisma studio --schema=backend/prisma/schema.prisma` | GUI DB |
| `node backend/prisma/seed-demo.js` | seed demo 39 madrasah (dev only) |

## Deploy Produksi

### Opsi A — aaPanel + Nginx + PM2 (direkomendasikan)

1. Build frontend: `npm run build` → upload `frontend/dist` ke `/www/wwwroot/bima-unggul/dist`
2. Upload `backend/` ke `/www/wwwroot/bima-unggul/backend`, `npm install --omit=dev`, set `backend/.env` production
3. `npx prisma migrate deploy --schema=backend/prisma/schema.prisma`
4. `pm2 start backend/ecosystem.config.js --env production && pm2 save`
5. Nginx: serve `dist` + `location /api/ { proxy_pass http://127.0.0.1:3000; }` + SSL Let's Encrypt

### Opsi B — Docker Compose

Lihat `.hermes/plans/` (tidak ter-push) atau buat `docker-compose.yml` dengan service `mysql:8`, `backend` (node:20-slim), `frontend` (nginx:alpine).

### Environment Produksi

- `NODE_ENV=production`
- `DATABASE_URL` ke MySQL aaPanel (jangan expose port publik)
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate baru, jangan pakai default
- `FRONTEND_URL` = domain publik
- `VITE_API_URL=""` jika single-domain proxy

## API Ringkas

`POST /api/auth/login` `POST /api/auth/refresh` `POST /api/auth/logout` `GET /api/leaderboard` `GET /api/madrasah/:slug` `GET/PATCH /api/operator/*` `GET/POST /api/admin/*` `GET /api/notifications`

Auth: `Authorization: Bearer <accessToken>` + refresh via httpOnly cookie, auto-refresh di `lib/api.js`.

## Autentikasi

- **Operator Madrasah**: daftar via `/daftar` (nama, **email**, telepon, password, data madrasah) → approve Admin → login pakai **email + password**.
- **Admin Seksi Pendma**: dibuat via Manajemen Akun (NIP wajib) → login pakai **NIP + password**.
- `User.nip` nullable: hanya admin yang ber-NIP. Operator lama dimigrasi otomatis ke email legacy `<nip>@operator.legacy.local` (migrasi `operator_email_login`); ganti ke email asli via Manajemen Akun atau script `backend/scripts/backfill-operator-emails.mjs` (--list / --map mapping.json / --verify) yang dijalankan SEBELUM migrasi.

## Lisensi

Internal — Kantor Kementerian Agama Kabupaten Pasuruan. Tidak untuk distribusi publik tanpa izin.
