# Catatan — Roadmap Pengembangan BIMA UNGGUL

> Dibuat: 2026-08-23, pasca-restrukturisasi struktur project (npm workspaces).
> Urutan = prioritas rekomendasi. Kerjakan satu per satu dari atas.

## 1. ✅ SELESAI (2026-08-25): Hardening Keamanan Backend
**Dikerjakan:**
- `helmet` aktif di `backend/src/app.js` (13 security headers, `X-Powered-By` hilang)
- `express-rate-limit` di `/api/auth/login`: maks 5 percobaan GAGAL / 15 menit / IP
  (`skipSuccessfulRequests: true`, limiter dipasang SEBELUM authRoutes — urutan penting!)
- Terverifikasi via curl: 429 + header RateLimit-* muncul pada percobaan ke-6; CORS tidak rusak.

**Sisa (opsional, produksi):**
- Audit cookie refresh `sameSite: 'strict'` vs cross-domain saat deploy (Nginx/aaPanel)
- Pastikan `JWT_SECRET` & `JWT_REFRESH_SECRET` di-set di `.env` produksi (fallback dev masih ada)

## 2. ✅ SELESAI (2026-08-25): Error Boundary untuk Lazy Routes
**Dikerjakan:**
- `frontend/src/components/RouteErrorBoundary.jsx` baru: tangkap ChunkLoadError + error render, tombol retry/muat-ulang.
- `frontend/src/router.jsx`: semua route lazy (publik/operator/admin) dibungkus `<Zone>` = ErrorBoundary + Suspense fallback "Memuat halaman...".

## 3. ✅ SELESAI (2026-08-25): Tooling Kualitas Kode
**Dikerjakan:**
- ESLint 9 flat config per workspace (`eslint.config.js`): frontend = browser globals + JSX + eslint-plugin-react-hooks; backend = node globals.
- Script `npm run lint` di root & kedua workspace. Prettier `.prettierrc` bersama (husky pre-commit: belum, opsional).
- Semua error lama dibereskan (cause-chain authService, no-empty catch, useless escape). Sisa 59 warning terdokumentasi — utang refactor bertahap.

## 4. ✅ SELESAI (2026-08-25): Test Infrastructure Nyata
**Dikerjakan:**
- Vitest di kedua workspace; supertest untuk API backend (request langsung ke `app`, tanpa port).
- Backend: unit (`deriveStatus`, `HttpError`) + integrasi (health/helmet/login/admin API). Kredensial dari env `BACKEND_TEST_*`, auto-skip bila kosong.
- Frontend: happy-dom + Testing Library; contoh test `RouteErrorBoundary`.
- `npm test` (root) menjalankan keduanya. Backend 10/10, frontend 2/2.
- Catatan: skrip ad-hoc lama di `backend/tests/` (testScoring dkk) tetap ada sebagai smoke script manual.

## 5. ✅ SELESAI (2026-08-25): Seed Data Demo
**Dikerjakan:**
- `backend/prisma/seed-demo.js`: script idempoten untuk seeding demo (9 indikator, periode aktif DEMO/2026, 6 madrasah demo dengan 6 kelompok, submission + validasi otomatis via API dummy admin).
- Leaderboard kini terisi dan valid untuk demo/testing.

---

## 6. ✅ SELESAI (2026-08-26): Code-Splitting ApexCharts
**Dikerjakan:**
- `frontend/src/components/shared/LazyChart.jsx` baru: wrapper `lazy(() => import('react-apexcharts'))` + Suspense fallback skeleton `animate-pulse` (hindari FOUC).
- `LeaderboardChart.jsx` & `IndikatorChart.jsx`: ganti `import Chart from 'react-apexcharts'` statis → `<LazyChart ...>` (props identik, pass-through). ApexCharts kini hanya didownload saat chart dirender.
- `vite.config.js`: coba `codeSplitting.groups` (Vite 8/Rolldown) tapi **dibuang** — malah memaksa preload apexcharts di entry. Biarkan Rolldown treat apexcharts sebagai dynamic chunk otomatis via `import()` di LazyChart.
- Verifikasi: `dist/index.html` TIDAK preload apexcharts (count=0); `index.js` entry tetap ~416 kB; chunk `react-apexcharts.esm` 935 kB (gzip 267 kB) jadi on-demand.
- Smoke test browser: `/leaderboard` & `/madrasah/:slug` render `.apexcharts-canvas` normal; skeleton muncul saat loading.
- Ref: Context7 `/vitejs/vite` migration (manualChunks deprecated → codeSplitting).

### Ditunda (bukan prioritas)
- **Upgrade Prisma 5 → 6/7**: tertinggal 2 major, ada breaking changes;
  kerjakan terpisah dari pengembangan fitur.
