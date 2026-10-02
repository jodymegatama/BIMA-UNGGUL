import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DraftPanel from './DraftPanel.jsx';

const DRAFTS = [
  { id: 11, indikatorKode: 'diklat', namaKegiatan: 'Workshop Kurikulum', updatedAt: '2026-09-29T03:00:00.000Z' },
  { id: 12, indikatorKode: 'diklat', namaKegiatan: 'Pelatihan Guru Penggerak', updatedAt: '2026-09-28T03:00:00.000Z' },
];

describe('DraftPanel', () => {
  it('tidak merender apa pun saat tidak ada draft dan tidak loading', () => {
    const { container } = render(<DraftPanel drafts={[]} unsavedCount={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('tetap tampil saat loading walau belum ada draft', () => {
    render(<DraftPanel drafts={[]} unsavedCount={0} loading />);
    expect(screen.getByTestId('draft-panel')).toBeInTheDocument();
    expect(screen.getByText(/Memuat draft tersimpan/)).toBeInTheDocument();
  });

  it('menampilkan jumlah draft di badge', () => {
    render(<DraftPanel drafts={DRAFTS} />);
    expect(screen.getByTestId('draft-count')).toHaveTextContent('2');
  });

  it('merender daftar draft dengan nama kegiatan & tombol aksi', () => {
    const onContinue = vi.fn();
    const onDelete = vi.fn();
    render(<DraftPanel drafts={DRAFTS} onContinue={onContinue} onDelete={onDelete} />);

    expect(screen.getByText('Workshop Kurikulum')).toBeInTheDocument();
    expect(screen.getByText('Pelatihan Guru Penggerak')).toBeInTheDocument();
    expect(screen.getAllByText(/Terakhir diubah/)).toHaveLength(2);

    fireEvent.click(screen.getAllByText('Lanjutkan')[0]);
    expect(onContinue).toHaveBeenCalledWith(11);

    fireEvent.click(screen.getAllByText('Hapus')[0]);
    expect(onDelete).toHaveBeenCalledWith(DRAFTS[0]);
  });

  it('menampilkan tag baris baru yang belum tersimpan', () => {
    render(<DraftPanel drafts={DRAFTS} unsavedCount={3} />);
    expect(screen.getByText(/3 baris baru belum tersimpan/)).toBeInTheDocument();
  });

  it('collapse menyembunyikan daftar tapi mempertahankan header (mode terkontrol)', async () => {
    const { rerender } = render(<DraftPanel drafts={DRAFTS} open />);
    expect(screen.getByText('Workshop Kurikulum')).toBeInTheDocument();

    rerender(<DraftPanel drafts={DRAFTS} open={false} />);
    // aria-expanded langsung berubah — sinyal state, tak tergantung timing animasi
    expect(screen.getByRole('button', { name: /Draft Tersimpan/i })).toHaveAttribute('aria-expanded', 'false');
    // Isi panel keluar setelah animasi exit AnimatePresence selesai
    await waitFor(
      () => expect(screen.queryByText('Workshop Kurikulum')).not.toBeInTheDocument(),
      { timeout: 1500 }
    );
    expect(screen.getByText(/Draft Tersimpan/)).toBeInTheDocument();
  });

  it('fallback dot: draft tanpa id numerik tetap memicu panel via unsavedCount saja', () => {
    render(<DraftPanel drafts={[]} unsavedCount={1} />);
    expect(screen.getByTestId('draft-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('draft-count')).not.toBeInTheDocument();
  });
});
