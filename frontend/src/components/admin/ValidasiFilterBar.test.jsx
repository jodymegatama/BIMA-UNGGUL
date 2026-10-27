import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ValidasiFilterBar from './ValidasiFilterBar.jsx';

const FILTERS = { status: 'Menunggu', indikator: 'Semua', periode: '2026/2027', q: '', kelompok: 'Semua' };

describe('ValidasiFilterBar — chip kelompok', () => {
  it('menyediakan RA dan empat kelompok saja', () => {
    render(<ValidasiFilterBar filters={FILTERS} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'RA' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: 'MI Negeri' })).not.toBeInTheDocument();
  });
  it('memilih kelompok saat pointerdown (kebal swap DOM tabel)', () => {
    const onChange = vi.fn();
    render(<ValidasiFilterBar filters={FILTERS} onChange={onChange} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'MI' }), { pointerType: 'mouse' });

    expect(onChange).toHaveBeenCalledWith({ ...FILTERS, kelompok: 'MI' });
  });

  it('klik mouse tidak menggandakan seleksi', () => {
    const onChange = vi.fn();
    render(<ValidasiFilterBar filters={FILTERS} onChange={onChange} />);

    const chip = screen.getByRole('button', { name: 'MA' });
    fireEvent.pointerDown(chip, { pointerType: 'mouse' });
    fireEvent.click(chip, { detail: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keyboard (Enter/Space) tetap memicu lewat click tanpa detail', () => {
    const onChange = vi.fn();
    render(<ValidasiFilterBar filters={FILTERS} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'MTS' }), { detail: 0 });

    expect(onChange).toHaveBeenCalledWith({ ...FILTERS, kelompok: 'MTs' });
  });

  it('tombol Reset tidak terpengaruh (tetap onClick biasa)', () => {
    const onChange = vi.fn();
    render(<ValidasiFilterBar filters={FILTERS} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onChange).toHaveBeenCalledWith({ status: 'Menunggu', indikator: 'Semua', periode: '2026/2027', q: '', kelompok: 'Semua' });
  });
});
