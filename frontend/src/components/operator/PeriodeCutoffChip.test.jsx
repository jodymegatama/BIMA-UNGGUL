import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PeriodeCutoffChip from './PeriodeCutoffChip.jsx';
import { urgency } from '../../lib/periode';

// Anchor deterministik
const NOW = new Date('2026-09-29T03:00:00.000Z');
const iso = (s) => new Date(s).toISOString();
const P = (over = {}) => ({ namaPeriode: '2026/2027', status: null, tanggalMulai: iso('2026-09-01T00:00:00Z'), tanggalCutoff: iso('2026-12-31T00:00:00Z'), ...over });

describe('PeriodeCutoffChip', () => {
  it('tidak merender apa pun tanpa periode', () => {
    const { container } = render(<PeriodeCutoffChip periode={null} now={NOW} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('varian normal: tampilkan tanggal cut-off + sisa hari', () => {
    render(<PeriodeCutoffChip periode={P()} now={NOW} />);
    expect(screen.getByText(/Cut-off/)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('varian danger (≤3 hari): teks sisa hari tetap tampil', () => {
    const p = P({ tanggalCutoff: iso('2026-10-02T00:00:00Z') }); // 2d21h → ceil 3
    expect(urgency(p, NOW)).toBe('danger');
    render(<PeriodeCutoffChip periode={p} now={NOW} />);
    expect(screen.getByText(/Cut-off/)).toBeInTheDocument();
    expect(screen.getByText(/3 hari lagi|Hari ini|Besok/)).toBeInTheDocument();
  });

  it('varian closed (lewat cut-off): label "Periode ditutup"', () => {
    const p = P({ tanggalCutoff: iso('2026-09-28T00:00:00Z') });
    expect(urgency(p, NOW)).toBe('closed');
    render(<PeriodeCutoffChip periode={p} now={NOW} />);
    expect(screen.getByText(/Periode ditutup/)).toBeInTheDocument();
  });

  it('varian closed via status finalisasi (override tanggal)', () => {
    render(<PeriodeCutoffChip periode={P({ status: 'finalisasi', tanggalCutoff: iso('2026-12-31T00:00:00Z') })} now={NOW} />);
    expect(screen.getByText(/Periode ditutup/)).toBeInTheDocument();
  });

  it('varian upcoming: belum dimulai', () => {
    const p = P({ tanggalMulai: iso('2026-10-10T00:00:00Z') });
    expect(urgency(p, NOW)).toBe('upcoming');
    render(<PeriodeCutoffChip periode={p} now={NOW} />);
    expect(screen.getByText(/Periode dimulai/)).toBeInTheDocument();
  });

  it('compact: hanya countdown, tanpa tanggal panjang', () => {
    render(<PeriodeCutoffChip periode={P()} now={NOW} compact />);
    expect(screen.getByText(/^Cut-off \d+ hari lagi$/)).toBeInTheDocument();
  });
});
