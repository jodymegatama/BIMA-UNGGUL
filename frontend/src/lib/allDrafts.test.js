import { describe, it, expect } from 'vitest';
import { collectServerDrafts, groupDraftsByKode } from './allDrafts';

const DATA = {
  diklat: [
    { id: 1, namaKegiatan: 'A' },
    { id: 'new-diklat-123', namaKegiatan: 'baru' },
    { id: 2, namaKegiatan: 'B' },
  ],
  organisasi: [{ id: 3, namaKegiatan: 'C' }],
  kosong: [],
};

describe('collectServerDrafts', () => {
  it('mengumpulkan hanya draft server (id numerik) dari semua indikator', () => {
    const drafts = collectServerDrafts(DATA);
    expect(drafts).toHaveLength(3);
    expect(drafts.map((d) => d.id)).toEqual([1, 2, 3]);
  });

  it('memberi atribut indikatorKode sesuai grupnya', () => {
    const drafts = collectServerDrafts(DATA);
    expect(drafts.find((d) => d.id === 3).indikatorKode).toBe('organisasi');
    expect(drafts.find((d) => d.id === 1).indikatorKode).toBe('diklat');
  });

  it('mempertahankan indikatorKode yang sudah ada pada row', () => {
    const data = { diklat: [{ id: 9, indikatorKode: 'lain' }] };
    expect(collectServerDrafts(data)[0].indikatorKode).toBe('lain');
  });

  it('aman untuk data null/kosong', () => {
    expect(collectServerDrafts(null)).toEqual([]);
    expect(collectServerDrafts({})).toEqual([]);
  });
});

describe('groupDraftsByKode', () => {
  it('mengelompokkan draft per kode dan mempertahankan urutan keys', () => {
    const drafts = collectServerDrafts(DATA);
    const grouped = groupDraftsByKode(drafts);
    expect([...grouped.keys()]).toEqual(['diklat', 'organisasi']);
    expect(grouped.get('diklat')).toHaveLength(2);
    expect(grouped.get('organisasi')).toHaveLength(1);
  });

  it('fallback ke diklat saat indikatorKode absen', () => {
    const grouped = groupDraftsByKode([{ id: 5 }]);
    expect([...grouped.keys()]).toEqual(['diklat']);
  });
});
