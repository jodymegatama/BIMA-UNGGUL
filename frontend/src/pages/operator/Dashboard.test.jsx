import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import OperatorDashboard from './Dashboard.jsx';
import { apiFetch } from '../../lib/api';
import { sharedFlight } from '../../lib/singleFlight';

vi.mock('../../lib/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ token: 'tok', user: { role: 'operator' } }),
}));
vi.mock('../../context/OperatorContext', () => ({
  useOperator: () => ({
    periode: null,
    madrasah: { id: 7, slug: 'mpi-sukamaju', kelompok: 'A', nama: 'MPI Sukamaju' },
  }),
}));

const PERIODE = {
  id: 1,
  status: 'aktif',
  namaPeriode: '2026/2027',
  tanggalMulai: '2026-01-01T00:00:00.000Z',
  tanggalCutoff: '2026-12-31T00:00:00.000Z',
};

const STATS = { draft: 2, menunggu: 3, disetujui: 5, ditolak: 1 }; // total 11

// 7 notifikasi — Dashboard hanya menampilkan 5 pertama (slice(0, 5))
const NOTIFS = Array.from({ length: 7 }, (_, i) => ({
  id: 100 + i,
  tipe: `Tipe ${i + 1}`,
  pesan: `Pesan notifikasi ${i + 1}`,
  createdAt: '2026-09-29T03:00:00.000Z',
  statusBaca: i < 2 ? 'sudah_dibaca' : 'belum_dibaca',
}));

function stubApi({ indikator = true, notifications = true } = {}) {
  apiFetch.mockImplementation(async (path) => {
    if (path === '/api/operator/indikator') {
      if (!indikator) throw new Error('indikator gagal');
      return { stats: STATS, periode: PERIODE };
    }
    if (path === '/api/operator/submission-item') return []; // fallback: tidak ada baris
    if (path === '/api/notifications') {
      if (!notifications) throw new Error('notifikasi gagal');
      return NOTIFS;
    }
    if (path.startsWith('/api/madrasah/')) return { skor: { totalScore: 92.56 } };
    if (path.startsWith('/api/leaderboard')) {
      return { periode: PERIODE, rankings: [{ madrasah: { id: 7 }, ranking: 2, totalScore: 92.56 }] };
    }
    throw new Error(`endpoint tak dikenal: ${path}`);
  });
}

function renderPage(strict = false) {
  const page = <OperatorDashboard />;
  return render(<MemoryRouter>{strict ? <StrictMode>{page}</StrictMode> : page}</MemoryRouter>);
}

const calls = (path) => apiFetch.mock.calls.filter(([p]) => p === path).length;

describe('Dashboard operator — deadlock notifikasi & pemuatan statistik', () => {
  beforeEach(() => {
    sharedFlight.reset();
    apiFetch.mockReset();
    stubApi();
  });

  it('kartu statistik SELESAI memuat dan notifikasi terpetakan benar', async () => {
    // Regresi: notifikasi pernah dibungkus sharedFlight.run LAGI di atas
    // fetchNotifications() yang sudah single-flight → run() mengembalikan promise
    // pembungkusnya sendiri, sehingga `await` menunggu diri sendiri tanpa akhir.
    // Akibatnya setLoading(false) tak pernah jalan: kartu statistik macet di "…"
    // dan panel notifikasi kosong selamanya.
    renderPage();

    // 1) loading selesai → tidak ada placeholder "…" di kartu nilai
    await waitFor(() => expect(screen.queryByText('Memuat…')).not.toBeInTheDocument());
    expect(screen.queryByText('…')).not.toBeInTheDocument();

    // 2) statistik benar-benar terpetakan (bukan angka nol default)
    expect(screen.getByText(`Disetujui ${STATS.disetujui}/11 baris`)).toBeInTheDocument();

    // 3) notifikasi terpetakan dari respons mentah: judul ← tipe, desc ← pesan
    await waitFor(() => expect(screen.getByText('Tipe 1')).toBeInTheDocument());
    expect(screen.getByText('Pesan notifikasi 1')).toBeInTheDocument();
    expect(screen.getByText('5 terbaru')).toBeInTheDocument(); // hanya 5 pertama

    // 4) batas 5 benar-benar dipotong (notifikasi ke-6/7 tidak bocor ke DOM)
    expect(screen.queryByText('Tipe 6')).not.toBeInTheDocument();
    expect(screen.queryByText('Tipe 7')).not.toBeInTheDocument();
  });

  it('masih selesai memuat walau notifikasi gagal (tidak ada promise menggantung)', async () => {
    stubApi({ notifications: false });
    renderPage();

    // Gagal ≠ deadlock: loading harus tetap selesai dan panel masuk state kosong
    await waitFor(() => expect(screen.getByText('Belum ada notifikasi.')).toBeInTheDocument());
    expect(screen.getByText(`Disetujui ${STATS.disetujui}/11 baris`)).toBeInTheDocument();
  });

  it('fallback ke submission-item bila endpoint indikator gagal', async () => {
    stubApi({ indikator: false });
    apiFetch.mockImplementation(async (path) => {
      if (path === '/api/operator/submission-item') {
        return [
          { id: 1, status: 'draft' },
          { id: 2, status: 'menunggu' },
          { id: 3, status: 'menunggu' },
          { id: 4, status: 'disetujui' },
        ];
      }
      if (path === '/api/notifications') return NOTIFS;
      if (path.startsWith('/api/madrasah/')) return { skor: { totalScore: 50 } };
      if (path.startsWith('/api/leaderboard')) return { periode: PERIODE, rankings: [] };
      throw new Error(`endpoint tak dikenal: ${path}`);
    });

    renderPage();

    // draft 1 + menunggu 2 + disetujui 1 → total 4
    await waitFor(() => expect(screen.getByText('Disetujui 1/4 baris')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Tipe 1')).toBeInTheDocument());
  });

  it('sumber data tetap SEKALI walau effect berjalan dobel (StrictMode)', async () => {
    renderPage(true);

    await waitFor(() => expect(screen.getByText('Tipe 1')).toBeInTheDocument());

    expect(calls('/api/operator/indikator')).toBe(1);
    expect(calls('/api/operator/submission-item')).toBe(1);
    expect(calls('/api/notifications')).toBe(1);
    expect(screen.getByText('5 terbaru')).toBeInTheDocument();
  });
});