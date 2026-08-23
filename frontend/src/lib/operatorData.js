import { apiFetch } from './api';

/**
 * Helper data Operator — sumber tunggal profil + skor + ranking.
 * Semua endpoint nyata; halaman harus degrade gracefully saat backend belum siap.
 */

// GET /api/operator/madrasah → row madrasah milik operator login
export async function fetchOwnMadrasah() {
  const m = await apiFetch('/api/operator/madrasah', { auth: true });
  return {
    id: m.id,
    nama: m.namaMadrasah || '-',
    bmuId: m.nomorMadrasah || '-',
    jenjang: m.jenjang || '-',
    status: m.statusKepemilikan || '-',
    kelompok: m.kelompok || '-',
    jumlahSiswa: m.jumlahSiswa ?? null,
    alamat: m.alamat || '-',
    slug: m.slug || '',
    updatedAt: m.updatedAt,
  };
}

// GET /api/madrasah/:slug (public) → { madrasah, periode, skor: { totalScore, breakdown }, prestasi }
export async function fetchSkorDetail(slug) {
  if (!slug) return null;
  return apiFetch(`/api/madrasah/${encodeURIComponent(slug)}`, { auth: false });
}

// GET /api/leaderboard?kelompok=X (public) → rank madrasahId dalam kelompok
export async function fetchRank(kelompok, madrasahId) {
  if (!kelompok || !madrasahId) return null;
  const res = await apiFetch(`/api/leaderboard?kelompok=${encodeURIComponent(kelompok)}`, { auth: false });
  const list = Array.isArray(res?.rankings) ? res.rankings : [];
  const idx = list.findIndex((r) => r.madrasah && Number(r.madrasah.id) === Number(madrasahId));
  if (idx === -1) return { rank: null, total: list.length, periode: res.periode?.namaPeriode || '', updatedAt: null };
  const me = list[idx];
  return {
    rank: me.ranking ?? idx + 1,
    total: list.length,
    skor: me.totalScore != null ? Math.round(me.totalScore) : null,
    kelompok,
    periode: res.periode?.namaPeriode || '',
    updatedAt: me.lastApprovedAt || res.periode?.updatedAt || null,
  };
}

// GET /api/notifications → daftar notifikasi user login
export async function fetchNotifications() {
  const data = await apiFetch('/api/notifications', { auth: true });
  const arr = Array.isArray(data) ? data : (data.data || []);
  return arr.map((n) => ({
    id: n.id,
    judul: n.tipe || 'Notifikasi',
    desc: n.pesan || '',
    time: n.createdAt ? new Date(n.createdAt).toLocaleString('id-ID') : '',
    read: n.statusBaca === 'sudah_dibaca',
  }));
}
