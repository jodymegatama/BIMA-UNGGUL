# PRD — BIMA UNGGUL (Bina Madrasah Unggul)

**Versi:** 3.0 (migrasi stack ke React + Vite / Express / MySQL aaPanel)
**Target Platform:** Web Fullstack (SPA React di frontend, REST API JSON di backend)
**Stack:** React 18 + Vite (frontend), Express.js + Node.js (backend REST API), MySQL (aaPanel), Nginx (web server & reverse proxy), PM2 (process manager backend), Tailwind CSS 4 (styling), Chart.js / ApexCharts (visualisasi data)
**Bahasa Sistem:** Indonesia
**Periode Contoh:** 2026/2027

---

## 1. Overview

**Feature / Project Name:** BIMA UNGGUL — Sistem Informasi Input, Validasi, dan Pemeringkatan Capaian Mutu Madrasah di Lingkungan Kantor Kementerian Agama Kabupaten Pasuruan

**Identitas Aplikasi:**
Sistem Informasi BIMA UNGGUL adalah sistem input, validasi, dan pemeringkatan capaian mutu madrasah di lingkungan Kantor Kementerian Agama Kabupaten Pasuruan. Aplikasi dikelola oleh Seksi Pendidikan Madrasah (Pendma) Kankemenag Kabupaten Pasuruan untuk seluruh madrasah (MI/MTs/MA, negeri dan swasta) di wilayah Kabupaten Pasuruan.

**Problem Statement:**
Kemenag Kabupaten Pasuruan belum memiliki sistem digital untuk mengumpulkan, memverifikasi, dan memeringkat capaian mutu madrasah secara transparan. Proses saat ini manual, rawan bias, dan tidak memberi insentif berbasis bukti yang terukur bagi madrasah untuk meningkatkan mutu. Operator madrasah butuh cara mudah melaporkan capaian; Admin Seksi Pendma butuh proses validasi yang jelas dan auditable; publik butuh transparansi peringkat.

**Proposed Solution:**
Aplikasi web yang mendigitalkan alur *Input Operator → Validasi Admin → Skor → Leaderboard*, di mana skor madrasah murni berasal dari akumulasi capaian yang diinput Operator dan disetujui Admin berdasarkan 9 indikator mutu berbobot — tanpa target skor, skor minimum, atau score engine berbasis kategori.

**AI Build Summary:**
Bangun aplikasi web fullstack SPA menggunakan React 18 + Vite (frontend) yang mengonsumsi REST API JSON dari Express.js + Node.js (backend), dengan MySQL (di-hosting via aaPanel) sebagai database, Nginx sebagai web server/reverse proxy (serve static build React + proxy `/api` ke backend Express), dan PM2 sebagai process manager khusus untuk proses backend Express (frontend React di-build statis, tidak dijalankan lewat PM2). Styling tetap menggunakan Tailwind CSS 4. Sistem memiliki 3 role: Publik (read-only), Operator Madrasah (input & submit capaian pada 9 indikator), dan Admin Seksi Pendma (validasi, bobot, periode, laporan). Skor dihitung realtime dari `Σ(capaian Approved × bobot)` per indikator, per 9 indikator, lalu dirangking dalam 6 kelompok madrasah (MI/MTs/MA × Negeri/Swasta). Chart/grafik (Top 10 bar chart, grafik skor 9 indikator) dibangun dengan Chart.js atau ApexCharts. Wajib mendukung: validasi per baris data, alasan wajib saat reject/revoke, audit trail lengkap, ekspor PDF & Excel, dan penguncian periode (finalisasi) dengan mekanisme reopen beralasan.

---

## 2. Goals & Success Metrics

**Primary Goal:** Menyediakan sistem pemeringkatan mutu madrasah yang transparan, berbasis bukti tervalidasi, dan real-time — mendorong budaya peningkatan mutu berbasis capaian nyata.

**Success Metrics:**
- Seluruh madrasah aktif di 6 kelompok memiliki minimal 1 submission tervalidasi per periode.
- Waktu rata-rata validasi submission oleh Admin (dari "Menunggu" ke "Disetujui/Ditolak") menurun dari proses manual sebelumnya.
- Leaderboard publik dan profil madrasah dapat diakses tanpa error/downtime signifikan selama periode aktif.

**Anti-goals:**
- Tidak menetapkan skor target, skor minimum, atau passing grade.
- Tidak membangun score engine berbasis kategori otomatis (skor murni dari capaian × bobot yang dikonfigurasi manusia).
- Tidak membatasi jumlah capaian yang boleh diinput per indikator.
- Tidak menyediakan kolaborasi real-time multi-user pada satu form (bukan Google-Docs-style).

---

## 3. Scope & Constraints

**In scope:**
- Registrasi & approval akun Operator, manajemen akun oleh Admin.
- Input, draft, submit, revisi capaian untuk 9 indikator mutu.
- Validasi per baris capaian (approve/reject/revoke) dengan alasan wajib.
- Konfigurasi bobot (per capaian, per tingkat wilayah, per jenjang pendidikan, per rasio).
- Manajemen periode penilaian dengan status lifecycle & cut-off.
- Perhitungan skor & ranking realtime, 6 kelompok, tie-breaker deterministik.
- Leaderboard publik, profil madrasah publik, grafik top 10.
- Ekspor laporan PDF & Excel.
- Notifikasi in-app untuk Operator & Admin.
- Permintaan & persetujuan penghapusan data (soft delete).
- Audit trail menyeluruh.

**Out of scope:**
- Aplikasi mobile native.
- Integrasi pembayaran/keuangan.
- Kolaborasi real-time antar Operator dalam satu form.
- Notifikasi via email/SMS/WhatsApp (hanya notifikasi in-app pada MVP).
- Analitik prediktif / rekomendasi otomatis peningkatan mutu.

**Technical constraints:**
- Platform: Web SPA — frontend React + Vite (client-side routing, di-build sebagai static assets), berkomunikasi dengan backend lewat REST API JSON (Express.js).
- Auth system: Custom auth di Express (login NIP + password, hash password dengan bcrypt, sesi berbasis JWT — access token + refresh token, atau session cookie httpOnly), role & permission diverifikasi lewat middleware Express (`authMiddleware`, `roleMiddleware`) di setiap route API.
- Aksesibilitas: minimal kontras warna layak baca; navigasi keyboard dasar untuk form (tidak dispesifikasikan level WCAG formal — direkomendasikan target WCAG AA).
- Offline support: Tidak diperlukan.
- Performa: Perhitungan ulang skor (recalculate) harus terjadi segera setelah approve/revoke/perubahan bobot yang berlaku, agar leaderboard selalu real-time (backend memicu recalculate lalu frontend melakukan refetch/invalidate query).
- Data residency/compliance: Data madrasah & pengguna disimpan di MySQL yang dikelola via aaPanel di server internal Kemenag, di belakang Nginx sebagai reverse proxy; tidak ada persyaratan lintas negara.
- Deployment: Nginx melayani hasil build statis React (folder `dist/`) dan melakukan reverse proxy `/api/*` ke Express (dijalankan via PM2 di port internal, misal `127.0.0.1:3000`). PM2 hanya mengelola proses backend Express (auto-restart, cluster mode, log management) — build frontend React bersifat statis dan tidak memerlukan process manager.

---

## 4. Jobs to Be Done (JTBD)

| Priority | Job Statement |
|---|---|
| 1 | Ketika periode penilaian baru dibuka, saya (Operator) ingin menginput seluruh capaian madrasah pada 9 indikator dengan mudah, sehingga saya dapat mengajukan validasi tepat waktu sebelum cut-off. |
| 2 | Ketika submission Operator ditolak, saya (Operator) ingin tahu alasan penolakan dan memperbaiki baris data yang sama, sehingga saya dapat mengirim ulang tanpa kehilangan riwayat. |
| 3 | Ketika ada submission menunggu, saya (Admin) ingin memvalidasi per baris capaian dengan melihat bukti fisik, sehingga saya dapat menyetujui/menolak secara akurat dan bertanggung jawab. |
| 4 | Ketika saya (Publik/Kepala Madrasah/Kemenag) ingin mengetahui posisi madrasah tertentu, saya ingin melihat leaderboard dan profil madrasah secara transparan, sehingga saya dapat memantau capaian mutu tanpa perlu login. |
| 5 | Ketika periode penilaian berakhir, saya (Admin) ingin memfinalisasi periode dan mengekspor laporan PDF/Excel, sehingga saya memiliki dokumen resmi untuk pelaporan ke Kemenag Kabupaten Pasuruan. |

---

## 5. User Stories

| ID | Role | Action | Benefit | JTBD Ref |
|---|---|---|---|---|
| US1 | Operator | mendaftar akun dengan NIP & data madrasah | dapat mulai menginput capaian setelah disetujui Admin | J1 |
| US2 | Operator | menginput banyak baris capaian per indikator dan menyimpannya sebagai draft | dapat mengumpulkan bukti bertahap sebelum submit | J1 |
| US3 | Operator | mengirim submission untuk divalidasi | capaian dapat dinilai dan masuk skor jika disetujui | J1 |
| US4 | Operator | melihat alasan penolakan dan mengedit baris yang sama untuk dikirim ulang | dapat memperbaiki data tanpa membuat record baru | J2 |
| US5 | Admin | melihat antrian validasi dengan filter status/madrasah/indikator/periode | dapat memproses validasi secara efisien dan terorganisir | J3 |
| US6 | Admin | membuka link bukti fisik dan menyetujui/menolak per baris dengan alasan wajib | keputusan validasi akurat dan tercatat | J3 |
| US7 | Admin | melakukan revoke terhadap submission yang sudah disetujui | dapat mengoreksi kesalahan validasi sebelumnya, skor otomatis dihitung ulang | J3 |
| US8 | Publik | memilih periode dan kelompok madrasah untuk melihat leaderboard | mendapat informasi peringkat mutu madrasah secara transparan | J4 |
| US9 | Publik | membuka profil madrasah untuk melihat skor 9 indikator dan prestasi terverifikasi | dapat menilai kualitas madrasah tertentu secara detail | J4 |
| US10 | Admin | mengatur bobot indikator, tingkat wilayah, dan jenjang pendidikan per periode | skor mencerminkan prioritas kebijakan mutu terkini | J3 |
| US11 | Admin | membuat, mengaktifkan, cut-off, dan memfinalisasi periode penilaian | siklus penilaian berjalan sesuai jadwal resmi | J5 |
| US12 | Admin | mengekspor leaderboard sebagai PDF dan Excel | tersedia dokumen resmi untuk pelaporan ke Kemenag | J5 |

---

## 6. Proposed Experience

**Design Direction:**
Mengikuti `DESIGN.md` sebagai **satu-satunya sumber kebenaran desain** (token warna, tipografi, radius, kartu ber-hairline, prinsip "*Photography is absent*", dan komponen). **Tidak ada referensi UI/UX dari sistem lain.** Implementasi token & styling final ditetapkan lewat file CSS kustom yang akan dibuat.
Pengalaman dibagi tiga zona dengan mental model berbeda: (1) **Publik** — model "papan skor" yang terbuka, cepat dipahami, visual (podium, chart); (2) **Operator** — model "form isi bertahap dengan checklist 9 kartu indikator", memberi rasa progres dan kejelasan status; (3) **Admin** — model "meja kerja validasi" berbasis antrian dan filter, dioptimalkan untuk throughput pemrosesan banyak submission.

**Key Screens / States:**
- Landing Page (Publik) — hero, navigasi ke leaderboard & indikator.
- Leaderboard Publik — filter periode & 6 kelompok, podium Top 3, tabel ranking, chart Top 10.
- Detail Madrasah (Publik) — profil, skor 9 indikator, prestasi terverifikasi.
- Dashboard Operator — score grid, status 9 indikator, ringkasan profil.
- Input Indikator (Operator) — 9 kartu, form dinamis per indikator, multi-baris.
- Riwayat Pengiriman (Operator) — daftar submission dengan status & histori validasi.
- Dashboard Admin — statistik antrian, quick access, leaderboard 6 kelompok.
- Antrian Validasi (Admin) — filter multi-kriteria, tabel, aksi validasi/revoke.
- Kelola Akun (Admin) — tab Menunggu/Aktif/Nonaktif.
- Manajemen Periode & Cut-off (Admin) — daftar periode, countdown cut-off, finalisasi, reopen.
- Bobot Penilaian (Admin) — konfigurasi bobot per indikator/tingkat/jenjang.
- Export Laporan (Admin) — preview, unduh PDF/Excel.
- Empty state: Operator belum mengisi indikator apa pun → kartu indikator menampilkan status "Belum Diisi".
- Error state: submission gagal validasi (misalnya bukti fisik tidak dapat dibuka) → pesan jelas + opsi retry; periode sudah cut-off → pesan "Periode penilaian sudah berakhir" saat Operator mencoba submit/edit.
- Loading state: skeleton pada leaderboard & chart saat memuat data periode; spinner pada tombol submit/validasi saat proses recalculate skor berjalan.

**Interaction Model:**
1. Operator klik kartu indikator → form dinamis terbuka → isi/tambah baris → simpan draft atau kirim langsung.
2. Setelah kirim, status baris menjadi "Menunggu" → Admin membuka Antrian Validasi → buka bukti fisik di tab baru → approve/reject dengan alasan (reject wajib alasan).
3. Jika ditolak, Operator mengedit baris yang sama (bukan membuat baru) → kirim ulang → kembali ke "Menunggu".
4. Approve memicu recalculate skor → ranking → leaderboard di backend; frontend React melakukan refetch/invalidate data (mis. via polling singkat atau refetch saat halaman/tab difokuskan) sehingga leaderboard & skor terlihat real-time tanpa perlu reload manual oleh Admin/Operator.
5. Undo/redo tidak ada; koreksi dilakukan lewat mekanisme revoke (Admin, dengan alasan wajib) atau permintaan hapus (Operator, untuk data Approved).

**Accessibility Notes:**
- Semua form input dapat dinavigasi dengan keyboard (tab order logis, fokus terlihat jelas).
- Label form deskriptif untuk pembaca layar, terutama pada 9 form indikator yang berbeda struktur field-nya.
- Kontras warna badge status (Disetujui/Menunggu/Ditolak/Belum Diisi) dan podium (🏆🥈🥉) harus tetap terbaca tanpa hanya mengandalkan warna (gunakan ikon/label teks juga).
- Kontras warna badge tingkat prestasi (emas/perak/perunggu) diberi label teks, tidak hanya warna
- Bar chart horizontal disertai tabel data sebagai alternatif teks untuk pembaca layar

**Figma / Design Link:** [placeholder — tambahkan link saat tersedia]

---

## 7. Acuan Desain (Design Reference)

> **Catatan:** Token & pedoman visual di bawah ini diambil dari file desain yang diunggah (`DESIGN.md`, `theme.css`, `tokens.json`, `variables.css`)

### 7.1 File Sumber

- `DESIGN.md` — dokumentasi lengkap gaya, komponen, do's/don'ts, dan quick-start code.
- `theme.css` — token Tailwind v4 (`@theme`) siap pakai.
- `variables.css` — token CSS custom properties (`:root`) versi lengkap termasuk layout & named radii.
- `tokens.json` — token terstruktur format Design Tokens (W3C-style `$value`/`$type`/`$description`) untuk konsumsi tooling desain (Figma, dsb).

---

## 8. Component Inventory

| Component | Type | Description | Linked Stories |
|---|---|---|---|
| RegisterOperatorForm | Form | Form pendaftaran Operator (nama, NIP, madrasah, jenjang, status, password) | US1 |
| AccountApprovalCard | Action | Kartu approval akun Operator baru oleh Admin, opsi buat madrasah baru otomatis | US1 |
| IndicatorCard (x9) | Display/Navigation | 9 kartu indikator di dashboard Operator, menampilkan status pengisian | US2, US8-status |
| DynamicIndicatorForm | Form | Form input dinamis per indikator, mendukung multi-baris (repeatable rows) | US2, US4 |
| DraftSaveButton | Action | Menyimpan input sebagai draft tanpa submit | US2 |
| SubmitValidationButton | Action | Mengirim baris capaian untuk divalidasi | US3 |
| SubmissionHistoryTable | Display | Tabel riwayat pengiriman dengan status & alasan penolakan | US4 |
| ValidationQueueTable | Display | Tabel antrian validasi dengan filter multi-kriteria | US5 |
| ValidationActionModal | Modal | Modal approve/reject dengan field alasan wajib saat reject | US6 |
| EvidenceLinkButton | Action | Tombol "Buka Bukti Fisik" membuka link di tab baru | US6 |
| RevokeConfirmModal | Modal | Modal konfirmasi revoke dengan alasan wajib | US7 |
| PublicNavbar | Navigation | Navbar sticky publik (Beranda, Indikator, Tentang, Masuk, Lihat Peringkat) | US8 |
| LeaderboardFilterBar | Form | Dropdown pilih periode & tab 6 kelompok | US8 |
| PodiumTop3 | Display | Visual podium Juara 1/2/3 dengan ikon 🏆🥈🥉 | US8 |
| RankingTable | Display | Tabel ranking selain Top 3 | US8 |
| Top10BarChart | Display | Grafik horizontal bar Top 10 berdasarkan total skor | US8 |
| MadrasahProfileHero | Display | Hero profil madrasah (ranking, skor total, tren skor, badge Unggul) | US9 |
| IndicatorScoreChart | Display/Chart | Grafik/tabel skor 9 indikator per madrasah | US9 |
| VerifiedAchievementList | Display | Daftar prestasi terverifikasi (tanpa link bukti fisik untuk publik) | US9 |
| WeightConfigTable | Form | Tabel konfigurasi bobot per indikator/tingkat/jenjang | US10 |
| PeriodListTable | Display | Daftar periode dengan status & aksi kelola | US11 |
| PeriodFormModal | Modal | Form buat/edit periode (nama, tanggal & jam mulai/cut-off) | US11 |
| CutoffCountdownPanel | Display | Panel countdown menuju cut-off | US11 |
| FinalizePeriodButton | Action | Tombol finalisasi periode (mengunci) | US11 |
| ReopenPeriodModal | Modal | Modal reopen periode dengan alasan wajib | US11 |
| ExportPreviewTable | Display | Preview data sebelum ekspor PDF/Excel | US12 |
| ExportButtonGroup | Action | Tombol unduh PDF & Excel | US12 |
| NotificationBell | Display/Navigation | Ikon notifikasi dengan status belum/sudah dibaca | — |
| AuditLogTable | Display | Tabel histori audit trail (Admin) | — |
| DeleteRequestPanel | Action | Panel permintaan hapus data Approved & approval Admin | — |

---

## 9. Layout Components per Role (Dikerjakan Pertama)

> **Prioritas implementasi:** Sebelum membangun halaman satu per satu, bangun dahulu komponen layout (Navbar/Topbar, Sidebar, Footer) per zona user sebagai **shared layout/shell** yang konsisten. Setiap halaman pada Section 10 akan menggunakan salah satu shell ini — tidak membangun navbar/sidebar/footer ulang per halaman.

### 9.1 Shell — Publik (`components/layouts/PublicLayout.tsx`)

| Komponen | Isi | Perilaku |
|---|---|---|
| Topbar/Navbar | Logo BIMA UNGGUL, menu (Beranda, Indikator, Tentang, Lihat Peringkat), tombol "Masuk" | Sticky top, transparan di hero → solid saat scroll |
| Sidebar | Tidak ada | — |
| Footer | Logo & nama instansi, link cepat (Leaderboard, Tentang), kontak Kemenag Kabupaten Pasuruan, copyright | Full-width band warna  |

### 9.2 Shell — Operator (`components/layouts/OperatorLayout.tsx`)

| Komponen | Isi | Perilaku |
|---|---|---|
| Topbar | Nama madrasah & nama Operator login, `NotificationBell`, avatar/menu akun (logout) | Sticky top, fixed height |
| Sidebar | Dashboard, 9 Kartu Indikator (link ke Input Indikator), Riwayat Pengiriman, Profil Madrasah | Collapsible di layar sempit, item aktif ter-highlight warna |
| Footer | Versi aplikasi, link bantuan/kontak Admin | Ringkas, satu baris |

### 9.3 Shell — Admin (`components/layouts/AdminLayout.tsx`)

| Komponen | Isi | Perilaku |
|---|---|---|
| Topbar | `NotificationBell`, nama Admin login, indikator periode aktif saat ini, avatar/menu akun | Sticky top |
| Sidebar | Dashboard, Antrian Validasi (badge jumlah menunggu), Kelola Akun, Manajemen Periode, Bobot Penilaian, Export Laporan, Audit Log | Grouping per kategori (Validasi / Konfigurasi / Laporan), item aktif ter-highlight |
| Footer | Versi aplikasi, link dokumentasi internal | Ringkas, satu baris |

### 9.4 Prinsip Konsistensi

- Ketiga shell menggunakan token warna, tipografi, spacing, dan radius yang sama dari Section 7 (mis. radius 12px pada nav item & tombol, warna aktif , badge notifikasi).
- Struktur route React Router mengikuti prefix per shell: `/` (publik, `PublicLayout`, tanpa proteksi), `/operator/*` (`OperatorLayout`, dibungkus `<ProtectedRoute role="operator">`), `/admin/*` (`AdminLayout`, dibungkus `<ProtectedRoute role="admin">`) — lihat komponen `ProtectedRoute.tsx` dan middleware `authMiddleware`/`roleMiddleware` di backend Express pada Section 16 (Suggested File Structure).
- Komponen `NotificationBell` identik secara visual di shell Operator & Admin (React component yang sama, di-reuse), hanya berbeda sumber data notifikasi (fetch dari endpoint API sesuai role user login).
- Sidebar Operator & Admin sama-sama collapsible dengan pola interaksi (ikon + label, collapse ke ikon saja) yang identik — hanya berbeda daftar menu (props/config berbeda pada komponen `Sidebar` yang sama).
- Build order yang disarankan: (1) `PublicLayout.tsx`, (2) `OperatorLayout.tsx`, (3) `AdminLayout.tsx`, (4) baru lanjut ke halaman individual (route) pada Section 10.

---

## 10. Daftar Halaman (Page Inventory)

| No | Nama Halaman | Route (usulan) | User | Layout/Shell | Isi Utama & Komponen |
|---|---|---|---|---|---|
| 1 | Landing Page | `/` | Publik | Shell Publik | Hero headline, ringkasan program, CTA "Lihat Peringkat", `PublicNavbar`, Footer |
| 2 | Leaderboard Publik | `/leaderboard` | Publik | Shell Publik | `LeaderboardFilterBar`, `PodiumTop3`, `RankingTable`, `Top10BarChart` |
| 3 | Detail Madrasah | `/madrasah/{slug}` | Publik | Shell Publik | `MadrasahProfileHero`, `IndicatorScoreChart`, `VerifiedAchievementList` |
| 4 | Halaman Tentang / Indikator | `/tentang` atau `/indikator` | Publik | Shell Publik | Penjelasan 9 indikator mutu & metodologi skor (ringkas, tanpa bukti fisik) |
| 5 | Login | `/login` | Publik → Operator/Admin | Shell Publik (form minimal) | Form NIP + password (POST ke `/api/auth/login`, simpan access token di `AuthContext`) |
| 6 | Registrasi Operator | `/daftar` | Publik → calon Operator | Shell Publik (form minimal) | `RegisterOperatorForm` |
| 7 | Dashboard Operator | `/operator` | Operator | Shell Operator | Ringkasan profil madrasah, 9 `IndicatorCard` dengan status pengisian |
| 8 | Input Capaian | `/operator/input` | Operator | Shell Operator | `IndikatorTabs` (navigasi antar 9 indikator dalam satu halaman), `DynamicIndicatorForm` per tab (multi-baris), `DraftSaveButton`, `SubmitValidationButton` |
| 9 | Riwayat Pengiriman | `/operator/riwayat` | Operator | Shell Operator | `SubmissionHistoryTable`, filter status, alasan penolakan, aksi edit & kirim ulang |
| 10 | Permintaan Hapus Data | `/operator/hapus-data` | Operator | Shell Operator | `DeleteRequestPanel`, daftar item Approved & status permintaan hapus |
| 11 | Profil Madrasah (Operator) | `/operator/profil` | Operator | Shell Operator | Data madrasah (editable: nama, alamat, jumlahSiswa; read-only: jenjang/status/BMU/slug/kelompok), riwayat skor |
| 12 | Notifikasi (Operator) | `/operator/notifikasi` | Operator | Shell Operator | Daftar `Notification`, tandai terbaca |
| 13 | Dashboard Admin | `/admin` | Admin | Shell Admin | Statistik antrian, quick access, leaderboard ringkas 6 kelompok |
| 14 | Antrian Validasi | `/admin/validasi` | Admin | Shell Admin | `ValidationQueueTable`, filter multi-kriteria (termasuk tab/filter "Permintaan Hapus"), `ValidationActionModal`, `EvidenceLinkButton`, `DeleteRequestPanel` (approval permintaan hapus data Approved) |
| 15 | Detail Validasi Submission | *(digabung ke No. 14)* — tidak ada route terpisah | Admin | Shell Admin | Detail ditampilkan sebagai `ValidationActionModal` di `/admin/validasi` (tanpa pindah route) — lihat No. 14 |
| 16 | Kelola Akun | `/admin/akun` | Admin | Shell Admin | Tab Menunggu/Aktif/Nonaktif, `AccountApprovalCard`, form buat/edit akun |
| 17 | Manajemen Periode | `/admin/periode` | Admin | Shell Admin | `PeriodListTable`, `PeriodFormModal`, `CutoffCountdownPanel`, `FinalizePeriodButton`, `ReopenPeriodModal` |
| 18 | Bobot Penilaian | `/admin/bobot` | Admin | Shell Admin | `WeightConfigTable` per indikator/tingkat wilayah/jenjang, terkunci jika periode final |
| 19 | Export Laporan | `/admin/export` | Admin | Shell Admin | `ExportPreviewTable`, `ExportButtonGroup` (PDF & Excel) |
| 20 | Audit Log | `/admin/audit-log` | Admin | Shell Admin | `AuditLogTable`, filter user/aksi/tanggal |
| 21 | Notifikasi (Admin) | `/admin/notifikasi` | Admin | Shell Admin | Daftar `Notification`, tandai terbaca |
| 22 | 404 / Error Page | `*` | Semua | Sesuai konteks shell terakhir | Pesan error ramah, tombol kembali ke Dashboard/Beranda |

> **Catatan implementasi Frontend (Phase 2):**
> - **Input Capaian (No. 8):** diimplementasikan sebagai satu halaman `/operator/input` dengan navigasi tab `IndikatorTabs` per indikator (bukan 9 route terpisah `/operator/indikator/{kode}`) untuk mengurangi reload halaman saat Operator berpindah antar indikator dalam satu sesi input.
> - **Detail Validasi (No. 15):** diimplementasikan sebagai modal `ValidationActionModal` di halaman `/admin/validasi` (bukan route terpisah `/admin/validasi/{id}`) untuk mempercepat alur approve/reject berturut-turut tanpa reload. Trade-off: submission individual tidak memiliki URL yang bisa dibagikan langsung.
> - **Dashboard (No. 7 & 13):** diimplementasikan sebagai halaman index/default `/operator` dan `/admin` (tanpa suffix `/dashboard`). Route lama `/operator/dashboard` dan `/admin/dashboard` tetap didukung via redirect/alias jika diperlukan, untuk kompatibilitas.

---

## 11. Daftar 9 Indikator Mutu

Setiap indikator punya field input berbeda. Semua field wajib kecuali "Catatan Tambahan" (opsional). `indikatorKode` di bawah adalah nilai yang dipakai pada `SubmissionIndikator.indikatorKode` dan `BobotIndikator.indikatorKode`.

| # | Nama Indikator | `indikatorKode` | Field Input |
|---|---|---|---|
| 1 | Diklat Tenaga Pendidik | `diklat` | Nama Diklat, Nama Institusi Penerbit, Nama ASN/non-ASN Pelaksana, Status Pegawai (ASN/non-ASN), Link Bukti Fisik, Catatan Tambahan |
| 2 | Penghargaan Individu Tenaga Pendidik | `penghargaan_individu` | Nama Penghargaan, Nama Institusi Penerbit, Nama ASN/non-ASN Penerima, Status Pegawai (ASN/non-ASN), Link Bukti Fisik, Catatan Tambahan |
| 3 | Penghargaan Institusi | `penghargaan_institusi` | Nama Penghargaan, Institusi Penerbit, Tingkat Wilayah Prestasi (kabupaten/provinsi/nasional/internasional), Link Bukti Fisik, Catatan Tambahan |
| 4 | Prestasi Siswa | `prestasi_siswa` | Nama Penghargaan/Prestasi, Nama Institusi Penerbit, Nama Siswa, Tingkat Wilayah Prestasi (kabupaten/provinsi/nasional/internasional), Link Bukti Fisik, Catatan Tambahan |
| 5 | Jumlah Tenaga Pendidik Lulus Jenjang Lanjutan | `lulus_jenjang_lanjutan` | Jenjang Pendidikan (S1/S2/S3), Jumlah ASN, Link Bukti Fisik, Catatan Tambahan |
| 6 | Rapor Rata-rata Murid >85 | `rapor_rata_rata` | Jumlah Siswa dengan Nilai Rapor Rata-rata >85 (format X dari Y = Z%), Link Bukti Fisik, Catatan Tambahan |
| 7 | Siswa Lanjutan Unggulan | `siswa_lanjutan_unggulan` | Nama Universitas/Sekolah Unggulan, Nama Siswa, Link Bukti Fisik, Catatan Tambahan |
| 8 | Giat Inovatif | `giat_inovatif` | Nama Giat Inovatif, Link Bukti Fisik, Catatan Tambahan |
| 9 | Rasio Penerimaan | `rasio_penerimaan` | Siswa Diterima dari Jumlah Pendaftar (format X dari Y = Z%), Link Bukti Fisik, Catatan Tambahan |

Formula skor per indikator mengikuti Section 9 (Bobot Penilaian pada dokumen sumber): indikator `diklat`, `penghargaan_individu`, `siswa_lanjutan_unggulan`, dan `giat_inovatif` dihitung `Jumlah Approved × Bobot`; `penghargaan_institusi` dan `prestasi_siswa` dihitung `Σ(Jumlah Approved per tingkat × Bobot tingkat)`; `lulus_jenjang_lanjutan` dihitung `Σ(Jumlah × Bobot per jenjang S1/S2/S3)`; `rapor_rata_rata` dan `rasio_penerimaan` dihitung `Persentase × Bobot`. Tidak ada skor maksimum pada seluruh indikator.

---

## 12. Data Models

```typescript
interface User {
  id: string;                    // UUID
  nip: string;                   // unik, wajib untuk login
  namaLengkap: string;
  role: "public" | "operator" | "admin";
  status: "menunggu" | "aktif" | "nonaktif";
  madrasahId?: string;           // FK ke Madrasah, null jika admin
  passwordHash: string;
  createdAt: string;             // ISO8601
  updatedAt: string;             // ISO8601
}

interface Madrasah {
  id: string;                    // UUID
  nomorMadrasah: string;         // format BMU-000001, permanen & unik — immutable
  namaMadrasah: string;          // editable by operator (langsung, tanpa approval, 3-120 char)
  jenjang: "MI" | "MTs" | "MA";  // immutable
  statusKepemilikan: "Negeri" | "Swasta"; // immutable
  jumlahSiswa: number;           // editable by operator (langsung, integer >0, tanpa validasi silang rapor/rasio)
  alamat: string;                // editable by operator (langsung, 5-500 char)
  slug: string;                  // unik, untuk /madrasah/{slug} — tidak regenerate saat nama berubah (stabil)
  kelompok: "MI Negeri" | "MI Swasta" | "MTs Negeri" | "MTs Swasta" | "MA Negeri" | "MA Swasta"; // derived — immutable
  createdAt: string;
  updatedAt: string;
}

interface PeriodePenilaian {
  id: string;
  namaPeriode: string;           // contoh: "2026/2027"
  tahunCapaian: number;          // otomatis mengikuti periode
  tanggalMulai: string;          // ISO8601
  tanggalCutoff: string;         // ISO8601
  status: "belum_dimulai" | "aktif" | "cutoff" | "penyelesaian_validasi" | "finalisasi" | "arsip";
  createdAt: string;
  updatedAt: string;
}

interface Indikator {
  id: string;
  kode: string;                  // 1..9
  nama: string;
  tipeFormula: "per_capaian" | "per_tingkat_wilayah" | "per_jenjang" | "persentase";
}

interface BobotIndikator {
  id: string;
  indikatorId: string;           // FK
  periodeId: string;             // FK, bobot memiliki histori per periode
  nilaiBobot?: number;           // untuk tipe per_capaian / persentase
  bobotTingkatWilayah?: {        // untuk Penghargaan Institusi & Prestasi Siswa
    kabupaten: number;
    provinsi: number;
    nasional: number;
    internasional: number;
  };
  bobotJenjang?: {                // untuk Jenjang Lanjutan Pendidik
    s1: number;
    s2: number;
    s3: number;
  };
  terkunci: boolean;              // true setelah periode final
}

interface Submission {
  id: string;
  madrasahId: string;             // FK
  indikatorId: string;            // FK
  periodeId: string;               // FK
  status: "draft" | "menunggu" | "disetujui" | "ditolak";
  createdBy: string;               // FK User (Operator)
  createdAt: string;
  updatedAt: string;
}

interface SubmissionItem {
  id: string;
  submissionId: string;           // FK
  // field dinamis sesuai indikator, contoh untuk Diklat:
  fields: Record<string, string | number>; // nama diklat, institusi, link bukti, catatan, dll
  tingkatWilayah?: "kabupaten" | "provinsi" | "nasional" | "internasional";
  jenjangPendidikan?: "s1" | "s2" | "s3";
  linkBukti: string;               // URL bukti fisik
  catatan?: string;
  skorBaris?: number;               // dihitung setelah disetujui
  status: "draft" | "menunggu" | "disetujui" | "ditolak";
  alasanPenolakan?: string;         // wajib jika status ditolak
  createdAt: string;
  updatedAt: string;
}

interface Validation {
  id: string;
  submissionItemId: string;        // FK
  validatorId: string;             // FK User (Admin)
  aksi: "approve" | "reject" | "revoke";
  alasan?: string;                  // wajib untuk reject & revoke
  createdAt: string;
}

interface SubmissionHistory {
  id: string;
  submissionItemId: string;        // FK
  statusSebelum: string;
  statusSesudah: string;
  keterangan?: string;
  createdAt: string;
}

interface DeleteRequest {
  id: string;
  submissionItemId: string;        // FK, hanya untuk item berstatus disetujui
  requestedBy: string;              // FK User (Operator)
  status: "menunggu" | "disetujui" | "ditolak";
  alasan: string;                   // alasan pengajuan Operator (wajib)
  alasanAdmin?: string;             // alasan penolakan/persetujuan Admin (wajib saat reject)
  reviewedBy?: string;              // FK User (Admin) yang mereview — null saat menunggu
  reviewedAt?: string;              // ISO8601 — null saat menunggu
  createdAt: string;
  resolvedAt?: string;              // alias reviewedAt untuk kompatibilitas
}

interface Notification {
  id: string;
  userId: string;                   // FK, penerima
  tipe: string;                      // contoh: "submission_approved", "account_approved"
  pesan: string;
  statusBaca: "belum_dibaca" | "sudah_dibaca";
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;                    // contoh: "login", "approve_submission", "reopen_period"
  entity: string;
  entityId: string;
  dataSebelum?: Record<string, unknown>;
  dataSesudah?: Record<string, unknown>;
  alasan?: string;
  ipAddress: string;
  createdAt: string;
}
```

---

## 13. API / Integration Surface

Backend Express menggunakan pola Route + Controller + Service (business logic terpisah dari handler), seluruh endpoint di-prefix `/api` dan mengembalikan JSON murni (dikonsumsi React via `fetch`/`axios`, idealnya dengan React Query untuk caching & invalidation):

| Method | Path | Description | Auth Required | Response Shape |
|---|---|---|---|---|
| POST | /api/auth/register | Registrasi Operator baru | Tidak | `{ status: "menunggu_persetujuan" }` |
| POST | /api/auth/login | Login NIP + password | Tidak | `{ accessToken: string, user: User }` (+ refresh token via httpOnly cookie) |
| POST | /api/auth/refresh | Perbarui access token dari refresh token | Ya (cookie) | `{ accessToken: string }` |
| POST | /api/auth/logout | Logout, hapus refresh token/cookie | Ya | `{ success: boolean }` |
| GET | /api/leaderboard | Data leaderboard publik per periode & kelompok | Tidak | `{ kelompok: string, rankings: MadrasahRanking[] }` |
| GET | /api/madrasah/:slug | Detail profil madrasah publik | Tidak | `MadrasahProfile` |
| GET | /api/operator/indikator | Ambil status & data 9 indikator milik madrasah Operator | Ya (Operator) | `IndikatorStatus[]` |
| PATCH | /api/operator/madrasah | Update profil madrasah milik operator (nama, alamat, jumlahSiswa — langsung, tanpa regenerate slug, validasi >0) | Ya (Operator) | `Madrasah` |
| POST | /api/operator/indikator/:id/draft | Simpan baris capaian sebagai draft | Ya (Operator) | `SubmissionItem` |
| POST | /api/operator/indikator/:id/submit | Kirim baris capaian untuk validasi | Ya (Operator) | `SubmissionItem` |
| PATCH | /api/operator/submission-item/:id | Edit baris ditolak & kirim ulang | Ya (Operator) | `SubmissionItem` |
| POST | /api/operator/submission-item/:id/request-delete | Ajukan penghapusan data Approved | Ya (Operator) | `DeleteRequest` |
| GET | /api/admin/validasi | Antrian validasi dengan filter (query params) | Ya (Admin) | `{ data: SubmissionItem[], total: number }` |
| POST | /api/admin/validasi/:id/approve | Setujui baris capaian | Ya (Admin) | `Validation` |
| POST | /api/admin/validasi/:id/reject | Tolak baris capaian (alasan wajib) | Ya (Admin) | `Validation` |
| POST | /api/admin/validasi/:id/revoke | Batalkan persetujuan (alasan wajib) | Ya (Admin) | `Validation` |
| GET | /api/admin/delete-requests | Antrian permintaan hapus data dengan filter | Ya (Admin) | `{ data: DeleteRequest[], total: number }` |
| POST | /api/admin/delete-requests/:id/approve | Setujui permintaan hapus (data di-soft-delete, skor dihitung ulang) | Ya (Admin) | `DeleteRequest` |
| POST | /api/admin/delete-requests/:id/reject | Tolak permintaan hapus (alasan wajib) | Ya (Admin) | `DeleteRequest` |
| GET/POST | /api/admin/akun | Kelola akun (list, approve, create, edit, activate/deactivate) | Ya (Admin) | `User[] / User` |
| GET/POST/PATCH | /api/admin/periode | Kelola periode penilaian | Ya (Admin) | `PeriodePenilaian[] / PeriodePenilaian` |
| POST | /api/admin/periode/:id/finalisasi | Kunci periode | Ya (Admin) | `{ status: "finalisasi" }` |
| POST | /api/admin/periode/:id/reopen | Buka kembali periode (alasan wajib) | Ya (Admin) | `PeriodePenilaian` |
| GET/PATCH | /api/admin/bobot | Lihat & atur bobot indikator per periode | Ya (Admin) | `BobotIndikator[]` |
| GET | /api/admin/export/pdf | Unduh leaderboard PDF | Ya (Admin) | Binary (PDF, `Content-Type: application/pdf`) |
| GET | /api/admin/export/excel | Unduh leaderboard Excel | Ya (Admin) | Binary (XLSX, `Content-Type: application/vnd.openxmlformats...`) |
| GET | /api/notifications | Daftar notifikasi user login | Ya | `Notification[]` |
| PATCH | /api/notifications/:id/read | Tandai notifikasi terbaca | Ya | `{ success: boolean }` |
| GET | /api/admin/audit-log | Lihat audit trail dengan filter | Ya (Admin) | `AuditLog[]` |

> **Catatan:** Endpoint `POST /api/operator/indikator/:id/draft` dan `POST /api/operator/indikator/:id/submit` menggunakan `:id` untuk ID indikator dari master data (bukan dari route frontend). Perubahan frontend dari 9 route terpisah `/operator/indikator/{kode}` menjadi satu halaman tab di `/operator/input` **tidak mengubah kontrak API** — `id` tetap dikirim via params sesuai kebutuhan. Hal yang sama berlaku untuk `POST /api/admin/validasi/:id/*` yang tetap menerima ID submission item meskipun detail validasi kini ditampilkan sebagai modal di `/admin/validasi` tanpa pindah route.

**External integrations:**
- PDF generation: library Node.js seperti `pdfkit` atau `puppeteer` (render HTML→PDF), dipanggil dari `exportService.js`.
- Excel generation: `exceljs` (standar de facto untuk generate XLSX di Node.js), dipanggil dari `exportService.js`.
- Auth: implementasi custom di Express — `bcrypt` untuk hashing password, `jsonwebtoken` untuk JWT access/refresh token (bukan integrasi eksternal pihak ketiga).
- Chart rendering (frontend): `Chart.js` (via `react-chartjs-2`) atau `ApexCharts` (via `react-apexcharts`) untuk `Top10BarChart` dan `IndicatorScoreChart`.

---

## 14. State Management Map

| State | Location | Persistence | Notes |
|---|---|---|---|
| Session login (role, user id, access token) | React Context (`AuthContext`) + memory, refresh token di httpOnly cookie | Session (refresh token persistent di cookie) | Menentukan akses route Operator/Admin/Publik via `ProtectedRoute`; access token dikirim sebagai `Authorization: Bearer` ke Express |
| Filter periode & kelompok (leaderboard) | URL query params (React Router `useSearchParams`) | None | Agar leaderboard dapat di-share/bookmark |
| Data server (leaderboard, antrian validasi, submission, dsb.) | React Query / server cache | Cache (invalidated on mutation) | Fetch dari REST API Express; auto-refetch setelah approve/reject/revoke agar leaderboard real-time |
| Draft form indikator | Server (tabel `submission` status draft di MySQL) | Persistent | Disimpan di DB via API agar tidak hilang saat browser tertutup |
| Status validasi realtime | Server (recalculate via `scoringService.js` di Express) | Persistent | Dipicu setiap approve/reject/revoke/perubahan bobot; frontend invalidate query terkait setelahnya |
| Notifikasi belum dibaca | Server (MySQL) + Local UI badge count (React state) | Persistent | Badge di-refresh via polling interval atau refetch saat tab difokuskan |
| Modal state (validasi, revoke, reopen) | Local UI (React `useState`) | None | State sementara untuk interaksi form dalam modal |
| Countdown cut-off | Local UI (React `useState` + `useEffect` interval, dihitung dari `tanggalCutoff` server) | None | Dihitung ulang di client dari timestamp server |
| Form multi-baris indikator (draft belum simpan) | Local UI (React `useState`/`useFieldArray` jika pakai React Hook Form) | None (sebelum simpan) | State lokal sebelum dikirim ke API sebagai draft/submit |

---

## 15. Tech Stack Recommendation

*(Stack sudah ditentukan oleh tim; tabel ini mendokumentasikan pilihan yang sudah dikonfirmasi beserta rasionalnya.)*

| Layer | Choice | Rationale |
|---|---|---|
| Frontend Framework | React 18 + Vite | SPA modern, dev experience cepat (HMR Vite), ekosistem komponen luas, cocok untuk 3 zona UI (publik/operator/admin) yang punya interaksi dinamis (form multi-baris, modal, filter) |
| Routing (Frontend) | React Router v6 | Client-side routing per shell/role (`/`, `/operator/*`, `/admin/*`), mendukung nested routes & `ProtectedRoute` |
| Data Fetching (Frontend) | React Query (TanStack Query) + Axios/Fetch | Caching, auto-refetch, dan invalidation query — penting agar leaderboard & antrian validasi terasa real-time setelah mutasi (approve/reject/revoke) |
| Form Handling (Frontend) | React Hook Form | Mengelola form dinamis multi-baris (9 indikator) dan validasi field secara efisien |
| Styling | Tailwind CSS 4 | Utility-first, tetap dipakai lintas stack; mempercepat pengembangan UI konsisten di 3 zona |
| Charts | Chart.js (via `react-chartjs-2`) atau ApexCharts (via `react-apexcharts`) | Untuk `Top10BarChart` (leaderboard publik) dan `IndicatorScoreChart` (profil madrasah) — ApexCharts lebih kaya interaksi/animasi, Chart.js lebih ringan; pilih salah satu secara konsisten di seluruh app |
| Backend Framework | Express.js (Node.js) | Ringan, fleksibel, ekosistem middleware luas, cocok untuk REST API JSON yang dikonsumsi SPA React |
| Auth | Custom (bcrypt untuk hash password, jsonwebtoken untuk JWT access/refresh token) | Login NIP + password, role & permission diverifikasi lewat middleware Express di tiap route |
| ORM / DB Access | Prisma atau Sequelize/Knex (pilih salah satu di awal Phase 1) | Migrasi skema terstruktur, query builder/typed model ke MySQL, memudahkan `ScoringService`/`RankingService` menulis query agregasi |
| Database | MySQL (dikelola via aaPanel) | Standar, stabil, mudah dikelola tim internal Kemenag lewat panel manajemen aaPanel (backup, monitoring, phpMyAdmin bawaan) |
| Web Server | Nginx | Serve static build React (`dist/`) dan reverse proxy `/api/*` ke Express (port internal); juga menangani HTTPS/SSL termination & gzip |
| Process Manager (Backend) | PM2 | Menjaga proses Express tetap hidup (auto-restart on crash), cluster mode untuk multi-core, log management — **hanya untuk backend**, frontend React tidak butuh process manager karena berupa static build |
| Hosting/Environment | aaPanel (VPS/dedicated server Linux) dengan Nginx + Node.js + MySQL; dev lokal pakai Vite dev server + `nodemon`/`ts-node-dev` untuk Express | Sesuai environment target production tim |
| PDF Export | `pdfkit` atau `puppeteer` (Node.js) | Generate laporan PDF di backend Express, dipanggil dari endpoint `/api/admin/export/pdf` |
| Excel Export | `exceljs` (Node.js) | Standar de facto untuk generate XLSX di ekosistem Node.js |

---

## 16. Suggested File Structure

Struktur dipisah dua folder utama (monorepo sederhana): `frontend/` (React + Vite) dan `backend/` (Express + Node.js), masing-masing di-deploy terpisah (frontend jadi static build yang dilayani Nginx, backend jadi proses Node yang dikelola PM2).

```
bima-unggul/
├── frontend/                          # React + Vite (SPA)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                    # React Router setup
│   │   ├── routes/
│   │   │   ├── public/
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── LeaderboardPage.tsx
│   │   │   │   └── MadrasahProfilePage.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── operator/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── IndikatorPage.tsx
│   │   │   │   └── SubmissionHistoryPage.tsx
│   │   │   └── admin/
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── ValidationQueuePage.tsx
│   │   │       ├── AccountManagementPage.tsx
│   │   │       ├── PeriodPage.tsx
│   │   │       ├── WeightConfigPage.tsx
│   │   │       └── ExportPage.tsx
│   │   ├── components/
│   │   │   ├── layouts/
│   │   │   │   ├── PublicLayout.tsx
│   │   │   │   ├── OperatorLayout.tsx
│   │   │   │   └── AdminLayout.tsx
│   │   │   ├── ui/                    # PodiumTop3, RankingTable, IndicatorCard, dll (lihat Section 8)
│   │   │   └── charts/
│   │   │       ├── Top10BarChart.tsx      # Chart.js / ApexCharts
│   │   │       └── IndicatorScoreChart.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/                     # custom hooks React Query (useLeaderboard, useValidationQueue, dll)
│   │   ├── lib/
│   │   │   ├── apiClient.ts           # instance Axios/Fetch + interceptor JWT
│   │   │   └── types.ts               # shared TypeScript types (cermin Section 12 Data Models)
│   │   └── router/
│   │       └── ProtectedRoute.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                            # Express + Node.js (REST API)
    ├── src/
    │   ├── server.js                   # entry point, dijalankan oleh PM2
    │   ├── app.js                      # setup Express app, middleware global
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── public.routes.js        # leaderboard, madrasah profile
    │   │   ├── operator.routes.js
    │   │   └── admin.routes.js
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── leaderboardController.js
    │   │   ├── madrasahController.js
    │   │   ├── operatorController.js
    │   │   └── admin/
    │   │       ├── validationController.js
    │   │       ├── accountController.js
    │   │       ├── periodController.js
    │   │       ├── weightController.js
    │   │       └── exportController.js
    │   ├── services/
    │   │   ├── scoringService.js       # hitung skor per indikator & total
    │   │   ├── rankingService.js       # ranking per kelompok + tie-breaker
    │   │   ├── validationService.js    # approve/reject/revoke logic
    │   │   ├── periodService.js        # lifecycle status periode
    │   │   └── exportService.js        # generate PDF (pdfkit/puppeteer) & Excel (exceljs)
    │   ├── models/                     # Prisma schema atau model Sequelize/Knex
    │   │   ├── user.model.js
    │   │   ├── madrasah.model.js
    │   │   ├── submission.model.js
    │   │   ├── submissionItem.model.js
    │   │   └── periode.model.js
    │   ├── middlewares/
    │   │   ├── authMiddleware.js       # verifikasi JWT
    │   │   ├── roleMiddleware.js       # cek role (operator/admin)
    │   │   └── periodCutoffMiddleware.js
    │   └── db/
    │       ├── migrations/
    │       └── seeds/
    ├── ecosystem.config.js             # konfigurasi PM2 (nama proses, cluster mode, env)
    ├── .env                            # kredensial DB MySQL, JWT secret, dll
    └── package.json
```

**Catatan deployment (aaPanel + Nginx + PM2):**
- `frontend/` di-build (`npm run build`) menghasilkan folder `dist/` statis yang diletakkan di document root situs Nginx (dikonfigurasi lewat panel aaPanel).
- `backend/` dijalankan dengan `pm2 start ecosystem.config.js` (atau `pm2 start src/server.js --name bima-unggul-api`), berjalan di port internal (misal `3000`), tidak diekspos langsung ke publik.
- Konfigurasi Nginx (bisa diatur lewat menu Website di aaPanel) melayani `dist/` untuk semua route non-`/api`, dan melakukan `proxy_pass` ke `http://127.0.0.1:3000` untuk semua request `/api/*`.
- MySQL dikelola lewat menu Database aaPanel (buat database, user, backup terjadwal).

---

## 17. Acceptance Criteria

**US1 — Registrasi Operator**
- [ ] Operator dapat submit form registrasi dengan NIP unik.
- [ ] Setelah submit, status akun menjadi "Menunggu Persetujuan".
- [ ] Admin dapat menyetujui dan otomatis membuat madrasah baru dengan nomor `BMU-XXXXXX` berurutan & permanen jika madrasah belum ada.
- [ ] Edge case handled: NIP duplikat ditolak saat registrasi dengan pesan error jelas.
- [ ] Error state: registrasi gagal (misal field wajib kosong) menampilkan pesan validasi per field.

**US2 — Input & Draft Capaian**
- [ ] Operator dapat menambah lebih dari satu baris capaian per indikator tanpa batas jumlah.
- [ ] Draft tersimpan di server dan dapat dilanjutkan di sesi login berikutnya.
- [ ] Edge case handled: field numerik (misal jumlah siswa >85) menolak input non-numerik.
- [ ] Error state: submit gagal karena field wajib (link bukti) kosong menampilkan pesan spesifik per field.

**US3 — Submit Validasi**
- [ ] Baris capaian berstatus "Draft" dapat diubah menjadi "Menunggu" melalui aksi kirim validasi.
- [ ] Setelah periode berstatus cut-off, Operator tidak dapat membuat submission baru — sistem menampilkan pesan "Periode penilaian sudah berakhir."

**US4 — Revisi Data Ditolak**
- [ ] Baris berstatus "Ditolak" menampilkan alasan penolakan dari Admin.
- [ ] Operator mengedit baris yang sama (record ID tidak berubah) dan mengirim ulang, status kembali ke "Menunggu".
- [ ] Edge case handled: setelah cut-off, Operator tidak dapat mengedit/mengirim ulang baris ditolak.

**US5 — Antrian Validasi Admin**
- [ ] Admin dapat memfilter antrian berdasarkan status, madrasah, indikator, periode, dan kata kunci pencarian.
- [ ] Tabel menampilkan minimal: madrasah, indikator, skor (jika sudah dihitung), tanggal submit, status, aksi.

**US6 — Approve/Reject dengan Bukti**
- [ ] Admin dapat membuka link bukti fisik di tab baru dari detail validasi.
- [ ] Reject mengharuskan pengisian field alasan (submit ditolak jika alasan kosong).
- [ ] Approve mengubah status baris menjadi "Disetujui" dan memicu recalculate skor madrasah tersebut secara langsung.

**US7 — Revoke**
- [ ] Admin dapat me-revoke baris berstatus "Disetujui", dengan alasan wajib.
- [ ] Revoke memicu recalculate skor & ranking secara langsung (skor berkurang sesuai bobot baris yang di-revoke).

**US7b — Permintaan Hapus Data (Soft Delete)**
- [ ] Admin dapat melihat daftar Permintaan Hapus Data di halaman Antrian Validasi (tab/filter terpisah dari validasi submission biasa).
- [ ] Approve permintaan hapus men-soft-delete data terkait dan memicu recalculate skor madrasah.
- [ ] Reject permintaan hapus wajib mengisi alasan, data tetap ada seperti semula.
- [ ] Aksi approve/reject permintaan hapus tercatat di audit log.

**US8 — Leaderboard Publik**
- [ ] Publik (tanpa login) dapat memilih periode dan salah satu dari 6 kelompok madrasah.
- [ ] Top 3 ditampilkan sebagai podium dengan ikon 🏆🥈🥉; peringkat #4 ke atas ditampilkan sebagai tabel.
- [ ] Grafik horizontal bar menampilkan Top 10 berdasarkan total skor.
- [ ] Halaman menampilkan timestamp "Diperbarui: [tanggal + waktu]" sesuai waktu recalculate terakhir.
- [ ] Edge case handled: dua atau lebih madrasah dengan skor sama tetap mendapat ranking unik sesuai urutan tie-breaker (skor → jumlah submission Approved → waktu pencapaian skor → BMU ID).

**US9 — Profil Madrasah Publik**
- [ ] Halaman `/madrasah/{slug}` menampilkan skor 9 indikator (grafik & tabel) serta prestasi terverifikasi.
- [ ] Link bukti fisik TIDAK ditampilkan di halaman publik (hanya field nama, institusi, tingkat, tahun/nama siswa sesuai indikator).

**US10 — Konfigurasi Bobot**
- [ ] Admin dapat mengatur bobot per indikator, per tingkat wilayah (Kabupaten/Provinsi/Nasional/Internasional), dan per jenjang pendidikan (S1/S2/S3).
- [ ] Bobot memiliki histori tersendiri per periode.
- [ ] Setelah periode berstatus "Finalisasi", bobot periode tersebut terkunci (read-only).

**US11 — Manajemen Periode**
- [ ] Admin dapat membuat periode baru dengan tanggal & jam mulai serta cut-off; tahun capaian mengikuti otomatis dari nama periode.
- [ ] Status periode mengikuti alur: Belum Dimulai → Aktif → Cut-off → Penyelesaian Validasi → Finalisasi → Arsip.
- [ ] Finalisasi mengunci periode (submission & bobot tidak dapat diubah).
- [ ] Reopen periode yang sudah final memerlukan alasan wajib dan tercatat di audit log.

**US12 — Export Laporan**
- [ ] Admin dapat memfilter periode sebelum mengekspor.
- [ ] File PDF berisi kop instansi, periode, tanggal cetak, 6 kelompok, Top 3, seluruh ranking, skor, rekap jumlah madrasah, dan area pengesahan.
- [ ] File Excel berisi leaderboard lengkap dengan rincian skor 9 indikator per madrasah.
- [ ] Export hanya menyertakan submission berstatus "Disetujui" (Approved).

---

## 18. Open Questions & Risks

- **Q:** Apakah diperlukan level WCAG formal (AA/AAA) untuk sertifikasi aksesibilitas instansi pemerintah? — Owner: Design/PM
- **Q:** Apakah notifikasi in-app cukup untuk MVP, atau email tetap diperlukan mengingat Operator madrasah mungkin jarang login? — Owner: PM
- **Q:** Bagaimana mekanisme dispute jika Operator merasa penolakan Admin tidak adil (di luar mekanisme "kirim ulang")? — Owner: PM/Bisnis
- **Risk:** Recalculate skor secara realtime pada saat volume submission tinggi (mendekati cut-off) berpotensi membebani server. — Mitigation: pertimbangkan queue/job asynchronous untuk recalculate skor per madrasah, bukan seluruh sistem sekaligus.
- **Risk:** Link bukti fisik eksternal (misalnya Google Drive) bisa kedaluwarsa/dihapus Operator setelah disetujui. — Mitigation: pertimbangkan validasi berkala atau snapshot/backup metadata bukti di Phase 2.
- **Tradeoff:** Memilih arsitektur SPA (React + Vite) terpisah dari backend REST API (Express) demi UX yang lebih responsif (form multi-baris, filter leaderboard, modal validasi tanpa reload), dengan konsekuensi kompleksitas tambahan: perlu auth berbasis token (JWT) alih-alih session server tradisional, perlu strategi SEO/SSR terpisah jika halaman publik (leaderboard, profil madrasah) butuh optimasi mesin pencari, dan dua proses deployment terpisah (build statis frontend + proses Node PM2 untuk backend) yang perlu dikoordinasikan lewat Nginx.
- **Risk (baru):** Karena backend Express + PM2 berjalan sebagai proses Node yang terpisah dari web server, downtime/crash pada proses backend (di luar auto-restart PM2) dapat membuat seluruh fitur dinamis (login, submit, validasi) tidak berfungsi meski halaman statis React tetap ter-load. — Mitigation: aktifkan PM2 cluster mode + monitoring (`pm2 monit`/`pm2 logs`), pertimbangkan `pm2 startup` agar proses otomatis jalan saat server reboot.

---

## 19. Rollout & Next Steps

**MVP scope:**
- Includes: Auth custom (JWT + bcrypt) di Express, registrasi & approval Operator, input 9 indikator dengan draft/submit, validasi per baris (approve/reject/revoke + alasan), konfigurasi bobot, manajemen periode (termasuk cut-off & finalisasi), scoring & ranking realtime 6 kelompok, leaderboard & profil madrasah publik (dengan chart Chart.js/ApexCharts), export PDF/Excel, notifikasi in-app dasar, audit trail, permintaan hapus data.
- Excludes: aplikasi mobile, notifikasi email/SMS, analitik prediktif, kolaborasi real-time multi-user pada form yang sama.

**Phase 2+ ideas:**
- Notifikasi email/WhatsApp untuk event penting (submission ditolak, cut-off mendekat).
- Dashboard analitik tren mutu antarperiode untuk Admin (bukan sekadar histori skor per madrasah).
- API publik/opendata untuk integrasi dengan sistem Kemenag pusat.

**Sign-off needed from:**
- [ ] PM
- [ ] Engineering lead
- [ ] Design
- [ ] Kepala Seksi Pendma (Stakeholder Instansi)

**Next steps:**
- Finalisasi struktur tabel database (Section 8 & referensi entitas Section 32 dokumen sumber) — Owner: Eng, sebelum mulai Phase 1.
- Review UI/UX 3 zona (Publik/Operator/Admin) dengan mock data — Owner: Design.
- Validasi rumus scoring per indikator dengan Kepala Seksi Pendma sebelum implementasi `scoringService.js` — Owner: PM & Eng.
- Tentukan ORM/query layer (Prisma vs Sequelize/Knex) untuk backend Express sebelum mulai migrasi skema database — Owner: Eng, sebelum mulai Phase 1.
- Setup awal environment aaPanel (buat website Nginx + database MySQL + konfigurasi reverse proxy `/api`) dan konfigurasi PM2 (`ecosystem.config.js`) — Owner: Eng/Infra.
