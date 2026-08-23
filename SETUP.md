# BIMA UNGGUL — Setup & Development Guide

Sistem pemeringkatan mutu madrasah untuk Kantor Kementerian Agama Kabupaten Pasuruan.

## Tech Stack

- **Frontend**: React 19 + Vite 8 + React Router 7 + Tailwind CSS 4
- **Backend**: Express 5 + Node.js (ESM)
- **Database**: MySQL 8 (dev lokal via Laragon / aaPanel di produksi)
- **ORM**: Prisma 5 (type-safe queries, migrations ter-versioning)
- **Auth**: Custom auth — JWT (access + refresh token httpOnly cookie), bcrypt hashing
- **Charts**: ApexCharts (`react-apexcharts`, lazy-loaded per halaman)
- **Icons**: Phosphor Icons
- **Monorepo**: npm workspaces (root `package.json`)

## Prerequisites

- Node.js ≥ 20 (direkomendasikan 22 LTS)
- MySQL 8.0+
- PM2 (global, khusus produksi): `npm install -g pm2`
- Nginx (khusus produksi)

## Development Setup

### 1. Install Dependencies (workspaces — sekali di root)

```bash
npm install
```

Perintah ini otomatis meng-install dependensi `frontend/` dan `backend/` sekaligus dan membuat satu lockfile di root.

### 2. Configure Environment

Backend — copy dan edit `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` dengan konfigurasi lokal:

```env
DATABASE_URL="mysql://root:password@localhost:3306/bima_unggul"
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRY=15m              # opsional, default 15m
JWT_REFRESH_EXPIRY=7d       # opsional, default 7d
FRONTEND_URL=http://localhost:5173
```

> ⚠️ `DATABASE_URL`, `JWT_SECRET`, dan `JWT_REFRESH_SECRET` divalidasi saat boot oleh
> `backend/src/config/env.js` — jika kosong di mode production server menolak start.

Frontend tidak butuh `.env` untuk development: semua request `/api/*` diteruskan ke
backend lewat proxy Vite (`frontend/vite.config.js`). Untuk build produksi, set
`VITE_API_URL` (lihat `frontend/.env.example`).

### 3. Setup Database

Dari root (semua script workspaces):

```bash
# Prisma generate client
npx prisma generate -w backend

# Run migrations (membuat tabel di database)
npm run db:migrate

# Seed data awal (9 indikator master)
npm run db:seed

# Optional: Prisma Studio untuk visualisasi data
npm run db:studio
```

### 4. Run Development Servers

**Satu perintah dari root** (backend + frontend bersamaan):

```bash
npm run dev
```

Atau dua terminal terpisah:

```bash
npm run backend:dev   # Express, port 3000
npm run frontend:dev  # Vite, port 5173
```

Akses:
- Frontend: `http://localhost:5173`
- Backend Health: `http://localhost:3000/api/health`

> Catatan Windows: jika `npm.ps1` diblokir execution policy PowerShell, gunakan
> `npm.cmd`.

## Project Structure

```
bima-unggul/
├── package.json               # npm workspaces ("frontend", "backend") + script orkestrasi
├── scripts/
│   └── dev.js                 # orchestrator dev (backend + frontend bersamaan)
│
├── frontend/                  # React 19 + Vite 8 (SPA)
│   ├── src/
│   │   ├── main.jsx           # entry point
│   │   ├── App.jsx            # provider global (Auth, Toaster, DotPattern) + Suspense
│   │   ├── router.jsx         # route table per zona + lazy-load halaman
│   │   ├── pages/
│   │   │   ├── public/        # HomePage, Leaderboard, MadrasahDetail, Tentang
│   │   │   ├── auth/          # Login, Daftar
│   │   │   ├── operator/      # Dashboard, InputCapaian, RiwayatSubmission, ProfilMadrasah, HapusData
│   │   │   └── admin/         # Dashboard, AntreanValidasi, ManajemenPeriode, KonfigurasiBobot,
│   │   │                      #   ManajemenAkun, ExportLaporan, AuditLog
│   │   ├── components/        # dikelompokkan per zona: public/, operator/, admin/, auth/, shared/, ui/
│   │   ├── context/           # AuthContext, OperatorContext
│   │   ├── hooks/             # useRevealOnScroll, useMagnetic
│   │   ├── lib/               # api.js (fetch wrapper + auto-refresh), format.js, utils.js
│   │   └── constants/         # indikator.js
│   ├── .env.example           # VITE_API_URL (untuk build produksi)
│   ├── tailwind.config.js     # design tokens gaya Duolingo (eager/spark/ink/dst.)
│   └── vite.config.js         # proxy dev '/api' → backend
│
└── backend/                   # Express 5 + Node.js ESM (REST API)
    ├── src/
    │   ├── app.js             # Express app factory: middleware, mounting routes
    │   ├── server.js          # bootstrap saja (listen port) — dipakai PM2
    │   ├── config/env.js      # load dotenv + validasi env wajib saat boot
    │   ├── routes/            # auth.routes.js, public.routes.js, operator.routes.js,
    │   │                      #   notification.routes.js, admin.routes.js
    │   ├── controllers/       # handler HTTP tipis (auth, operator, public, notification,
    │   │                      #   admin/{account,bobot,deleteRequest,export,period,validation,auditLog})
    │   ├── services/          # business logic (auth, submission, validation, scoring,
    │   │                      #   period, bobot, account, export, audit, notification)
    │   ├── middlewares/       # authMiddleware (JWT), roleMiddleware (role gate)
    │   ├── constants/         # auth.constants.js (AUTH_CONFIG)
    │   ├── utils/             # httpError.js
    │   └── db/prisma.js       # singleton PrismaClient
    ├── prisma/
    │   ├── schema.prisma      # skema lengkap (10 model, 11 enum)
    │   ├── seed.js            # seed 9 indikator master
    │   └── migrations/        # migrations SQL (TER-VERSIONING di git)
    ├── scripts/               # utilitas dev: create-dummy-accounts, clean-dummy*, check-users,
    │                          #   smoke-dynamic-form
    ├── tests/                 # test ad-hoc tanpa framework: testScoring, testValidationE2E,
    │                          #   testPublicAndAdminE2E, TESTING_GUIDE(.js sumber + .md hasil)
    ├── ecosystem.config.js    # konfigurasi PM2 (produksi)
    ├── .env.example
    └── package.json
```

## Theme & Branding

Design system bergaya Duolingo (lihat `DESIGN.md` untuk spesifikasi lengkap).

### Colors (Tailwind tokens)

| Token | Nilai | Pemakaian |
|---|---|---|
| `eager` | `#58cc02` | aksi utama, CTA |
| `spark` | `#1cb0f6` | aksi sekunder, info |
| `ink` | `#000437` | teks judul |
| `charcoal` | `#4b4b4b` | teks body |
| `pencil` / `faded` | `#777777` / `#afafaf` | teks redup |
| `paper` | `#ffffff` | latar kartu |

Alias legacy `brand-navy`/`brand-teal` masih tersedia untuk komponen Operator/Admin lama.

### Typography

- **Display/Judul**: Nunito (700–900)
- **Body**: Nunito Sans (500–800)
- **Mono/data**: JetBrains Mono

### Icons

Gunakan Phosphor Icons (`phosphor-react`):

```jsx
import { MagnifyingGlass, User } from 'phosphor-react';

<MagnifyingGlass size={24} />
```

## Authentication Flow (Backend)

1. **Login** (`POST /api/auth/login`)
   - Input: `{ nip, password }`
   - Output: `{ accessToken, user }`; refresh token dikirim sebagai cookie httpOnly
   - Access token (15m), Refresh token (7d) — dioverride via `JWT_EXPIRY`/`JWT_REFRESH_EXPIRY`

2. **Refresh** (`POST /api/auth/refresh`)
   - Input: cookie httpOnly (credentials include)
   - Output: `{ accessToken }`
   - Frontend auto-refresh sekali pada 401 (single-flight) di `frontend/src/lib/api.js`

3. **Logout** (`POST /api/auth/logout`)
   - Menghapus cookie refresh token

### Middleware Usage

```javascript
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

// Pola yang dipakai: pasang guard SEKALI per router (lihat admin.routes.js /
// operator.routes.js) — tidak diulang per route.
const router = express.Router();
router.use(authMiddleware, roleMiddleware(['operator']));

router.get('/madrasah', controller.getMadrasah);
```

## Production Deployment

### Build Frontend

```bash
npm run build          # atau: npm run frontend:build
# Output: frontend/dist/ untuk di-serve Nginx
# Set VITE_API_URL=<url-backend-publik> saat build bila API tidak di belakang domain sama
```

### Run Backend with PM2

```bash
cd backend
pm2 start ecosystem.config.js --env production
pm2 monit
pm2 logs bima-unggul-backend
```

### Nginx Configuration (Reverse Proxy)

```nginx
upstream backend {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name bima-unggul.example.com;

  # Serve React static files
  location / {
    root /var/www/bima-unggul/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # Proxy API requests to Express
  location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Database Migrations

Setelah edit `prisma/schema.prisma`:

```bash
npm run db:migrate
# Follow prompts untuk beri nama migration
# Prisma auto-generate SQL dan apply ke database
```

Rollback migration (development only):

```bash
ls backend/prisma/migrations/

npx prisma migrate resolve --rolled-back <migration-name>
```

## Testing & Utilitas Dev

Test saat ini berupa skrip mandiri (tanpa test runner); butuh database aktif:

```bash
npm run test -w backend          # testScoring (skenario skor + tie-breaker)
npm run test:validation -w backend   # E2E validasi (submit→approve/reject/revoke→skor)
npm run test:e2e -w backend      # E2E endpoint publik/admin
npm run smoke:dynamic-form -w backend  # smoke test form dinamis indikator
npm run dummy:create -w backend  # buat akun dummy (admin/operator)
npm run dummy:clean -w backend   # purge data dummy/test
```

Panduan lengkap alur testing manual: `backend/tests/TESTING_GUIDE.md`.

## Troubleshooting

### Port Sudah Dipakai

Ubah `PORT` di `.env` backend atau kill proses:

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Error

Pastikan:
- MySQL running (Laragon: Start All / menu MySQL; aaPanel di produksi)
- `DATABASE_URL` benar di `.env`
- User & password sudah valid

Endpoint publik akan membalas 500 dengan log `Can't reach database server` bila MySQL mati.

### Prisma Client Error

```bash
npx prisma generate -w backend
```

---

**Last Updated**: 2026-08-23
