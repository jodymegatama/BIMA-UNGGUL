# Testing Guide — BIMA UNGGUL

## Menjalankan test

```bash
npm test                  # root: seluruh workspace (backend + frontend)
npm run test -w backend   # hanya backend
npx vitest run <file>     # satu file (dari backend/)
```

Backend suite (Vitest + supertest, `tests/**/*.test.js`, `fileParallelism: false` — satu DB dev):

| File | Cakupan |
|------|---------|
| `api.integration.test.js` | Health, helmet headers, login (gated `BACKEND_TEST_NIP/PASS`), periode CRUD, guard overlap |
| `unit.services.test.js` | `deriveStatus` periode + `HttpError` |
| `scoring.integration.test.js` | Formula per_capaian/persentase, live-compute tanpa cache, tie-breaker 4 level, BMU fallback |
| `validation.integration.test.js` | Queue validasi, approve/reject/revoke + audit, DeleteRequest, atomicity rollback, pagination |
| `publicAdmin.integration.test.js` | Leaderboard publik, isolasi linkBukti, periode CRUD, finalisasi/reopen lock, bobot recalc, akun CRUD, PDF/Excel buffer, audit-log filter |

Semua suite fixture-scope (prefix `BMU-TEST`/`E2E-VAL`/`PUBADM`, periode khusus) dan
membersihkan sebelum + sesudah run. Test tidak boleh menghapus data riil.

Creds opsional untuk `api.integration.test.js` (login admin):
`BACKEND_TEST_NIP` + `BACKEND_TEST_PASS` di `backend/.env`. Tanpa creds, test
yang butuh login di-skip otomatis (`hasCreds ? it : it.skip`).

## Legacy transition (2026-08-30)

Ad-hoc script `testScoring.js`, `testValidationE2E.js`, `testPublicAndAdminE2E.js`
dan `testPublicAndAdminE2E.js` sudah dimigrasi ke Vitest (commit `f8e851b`,
`d34a309`) lalu dihapus; script `test:scoring`/`test:validation`/`test:e2e`
dihapus dari package.json. Jangan menambah test sebagai script `node tests/*.js`
lagi — tempatnya di Vitest suite.

## Gap coverage (belum ditest otomatis)

- Flow register operator → approve admin → madrasah dibuat (manual via API, belum ada test end-to-end)
- Refresh token & logout (manual)
- Frontend rendering (belum ada komponen test — hanya 2 test util; UI diverifikasi via smoke manual/browser)

Script aman (tooling, bukan test): `scripts/smoke-*.mjs`, `scripts/create-dummy-accounts.mjs`, `scripts/clean-dummy.mjs` (purge hanya data dummy/test, KEEP admin + operator asli).
