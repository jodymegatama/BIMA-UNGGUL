import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CapaianRow from './CapaianRow';

describe('form guru bersertifikasi', () => {
  it.each([[8, 10, '8 dari 10 = 80%'], [0, 0, '0 dari 0 = 0%']])('menampilkan isian dan pratinjau %i/%i', (pembilang, penyebut, preview) => {
    render(<CapaianRow row={{ id: 'test', pembilang, penyebut }} indikatorKode="guru_bersertifikasi" onChange={() => {}} onRemove={() => {}} />);
    expect(screen.getByRole('spinbutton', { name: 'Jumlah guru bersertifikasi' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Jumlah total guru' })).toHaveAttribute('min', '0');
    expect(screen.getByText(preview)).toBeInTheDocument();
  });
});
