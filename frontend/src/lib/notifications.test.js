import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNotifications, fetchNotificationsRaw } from './notifications.js';
import { sharedFlight } from './singleFlight';
import { apiFetch } from './api';

vi.mock('./api', () => ({ apiFetch: vi.fn() }));

const RAW = [
  {
    id: 1,
    tipe: 'submission_approved',
    pesan: 'Capaian disetujui',
    createdAt: '2026-09-29T03:00:00.000Z',
    statusBaca: 'sudah_dibaca',
  },
];

describe('lib/notifications', () => {
  beforeEach(() => {
    sharedFlight.reset();
    apiFetch.mockReset();
    apiFetch.mockResolvedValue(RAW);
  });

  it('dua pemanggil fetchNotifications konkuren berbagi satu request', async () => {
    const [a, b] = await Promise.all([fetchNotifications(), fetchNotifications()]);

    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(a[0]).toMatchObject({ id: 1, judul: 'submission_approved', read: true });
  });

  it('fetchNotifications tidak menggantung saat dibungkus pemanggil lain (kontrak sharedFlight)', async () => {
    // Regresi: dulu Dashboard membungkus `sharedFlight.run(key, () => fetchNotifications())`
    // sementara fetchNotifications sendiri sudah memakai sharedFlight dengan key sama →
    // promise menunggu dirinya sendiri. Test ini akan kehabisan waktu bila terulang.
    const [mapped, raw] = await Promise.all([fetchNotifications(), fetchNotificationsRaw()]);

    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(Array.isArray(raw)).toBe(true);
    // pemetaan tetap benar untuk kedua bentuk pemakaian
    expect(raw[0]).toHaveProperty('tipe');
    expect(mapped[0]).toHaveProperty('judul');
  });

  it('setelah settle, request berikutnya boleh jalan lagi (bukan cache)', async () => {
    await fetchNotifications();
    await fetchNotifications();
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
