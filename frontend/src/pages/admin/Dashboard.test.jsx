import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AdminDashboard from './Dashboard.jsx';
import { apiGet, apiFetch } from '../../lib/api';
import { sharedFlight } from '../../lib/singleFlight';

vi.mock('../../lib/api', () => ({ apiFetch: vi.fn(), apiGet: vi.fn() }));

const PERIODE = {
  id: 1,
  status: 'aktif',
  namaPeriode: '2026/2027',
  tanggalMulai: '2026-01-01T00:00:00.000Z',
  tanggalCutoff: '2026-12-31T00:00:00.000Z',
};

function countCalls(path) {
  return apiFetch.mock.calls.filter(([p]) => p === path).length;
}

describe('Dashboard admin — single-flight', () => {
  beforeEach(() => {
    sharedFlight.reset();
    apiFetch.mockReset();
    apiGet.mockReset();
    apiFetch.mockImplementation(async (path) => {
      if (path === '/api/admin/periode') return { data: [PERIODE] };
      return { total: 3, data: [] };
    });
    apiGet.mockResolvedValue({ rankings: {} });
  });

  it('memuat tiap sumber SEKALI walau effect berjalan dobel (StrictMode)', async () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => expect(screen.getByText('2026/2027')).toBeInTheDocument());

    expect(countCalls('/api/admin/periode')).toBe(1);
    expect(countCalls('/api/admin/validasi?status=menunggu&page=1&limit=1')).toBe(1);
    expect(countCalls('/api/admin/validasi?status=disetujui&page=1&limit=1')).toBe(1);
    expect(countCalls('/api/admin/validasi?page=1&limit=1')).toBe(1);
    expect(countCalls('/api/admin/validasi?status=menunggu&page=1&limit=500')).toBe(1);
    expect(apiGet.mock.calls.filter(([p]) => p === '/api/leaderboard')).toHaveLength(1);
  });

  it('dua instance konkuren berbagi satu request per sumber', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText('2026/2027').length).toBe(2));

    expect(countCalls('/api/admin/periode')).toBe(1);
    expect(countCalls('/api/admin/validasi?page=1&limit=1')).toBe(1);
  });
});
