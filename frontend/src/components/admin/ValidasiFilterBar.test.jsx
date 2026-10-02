import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ValidasiFilterBar from './ValidasiFilterBar.jsx';

const FILTERS = { status: 'Menunggu', indikator: 'Semua', periode: '2026/2027', q: '', kelompok: 'Semua' };

describe('ValidasiFilterBar — chip kelompok', () => {
  it('memilih kelompok saat pointerdown (kebal swap DOM tabel)', () => {
    const onChange = vi.fn();
    render(<ValidasiFilterBar filters={FILTERS} onChange={onChange} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'MI Negeri' }), { pointerType: 'mouse' });

    expect(onChange).toHaveBeenCalledWith({ ...FILTERS, kelompok: 'MI Negeri' });
  });

  it('klik mouse tidak menggandakan seleksi', () => {
    const onChange = vi.fn();
    render(<ValidasiFilterBar filters={FILTERS} onChange={onChange} />);

    const chip = screen.getByRole('button', { name: 'MA Swasta' });
    fireEvent.pointerDown(chip, { pointerType: 'mouse' });
    fireEvent.click(chip, { detail: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keyboard (Enter/Space) tetap memicu lewat click tanpa detail', () => {
    const onChange = vi.fn();
    render(<ValidasiFilterBar filters={FILTERS} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'MTs Negeri' }), { detail: 0 });

    expect(onChange).toHaveBeenCalledWith({ ...FILTERS, kelompok: 'MTs Negeri' });
  });

  it('tombol Reset tidak terpengaruh (tetap onClick biasa)', () => {
    const onChange = vi.fn();
    render(<ValidasiFilterBar filters={FILTERS} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onChange).toHaveBeenCalledWith({ status: 'Menunggu', indikator: 'Semua', periode: '2026/2027', q: '', kelompok: 'Semua' });
  });
});
