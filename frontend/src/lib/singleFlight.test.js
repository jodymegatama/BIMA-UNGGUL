import { describe, it, expect, vi } from 'vitest';
import { createSingleFlight, getKey } from './singleFlight.js';

describe('createSingleFlight', () => {
  it('pemanggil konkuren dengan key sama berbagi satu promise', async () => {
    const sf = createSingleFlight();
    const fn = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return 'data';
    });

    const [a, b] = await Promise.all([sf.run('k', fn), sf.run('k', fn)]);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(a).toBe('data');
    expect(a).toBe(b);
  });

  it('key berbeda berjalan sendiri-sendiri', async () => {
    const sf = createSingleFlight();
    const fn = vi.fn(async () => 'x');
    await Promise.all([sf.run('a', fn), sf.run('b', fn)]);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('setelah settle, key boleh dijalankan lagi (bukan cache)', async () => {
    const sf = createSingleFlight();
    const fn = vi.fn(async () => 'x');
    await sf.run('k', fn);
    await sf.run('k', fn);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sf.size()).toBe(0);
  });

  it('kegagalan juga membersihkan registry', async () => {
    const sf = createSingleFlight();
    const fn = vi.fn(async () => {
      throw new Error('boom');
    });
    await expect(sf.run('k', fn)).rejects.toThrow('boom');
    expect(sf.size()).toBe(0);
    await expect(sf.run('k', fn)).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('key null selalu menjalankan fn (tanpa dedup)', async () => {
    const sf = createSingleFlight();
    const fn = vi.fn(async () => 'x');
    await Promise.all([sf.run(null, fn), sf.run(null, fn)]);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('getKey menandai request sebagai GET idempoten', () => {
    expect(getKey('/api/operator/indikator')).toBe('GET /api/operator/indikator');
  });
});
