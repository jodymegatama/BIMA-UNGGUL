# QA Report — BIMA UNGGUL (30 Agustus 2026)

**Scope:** Full suite — Publik (4 halaman + interaksi), Operator (6 area), Admin (8 halaman) di `localhost:5173` + API `localhost:3000`.

**Skills:** `dogfood` (5-phase QA) + `authenticated-web-qa` (route mapping, token bypass, empty-state vs API verification).

---

## Executive Summary

| Severity | Jumlah | Status |
|----------|--------|--------|
| **Critical** | 0 | — |
| **Medium** | 2 | ✅ 2/2 fixed |
| **Low/UX** | 2 | ✅ 1/2 fixed (BUG-04 = QA tooling, bukan app) |

Testing: 4 fase (setup, publik, operator, admin). Semua bug diperbaiki + di-verify ulang. Gate akhir: lint 0, test 18/18, build OK.

---

## Issues

### BUG-01 (Medium) — "184 madrasah" hardcoded ❌→✅ FIXED
- **URL:** `/leaderboard`, `/` (HeroSection), `/leaderboard` badge
- **Code:** `Leaderboard.jsx:148` & `HeroSection.jsx:372` — angka statis 184; DB hanya 15
- **Repro:** buka leaderboard — selalu "184 madrasah" & "Diikuti 184 madrasah" meskipun data tumbuh/berkurang
- **Fix:**
  - Backend: `publicController.leaderboard` + `madrasahCount` (count `deletedAt: null`); endpoint baru `GET /api/stats` `{ madrasahCount, kelompokCount }`
  - Frontend: badge dinamis `{madrasahCount} madrasah • 6 kelompok`; HeroSection fetch `/api/stats` → "Diikuti {n} madrasah"
- **Verify:** Home "Diikuti 15 madrasah" ✓, badge "15 madrasah • 6 kelompok" ✓, test `GET /api/stats` + `leaderboard.madrasahCount` ✓ (commit `49d32e8`)

### BUG-02 (Medium) — tanggal "1/1/1970" di LeaderboardTable ❌→✅ FIXED
- **URL:** `/leaderboard` tabel ("Updated" col)
- **Code:** `LeaderboardTable.jsx:132` — `new Date(null).toLocaleDateString()` = epoch 1970
- **Repro:** periode tanpa validasi (`updatedAt: null`) → kolom tanggal tampil "1/1/1970"
- **Fix:** `{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('id-ID') : '—'}`
- **Verify:** tabel MI Negeri → "—" ✓ (masuk commit `49d32e8`)

### BUG-03 (Low/UX) — pill periode "2025/2026" tidak berfungsi ❌→✅ FIXED
- **URL:** `/leaderboard` FilterBar
- **Code:** `FilterBar.jsx:12` — `PERIODS = ['2025/2026', '2026/2027']` hardcoded; periode 2025/2026 tidak ada di DB; klik pill → data tidak berubah (backend fallback aktif)
- **Fix:**
  - Backend: `GET /api/periode` publik — hanya non-finalisasi/arsip + `statusEfektif` derived
  - Frontend: pill render dinamis dari API; indikator **Aktif/Nonaktif** dari `statusEfektif` (bukan hardcode 'Aktif'/'Arsip')
- **Verify:** pill hanya "2026/2027" (data nyata), status "Aktif" ✓

### BUG-04 (Low — QA tooling) — qa-auth helper tanpa credentials ❌→✅ FIXED
- **Not app bug.** `frontend/public/qa-auth.html` & `qa-auth-operator.html` fetch login tanpa `credentials: 'include'` → cookie refreshToken tidak tersimpan di browser → refresh session gagal (request pertama 401).
- **Fix:** tambah `credentials: 'include'` di 2 helper QA.

---

## Not-Bug (perilaku benar — verifikasi API)

| Skenario | Verdict |
|----------|---------|
| "2 baris" badge + empty state sesaat (AnimatePresence exit anim) | timing, bukan bug |
| Toast merah "Perbaiki field wajib" saat submit/draft kosong | validasi benar (6 field diklat termasuk select statusPegawai) |
| Podium MI Nurul Huda di #1 dengan placeholder #2/#3 | by-design (data 1 madrasah, skor 0) |
| "Belum ada capaian" amber box (allZero) | by-design (tidak ada submission disetujui) |
| Dashboard admin "0 total submission" | benar (periode aktif 2026/2027 kosong) |
| Dashboard "0 aktif / 4 total" MI Negeri | benar (madrasah dengan submission 0) |
| DEMO/2026 & TEST/2026 hilang dari DB | **dihapus user via UI** (fitur hapus periode bekerja) — bukan bug |

## Testing Notes

- ✅ Dijalankan: publik (home/tentang/leaderboard/detail/404/interaction), operator (dashboard/input/riwayat/hapus-data/profil/notifikasi/draft-submit-validation), admin (dashboard/validasi/detail/periode/bobot/akun/madrasah/laporan/audit).
- ⚠️ Antrian Validasi Approve/Reject TIDAK diujikan ke data demo (hak user) — hanya modal + tombol verified.
- ✅ Data test yang dibuat & dihapus: draft submission (id 291-292), akun QA operator (32), madrasah uji (BMU-900303).
- ✅ Empty state selalu di-cross-check API (authenticated-web-qa step 5).
- 🔍 DEMO/2026 ter-restore via seed + finalisasi (id 38) — user akan hapus lagi sendiri.

## ✅ E2E gap batch (ditutup setelah Fase 4 — 25/25 PASS)

Data uji khusus, cleanup bersih:
1. **Register publik + approve akun**: register → 201 `menunggu_persetujuan`; login sebelum approve → 401 (ditolak); approve → 200; login lanjut → OK
2. **Reject**: tanpa alasan → 400; dengan alasan → 200 status `ditolak` + alasan tercatat
3. **Revoke**: approve → revoke → 200 status `ditolak` + alasan
4. **Soft-delete flow**: submit → approve (skor 10) → operator request-delete (201, queue menunggu) → admin approve → submission `deletedAt` + **skor recalc 0**
5. **Notifikasi**: operator menerima 5 notif (delete_request_approved, submit_status, dll.) setelah aksi
6. **Reopen periode**: finalisasi → reopen tanpa alasan → 400; dengan alasan → 200 status `aktif` (by-design, write kembali diizinkan)
7. **Export**: PDF `%PDF-` 2663 byte ✓; Excel `PK(xlsx)` 7238 byte ✓ — isi file valid (magic bytes)

**Perilaku benar yang dipastikan bukan bug:** reopen → status `aktif` (kode memilih aktif agar write diizinkan — by-design).

## Gate Final
- `npm run lint` → 0 problem
- `npm test` → 18/18 (backend 16 + frontend 2)
- `npm run build` → OK
