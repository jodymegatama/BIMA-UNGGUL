import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ValidasiDetailModal from './ValidasiDetailModal';

describe('Detail validasi mengikuti konfigurasi indikator periode', () => {
  it('menampilkan deskripsi periode dan label field admin pada indikator tambahan', () => {
    render(<ValidasiDetailModal item={{ id: 10, indikatorNama: 'Indikator tambahan', status: 'Menunggu', namaKegiatan: 'Contoh', tanggalSubmit: new Date().toISOString(),
      indikatorConfig: { deskripsi: 'Penjelasan periode untuk pemeriksaan', fields: [{ key: 'jumlah', type: 'number', label: 'Jumlah lulusan tambahan' }] }, _raw: { jumlah: 7 } }} onClose={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} onRevoke={vi.fn()} />);
    expect(screen.getByText('Jumlah lulusan tambahan')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Info indikator'));
    expect(screen.getByText('Penjelasan periode untuk pemeriksaan')).toBeVisible();
  });
});
