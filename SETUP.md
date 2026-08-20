# BIMA UNGGUL — Setup & Development Guide

Sistem pemeringkatan mutu madrasah untuk Kantor Kementerian Agama Kabupaten Pasuruan.

## Tech Stack

- **Frontend**: React 18 + Vite + React Router + Tailwind CSS 4
- **Backend**: Express.js + Node.js
- **Database**: MySQL (via aaPanel)
- **ORM**: Prisma (type-safe queries, clean migrations)
- **Auth**: Custom auth — JWT (access + refresh tokens), bcrypt hashing
- **Charts**: ApexCharts
- **Icons**: Phosphor Icons
- **Styling**: Plus Jakarta Sans (body/heading), JetBrains Mono (data/code)
- **Process Manager**: PM2 (cluster mode)
- **Web Server**: Nginx (reverse proxy)

## Prerequisites

- Node.js ≥ 16.x
- npm or yarn
- MySQL 8.0+
- PM2 (global): `npm install -g pm2`
- Nginx (for production)

## Development Setup

### 1. Clone & Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure Environment

Backend — copy dan edit `.env.example`:

```bash
cd backend
cp .env.example .env
```

Edit `.env` dengan konfigurasi lokal:

```env
DATABASE_URL="mysql://root:password@localhost:3306/bima_unggul"
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
FRONTEND_URL=http://localhost:5173
```

### 3. Setup Database

```bash
# Prisma generate client
npm run prisma:generate

# Run migrations (akan membuat tabel di database)
npm run prisma:migrate

# Optional: Buka Prisma Studio untuk visualisasi data
npm run prisma:studio
```

### 4. Run Development Servers

**Terminal 1 — Frontend (Vite, port 5173)**:

```bash
cd frontend
npm run dev
```

**Terminal 2 — Backend (Express, port 3000)**:

```bash
cd backend
npm run dev
```

Akses:
- Frontend: `http://localhost:5173`
- Backend Health: `http://localhost:3000/api/health`

## Project Structure

```
bima-unggul/
├── frontend/
│   ├── src/
│   │   ├── pages/       (public, operator, admin)
│   │   ├── layouts/     (OperatorLayout, AdminLayout)
│   │   ├── components/  (Reusable components)
│   │   ├── services/    (API calls)
│   │   ├── App.jsx      (React Router setup)
│   │   └── index.css    (Tailwind + global styles)
│   ├── tailwind.config.js    (brand colors & fonts)
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── dist/            (production build ready)
│
├── backend/
│   ├── src/
│   │   ├── routes/      (API endpoints)
│   │   ├── controllers/ (request handlers)
│   │   ├── services/    (business logic)
│   │   ├── middleware/  (auth, role checks)
│   │   ├── models/      (data models)
│   │   └── server.js    (Express entry)
│   ├── prisma/
│   │   ├── schema.prisma    (User model skeleton)
│   │   └── migrations/      (auto-generated migrations)
│   ├── ecosystem.config.js  (PM2 config)
│   ├── .env.example
│   └── package.json
│
├── SETUP.md
├── .gitignore
└── package.json
```

## Theme & Branding

### Colors (Tailwind tokens)

- **Navy**: `#04437A` — primary action, headers
- **Teal**: `#0EAC95` — secondary action, highlights
- **Dark Neutral**: `#2D3748` — body text
- **Light Neutral**: `#F7FAFC` — backgrounds, borders

Access in components: `bg-brand-navy`, `text-brand-teal`, etc.

### Typography

- **Body/Headings**: Plus Jakarta Sans (Google Fonts)
- **Data/Code**: JetBrains Mono (monospace numbers, tables)

### Icons

Gunakan Phosphor Icons (`phosphor-react`):

```jsx
import { MagnifyingGlass, User } from 'phosphor-react';

<MagnifyingGlass size={24} />
```

## Authentication Flow (Backend)

1. **Login** (`POST /api/auth/login`)
   - Input: `{ nip, password }`
   - Output: `{ accessToken, refreshToken, user: { id, nip, name, role } }`
   - Access token (15m), Refresh token (7d)

2. **Refresh** (`POST /api/auth/refresh`)
   - Input: `{ refreshToken }`
   - Output: `{ accessToken }`

3. **Logout** (`POST /api/auth/logout`)
   - Clears session/blacklist (jika diperlukan di Phase 2)

### Middleware Usage

```javascript
import { authMiddleware, roleMiddleware } from './middleware/authMiddleware.js';

// Protected route — auth required
router.get('/operator/data', authMiddleware, operatorController.getData);

// Protected route — admin only
router.post('/admin/users', 
  authMiddleware, 
  roleMiddleware(['admin']), 
  adminController.createUser
);
```

## Production Deployment

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

### Build Frontend

```bash
cd frontend
npm run build
# Output: dist/ folder untuk di-serve via Nginx
```

### Run Backend with PM2

```bash
cd backend
# Start
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs bima-unggul-backend
```

## Database Migrations

Setelah edit `prisma/schema.prisma`:

```bash
npm run prisma:migrate
# Follow prompts untuk beri nama migration
# Prisma auto-generate SQL dan apply ke database
```

Rollback migration (development only):

```bash
# Check available migrations
ls prisma/migrations/

# Resolve conflicts jika ada, lalu reset
npx prisma migrate resolve --rolled-back <migration-name>
```

## Troubleshooting

### Port Sudah Dipakai

Ubah `PORT` di `.env` backend atau kill proses:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Database Connection Error

Pastikan:
- MySQL running
- `DATABASE_URL` benar di `.env`
- User & password sudah valid

```bash
# Test koneksi
mysql -u root -p -h localhost
```

### Prisma Client Error

```bash
npm run prisma:generate
```

## Next Steps (Phase 2+)

- **Phase 2**: Setup frontend components & auth UI
- **Phase 3**: Database schema lengkap (Madrasah, Penilaian, Scoring)
- **Phase 4**: Backend logic (ranking, aggregation, validation)
- **Phase 5**: Integration testing & optimization

---

**Last Updated**: 2026-08-20
