import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import RiwayatSubmission from './RiwayatSubmission.jsx';
import { apiFetch } from '../../lib/api';
import { sharedFlight } from '../../lib/singleFlight';

vi.mock('../../lib/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../../context/OperatorContext', () => ({
  useOperator: () => ({ periode: null, madrasah: null }),
}));

const ROWS = [
  {
    id: 1,
    status: 'draft',
    namaKegiatan: 'Workshop Kurikulum',
    indikator: { slug: 'diklat', nama: 'Diklat' },
    updatedAt: '2026-09-29T03:00:00.000Z',
  },
  {
    id: 2,
    status: 'menunggu',
    namaKegiatan: 'Pelatihan Guru',
    indikator: { slug: 'diklat', nama: 'Diklat' },
    updatedAt: '2026-09-28T03:00:00.000Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <RiwayatSubmission />
    </MemoryRouter>
  );
}

describe('RiwayatSubmission', () => {
  beforeEach(() => {
    sharedFlight.reset();
    apiFetch.mockReset();
    apiFetch.mockResolvedValue(ROWS);
  });

  it('memuat riwayat hanya SEKALI walau effect berjalan dobel (StrictMode)', async () => {
    // StrictMode (dev) menjalankan effect dua kali per mount — dulu ini menggandakan
    // setiap fetch di halaman ini.
    render(
      <StrictMode>
        <MemoryRouter>
          <RiwayatSubmission />
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => expect(screen.getAllByText('Workshop Kurikulum').length).toBeGreaterThan(0));

    const riwayatCalls = apiFetch.mock.calls.filter(([p]) => p === '/api/operator/submission-item');
    expect(riwayatCalls).toHaveLength(1);
  });

  it('dua komponen konkuren berbagi satu request sumber yang sama', async () => {
    render(
      <MemoryRouter>
        <RiwayatSubmission />
        <RiwayatSubmission />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Workshop Kurikulum').length).toBe(2));

    const riwayatCalls = apiFetch.mock.calls.filter(([p]) => p === '/api/operator/submission-item');
    expect(riwayatCalls).toHaveLength(1);
  });

  it('chip filter terpilih saat pointerdown (kebal swap DOM)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Workshop Kurikulum').length).toBeGreaterThan(0));

    const chip = screen.getByRole('button', { name: 'Disetujui' });
    fireEvent.pointerDown(chip, { pointerType: 'mouse' });

    // filter aktif → ringkasan "N baris • Disetujui" diperbarui
    await waitFor(() => expect(screen.getByText(/•\s*Disetujui/)).toBeInTheDocument());
  });

  it('klik mouse tidak menggandakan seleksi chip', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Workshop Kurikulum').length).toBeGreaterThan(0));

    const chip = screen.getByRole('button', { name: 'Menunggu' });
    fireEvent.pointerDown(chip, { pointerType: 'mouse' });
    fireEvent.click(chip, { detail: 1 });

    await waitFor(() => expect(screen.getByText(/•\s*Menunggu/)).toBeInTheDocument());
    // hanya baris Menunggu yang tampil
    expect(screen.queryByText('Workshop Kurikulum')).not.toBeInTheDocument();
    expect(screen.getByText('Pelatihan Guru')).toBeInTheDocument();
  });
});