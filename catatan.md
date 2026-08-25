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

## 4. Test Infrastructure Nyata
**Masalah:** 3 skrip test ad-hoc di `backend/tests/` (testScoring,
testValidationE2E, testPublicAndAdminE2E) masih console.log tanpa assertion,
tidak bisa jalan otomatis di CI.
**Solusi:** migrasi ke Vitest (+ supertest untuk API). Butuh DB test terpisah
atau strategi reset data.

## 5. Seed Data Demo
**Masalah:** DB kosong (leaderboard 0 baris) — sulit development & demo stakeholder.
**Solusi:** perluas `backend/prisma/seed.js`: seed madrasah contoh (6 kelompok:
MI/MTs/MA × Negeri/Swasta) + submission capaian + periode aktif.
Alternatif cepat: gunakan `npm run dummy:create` + buat data lewat API.

---
### Ditunda (bukan prioritas)
- **Upgrade Prisma 5 → 6/7**: tertinggal 2 major, ada breaking changes;
  kerjakan terpisah dari pengembangan fitur.
