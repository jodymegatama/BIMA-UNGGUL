import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IndikatorTabs from './IndikatorTabs.jsx';

const LIST = [
  { kode: 'diklat', nama: 'Diklat', short: 'Diklat' },
  { kode: 'organisasi', nama: 'Organisasi', short: 'Organisasi' },
];

describe('IndikatorTabs — badge draft', () => {
  it('menampilkan badge angka draft saat draftCounts tersedia', () => {
    render(<IndikatorTabs activeKode="diklat" onChange={vi.fn()} indikatorList={LIST} draftCounts={{ diklat: 3 }} />);
    const badge = screen.getByTestId('draft-badge-diklat');
    expect(badge).toHaveTextContent('3');
    expect(badge.getAttribute('aria-label')).toBe('Ada 3 draf tersimpan');
  });

  it('tidak menampilkan badge pada indikator tanpa draft', () => {
    render(<IndikatorTabs activeKode="diklat" onChange={vi.fn()} indikatorList={LIST} draftCounts={{ diklat: 2 }} />);
    expect(screen.queryByTestId('draft-badge-organisasi')).not.toBeInTheDocument();
  });

  it('onChange dipanggil saat pointerdown (kebal render storm)', () => {
    const onChange = vi.fn();
    render(<IndikatorTabs activeKode="diklat" onChange={onChange} indikatorList={LIST} />);
    const tab = screen.getByText('Organisasi');
    fireEvent.pointerDown(tab, { pointerType: 'mouse' });
    expect(onChange).toHaveBeenCalledWith('organisasi');
  });

  it('click mouse TIDAK memicu onChange kedua (sudah ditangani pointerdown)', () => {
    const onChange = vi.fn();
    render(<IndikatorTabs activeKode="diklat" onChange={onChange} indikatorList={LIST} />);
    const tab = screen.getByText('Organisasi');
    fireEvent.pointerDown(tab, { pointerType: 'mouse' });
    fireEvent.click(tab, { detail: 1 });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keyboard (Enter) tetap memicu onChange via click tanpa detail', () => {
    const onChange = vi.fn();
    render(<IndikatorTabs activeKode="diklat" onChange={onChange} indikatorList={LIST} />);
    const tab = screen.getByText('Organisasi');
    fireEvent.click(tab, { detail: 0 });
    expect(onChange).toHaveBeenCalledWith('organisasi');
  });

  it('onChange tetap terpanggil saat tab diklik (fallback tanpa pointerType)', () => {
    const onChange = vi.fn();
    render(<IndikatorTabs activeKode="diklat" onChange={onChange} indikatorList={LIST} />);
    fireEvent.click(screen.getByText('Organisasi'));
    // fireEvent.click default detail=0 → diperlakukan sebagai keyboard path, tetap memicu
    expect(onChange).toHaveBeenCalledWith('organisasi');
  });
});
