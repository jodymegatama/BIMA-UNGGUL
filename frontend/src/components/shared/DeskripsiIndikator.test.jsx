import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DeskripsiIndikator from './DeskripsiIndikator';

describe('Deskripsi Indikator', () => {
  it('menampilkan paragraf dan markup sebagai teks aman', () => {
    const { container } = render(<DeskripsiIndikator deskripsi={'Tujuan indikator\n<script>alert(1)</script>'} />);
    expect(screen.getByText('Deskripsi Indikator')).toBeInTheDocument();
    expect(container.textContent).toContain('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
  });
  it('ringkasan memiliki tautan ke indikator yang benar dan panel dapat dibuka', () => {
    const { rerender, container } = render(<DeskripsiIndikator deskripsi="Informasi" ringkas href="/tentang#indikator-baru" />);
    expect(screen.getByRole('link', { name: 'Baca selengkapnya' })).toHaveAttribute('href', '/tentang#indikator-baru');
    rerender(<DeskripsiIndikator deskripsi="Informasi periode" collapsible />);
    fireEvent.click(screen.getByText('Info indikator'));
    expect(container.querySelector('details')).toHaveAttribute('open');
  });
});
