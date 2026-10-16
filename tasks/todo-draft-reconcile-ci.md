# Task List: Verifikasi Error CI `draftReconcile`

- [x] Task 1: Pastikan job backend memakai database CI sementara, bukan produksi.
- [x] Task 2: Konfirmasi fixture periode aktif milik tes dan tidak mengubah seed produksi.
- [x] Task 3: Verifikasi pipeline backend dari database kosong pada CI terbaru (run `38882744222`, commit `66a9748`, sukses).

## Checkpoint

- [x] Job backend CI terbaru hijau pada commit yang berisi `e97bb0b`.
- [x] Tidak ada periode atau fixture test yang dibuat di database produksi.
