# Data Mock — ISOLATED (Zona 1–4 sudah bebas mock)

> Status: **2026-08-22** — Tidak ada satu pun file di folder ini yang di-import
> oleh halaman/komponen produksi. Folder ini dipertahankan sebagai referensi
> desain UI & seed data saja. **JANGAN meng-import file di folder ini dari
> Zona 1 (Publik), Zona 2 (Auth), Zona 3 (Operator), atau Zona 4 (Admin).**

## Verifikasi

```bash
# 1) tidak ada import mock di src/
grep -rE "from ['\"].*data/mock" src/   # harus kosong

# 2) bundle produksi bebas marker mock
npm run build
grep -rE "BMU-TEST|PUBADM|E2E-VAL|MI Negeri Bangil|mockOperator|MOCK_|SKOR_SEMENTARA|RANKING_MOCK|\(mock\)" dist/assets/
```

## Daftar file & pengganti real API-nya

| File mock | Dipakai dulu di | Pengganti real |
| --- | --- | --- |
| `mockLeaderboard.js` | Leaderboard publik, MadrasahDetail, ProfilMadrasah | `GET /api/leaderboard`, `GET /api/madrasah/:slug` (`src/lib/api.js` → `apiGet`) |
| `mockOperator.js` | Dashboard, TopBar, OperatorLayout, HapusData, ProfilMadrasah | `GET/PATCH /api/operator/madrasah`, `GET /api/notifications`, endpoint submission (lihat catatan) |
| `mockAdmin.js` | AdminDashboard, admin TopBar | `GET /api/admin/validasi`, `GET /api/admin/periode`, `GET /api/notifications` |
| `mockValidasi.js` | Antrian Validasi | `GET /api/admin/validasi?status=...` + approve/reject/revoke |
| `mockDeleteRequests.js` | DeleteRequests admin, HapusData operator | `GET /api/admin/delete-requests` (+ approve/reject); sisi operator: `POST /api/operator/submission-item/:id/request-delete` (**endpoint backend belum ada — Grup 4**) |
| `mockAkun.js` | Manajemen Akun | `GET/POST/PATCH /api/admin/akun` |
| `mockAuditLog.js` | Audit Log | `GET /api/admin/audit-log` |
| `mockBobot.js` | Konfigurasi Bobot | `GET/PATCH /api/admin/bobot` |
| `mockPeriode.js` | Manajemen Periode | `GET/POST/PATCH /api/admin/periode` + finalisasi/reopen |

## Konstanta yang BUKAN mock (boleh dipakai)

- `src/constants/indikator.js` — daftar 9 indikator mutu (PRD Section 11).
  Dipakai sebagai skeleton mapping; nilai skor selalu dari backend.

## Helper data nyata

- `src/lib/api.js` — `apiGet` (publik), `apiFetch` (auth Bearer).
- `src/lib/operatorData.js` — profil madrasah operator, skor/rank, notifikasi.

## Catatan endpoint yang belum ada di backend (halaman tetap degrade gracefully)

- `GET /api/operator/submission-item` (riwayat/statistik operator)
- `POST /api/operator/submission-item/:id/request-delete`
- `GET /api/operator/indikator`, draft/submit per indikator

Halaman terkait menampilkan empty state / toast error saat endpoint 404 —
tidak ada fallback ke mock.
