import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IndikatorEditor from './IndikatorEditor';
import defaults from '../../../../backend/prisma/indikator-defaults.json';
const contract = { fields: {}, defaults: { per_capaian: defaults[0].fields, per_jumlah: defaults[0].fields }, scoreRoles: { per_capaian: [], per_jumlah: ['quantity'] } };
function Harness() {
  const [value, setValue] = useState({ tipeFormula: 'per_capaian', fields: [], deskripsi: '' });
  return <><IndikatorEditor value={value} onChange={setValue} contract={contract} /><output data-testid="config">{JSON.stringify(value)}</output></>;
}
describe('Editor field baru', () => {
  it('identitas stabil saat edit/urutan; duplikasi mendapat ID baru; sumber skor otomatis wajib', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Atur field formulir operator'));
    fireEvent.click(screen.getByText('Tambah field baru'));
    const read = () => JSON.parse(screen.getByTestId('config').textContent);
    const key = read().fields[0].key;
    fireEvent.change(screen.getByLabelText('Nama field 1'), { target: { value: 'Durasi' } });
    fireEvent.change(screen.getByLabelText('Tipe field'), { target: { value: 'decimal' } });
    expect(read().fields[0].key).toBe(key);
    fireEvent.click(screen.getByText('Duplikasi field'));
    expect(new Set(read().fields.map((f) => f.key)).size).toBe(2);
    fireEvent.change(screen.getByLabelText('Metode perhitungan'), { target: { value: 'per_jumlah' } });
    expect(read().fields[0].key).toBe(key);
    fireEvent.change(screen.getByLabelText('Sumber jumlah / pengali'), { target: { value: `custom:${key}` } });
    expect(read().scoringConfig.quantity).toEqual({ source: 'custom', key });
    expect(read().fields[0].required).toBe(true);
  });
});
