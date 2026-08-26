import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouteErrorBoundary from './components/RouteErrorBoundary.jsx';

function Boom() {
  throw new Error('kaboom');
}

describe('RouteErrorBoundary', () => {
  it('menampilkan fallback saat child crash (bukan white screen)', () => {
    // suppress error log React utk test ini
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText(/terjadi kesalahan/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('me-render child normal saat tidak ada error', () => {
    render(
      <RouteErrorBoundary>
        <p>halaman aman</p>
      </RouteErrorBoundary>,
    );
    expect(screen.getByText('halaman aman')).toBeInTheDocument();
  });
});
