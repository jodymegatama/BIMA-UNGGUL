import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CapaianRow from './CapaianRow';
import { emptyRowFor, buildPayload, validateRow, hasFormContent } from '../../constants/indikator';
import { formatFieldValue } from '../../lib/customFields';
const field = (key, type, extra = {}) => ({ source: 'custom', key: `cf_${key}`, type, label: key, visibility: 'internal', required: true, ...extra });
const fields = [field('Durasi', 'decimal', { min: 0, max: 100, precision: 2 }), field('Mitra', 'boolean'), field('Tanggal', 'date'), field('Sasaran', 'multiselect', { options: [{ value: 'opt_a', label: 'Guru' }, { value: 'opt_b', label: 'Murid' }] }), field('Sertifikat', 'text', { required: false })];
function Harness() {
  const [row, setRow] = useState({ id: 'test', ...emptyRowFor(fields) });
  return <><CapaianRow row={row} fields={fields} showStatus={false} onChange={(_id, key, value) => setRow((prev) => ({ ...prev, [key]: value }))} onRemove={() => {}} /><output data-testid="payload">{JSON.stringify(buildPayload(fields, row))}</output></>;
}
describe('Form dan payload field kustom', () => {
  it('baris awal kosong tidak dihitung sebagai isian; angka nol dan jawaban Tidak dihitung', () => {
    expect(hasFormContent(fields, emptyRowFor(fields))).toBe(false);
    expect(hasFormContent(fields, { customValues: { cf_Mitra: false } })).toBe(true);
    expect(hasFormContent(fields, { customValues: { cf_Durasi: 0 } })).toBe(true);
    expect(hasFormContent(fields, { customValues: { cf_Sertifikat: '  ' }, status: 'Draft', indikatorNama: 'Nama metadata' })).toBe(false);
  });
  it('tidak menganggap 0/false sebagai kosong; opsi jamak, tanggal dan clear punya tipe benar', () => {
    render(<Harness />);
    const read = () => JSON.parse(screen.getByTestId('payload').textContent).customValues;
    expect(read().cf_Mitra).toBe(null);
    fireEvent.change(screen.getByLabelText('Durasi *'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Mitra *'), { target: { value: 'false' } });
    fireEvent.change(screen.getByLabelText('Tanggal *'), { target: { value: '2026-11-02' } });
    fireEvent.click(screen.getByLabelText('Guru'));
    fireEvent.click(screen.getByLabelText('Murid'));
    expect(read()).toEqual({ cf_Durasi: 0, cf_Mitra: false, cf_Tanggal: '2026-11-02', cf_Sasaran: ['opt_a', 'opt_b'], cf_Sertifikat: null });
    expect(validateRow(fields, { customValues: read() })).toEqual({});
    expect(formatFieldValue(fields[1], { customValues: read() })).toBe('Tidak');
    expect(formatFieldValue(fields[3], { customValues: read() })).toBe('Guru, Murid');
    fireEvent.change(screen.getByLabelText('Durasi *'), { target: { value: '' } });
    expect(read().cf_Durasi).toBe(null);
    expect(validateRow(fields, { customValues: read() }).cf_Durasi).toBeTruthy();
  });
  it('draft parsial sah, nilai invalid tetap ditolak; ID dan label tidak memindahkan jawaban', () => {
    expect(validateRow(fields, emptyRowFor(fields), { mode: 'draft' })).toEqual({});
    expect(validateRow(fields, { customValues: { cf_Durasi: '1.234' } }, { mode: 'draft' }).cf_Durasi).toBeTruthy();
    expect(validateRow(fields, { customValues: { cf_Tanggal: '2026-02-29' } }, { mode: 'draft' }).cf_Tanggal).toBeTruthy();
    const changed = [...fields].reverse().map((f) => ({ ...f, label: `${f.label} baru` }));
    expect(buildPayload(changed, { customValues: { cf_Durasi: '2.5', cf_Mitra: false } }).customValues).toMatchObject({ cf_Durasi: 2.5, cf_Mitra: false });
  });
});
