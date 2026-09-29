/**
 * Helper periode penilaian untuk zona Operator.
 * SATU SUMBER logika status/cut-off di sisi klien — pola setara deriveStatus()
 * (backend/src/services/periodService.js) + countdown() admin (ManajemenPeriode.jsx)
 * + deriveStatusClient() publik (Leaderboard.jsx), dipakai oleh PeriodeCutoffChip & halaman operator.
 *
 * Semua fungsi murni (tanpa import) agar mudah di-unit-test.
 */

// Selaras backend periode.constants.js — status historis TIDAK bisa "jalan" (input ditutup).
export const STATUS_HISTORI_PERIODE = ['finalisasi', 'arsip', 'penyelesaian_validasi'];

export const STATUS_LABEL = {
  belum_dimulai: 'Belum dimulai',
  aktif: 'Aktif',
  cutoff: 'Cut-off',
  finalisasi: 'Finalisasi',
  arsip: 'Arsip',
  penyelesaian_validasi: 'Penyelesaian Validasi',
};

/**
 * Derive status efektif periode di sisi klien.
 * Prioritas: status historis manual (finalisasi/arsip/dll) menang atas derive tanggal —
 * kontrak sama dengan deriveStatus() backend.
 * @param {{status?: string|null, tanggalMulai?: string|null, tanggalCutoff?: string|null}|null} p
 * @returns {'belum_dimulai'|'aktif'|'cutoff'|'finalisasi'|'arsip'|'penyelesaian_validasi'|null}
 */
export function deriveStatusClient(p) {
  if (!p) return null;
  if (STATUS_HISTORI_PERIODE.includes(p.status)) return p.status;
  const now = Date.now();
  const mulai = p.tanggalMulai ? new Date(p.tanggalMulai).getTime() : null;
  const cutoff = p.tanggalCutoff ? new Date(p.tanggalCutoff).getTime() : null;
  if (mulai != null && now < mulai) return 'belum_dimulai';
  if (cutoff != null && now > cutoff) return 'cutoff';
  return 'aktif';
}

/**
 * Sisa hari sampai cut-off (ceil, konsisten countdown admin ManajemenPeriode.jsx).
 * @param {string|Date|null} iso
 * @param {Date} [now] — override untuk test
 * @returns {number|null} negatif = sudah lewat; null bila tidak ada tanggal
 */
export function daysUntilCutoff(iso, now = new Date()) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - now.getTime();
  if (Number.isNaN(diff)) return null;
  return Math.ceil(diff / 86400000);
}

/**
 * Format tanggal+jam Indonesia utk tooltip/detail chip.
 * @param {string|Date|null} iso
 * @returns {string|null}
 */
export function formatTanggal(iso, withTime = false) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const tanggal = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!withTime) return tanggal;
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${tanggal} • ${jam}`;
}

/**
 * Tingkat urgensi untuk styling chip/banner:
 * - 'normal'  : aktif, cut-off > 7 hari
 * - 'warning' : aktif, sisa 4–7 hari
 * - 'danger'  : aktif, sisa ≤ 3 hari (termasuk hari-H)
 * - 'closed'  : sudah lewat cut-off ATAU status historis (finalisasi/arsip/dll)
 * - 'upcoming': belum dimulai
 * @param {{status?: string|null, tanggalMulai?: string|null, tanggalCutoff?: string|null}|null} p
 * @param {Date} [now] — override untuk test
 * @returns {'normal'|'warning'|'danger'|'closed'|'upcoming'|null}
 */
export function urgency(p, now = new Date()) {
  const st = deriveStatusClient(p);
  if (st == null) return null;
  if (st === 'belum_dimulai') return 'upcoming';
  if (st !== 'aktif') return 'closed';
  const days = daysUntilCutoff(p.tanggalCutoff, now);
  if (days == null) return 'normal';
  if (days < 0) return 'closed'; // guard: tanggal bilang aktif tapi sudah lewat
  if (days <= 3) return 'danger';
  if (days <= 7) return 'warning';
  return 'normal';
}

/**
 * Teks pendek sisa waktu utk chip — calendar-day-aware (lebih akurat dari ceil mentah):
 * hari kalender yang sama → 'Hari ini', esok → 'Besok', else ceil hari.
 * (Versi countdown() admin hanya 'Hari ini' saat diff ≤ 0 — praktis tak pernah tampil.)
 * @param {string|Date|null} iso
 * @param {Date} [now]
 * @returns {string|null}
 */
export function countdownText(iso, now = new Date()) {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const nextDay = (a, b) => { const t = new Date(a); t.setDate(t.getDate() + 1); return sameDay(t, b); };
  if (target.getTime() <= now.getTime()) return 'Sudah lewat';
  if (sameDay(now, target)) return 'Hari ini';
  if (nextDay(now, target)) return 'Besok';
  const days = daysUntilCutoff(iso, now);
  return days != null ? `${days} hari lagi` : null;
}

export default { deriveStatusClient, daysUntilCutoff, formatTanggal, urgency, countdownText, STATUS_HISTORI_PERIODE, STATUS_LABEL };
