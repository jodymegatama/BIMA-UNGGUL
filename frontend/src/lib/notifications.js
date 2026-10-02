import { apiFetch } from './api';
import { sharedFlight, getKey } from './singleFlight';

/**
 * GET /api/notifications — RESPONS MENTAH, di-dedup lintas komponen.
 *
 * TopBar operator & admin (polling 30s + refetch saat tab kembali fokus),
 * Dashboard operator, dan halaman Notifikasi memuat endpoint ini di halaman yang
 * sama. Tanpa dedup, masing-masing memicu request sendiri lalu setState-nya
 * bergantian → render storm yang bisa menelan klik pengguna.
 *
 * Modul netral (bukan operatorData) karena dipakai kedua zona.
 * Setiap pemanggil tetap memetakan responsnya sendiri — bentuk itemnya berbeda.
 */
export function fetchNotificationsRaw() {
  return sharedFlight.run(getKey('/api/notifications'), () => apiFetch('/api/notifications', { auth: true }));
}

/** Bentuk item untuk Dashboard operator: { id, judul, desc, time, read }. */
export async function fetchNotifications() {
  const data = await fetchNotificationsRaw();
  const arr = Array.isArray(data) ? data : (data.data || []);
  return arr.map((n) => ({
    id: n.id,
    judul: n.tipe || 'Notifikasi',
    desc: n.pesan || '',
    time: n.createdAt ? new Date(n.createdAt).toLocaleString('id-ID') : '',
    read: n.statusBaca === 'sudah_dibaca',
  }));
}

export default { fetchNotificationsRaw, fetchNotifications };
