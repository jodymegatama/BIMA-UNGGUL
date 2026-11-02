import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import IndikatorEditor, { buttonStyle, formulaLabels } from '../../components/admin/IndikatorEditor';

export default function ManajemenIndikator() {
  const [rows, setRows] = useState([]), [contract, setContract] = useState(null), [form, setForm] = useState(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const load = useCallback(async () => {
    try { const [data, schema] = await Promise.all([apiFetch('/api/admin/indikator', { auth: true }), apiFetch('/api/admin/indikator-contract', { auth: true })]); setRows(data.data); setContract(schema); setError(''); }
    catch (e) { setError(e.message); }
  }, []);
  useEffect(() => {
    let ignore = false;
    Promise.all([apiFetch('/api/admin/indikator', { auth: true }), apiFetch('/api/admin/indikator-contract', { auth: true })]).then(([data, schema]) => { if (!ignore) { setRows(data.data); setContract(schema); } }).catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, []);
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await apiFetch(`/api/admin/indikator${form.id ? `/${form.id}` : ''}`, { auth: true, method: form.id ? 'PATCH' : 'POST', body: form }); setForm(null); setMessage('Indikator disimpan. Konfigurasi periode lama tetap tersimpan.'); await load(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove(row) {
    if (!window.confirm(`Hapus indikator “${row.nama}” yang belum digunakan?`)) return;
    setBusy(true);
    try { await apiFetch(`/api/admin/indikator/${row.id}`, { auth: true, method: 'DELETE' }); await load(); setMessage('Indikator dihapus.'); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="space-y-5">
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="font-display text-2xl font-black text-charcoal">Master Indikator</h1><p className="mt-2 text-sm text-pencil">Kelola informasi dan formulir dasar. Periode menyimpan salinan konfigurasinya sendiri.</p></div><button className={buttonStyle} disabled={!contract || busy} onClick={() => { setError(''); setForm({ tipeFormula: 'per_capaian', fields: structuredClone(contract.defaults.per_capaian), aktif: false, urutan: rows.length + 1 }); }}>Tambah indikator</button></header>
    <Link className="text-sm font-bold underline" to="/admin/bobot">Atur indikator dan bobot per periode →</Link>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error} <button type="button" className="underline" onClick={load}>Muat ulang daftar</button></p>}
    {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm">{message}</p>}
    {!contract && !error && <p role="status">Memuat indikator…</p>}
    {form && contract && <form onSubmit={save} className="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-4"><h2 className="font-black">{form.id ? 'Edit indikator' : 'Indikator baru'}</h2><IndikatorEditor value={form} onChange={setForm} contract={contract} locked={busy} master /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} />Aktif di katalog publik dan ditawarkan untuk periode baru</label><div className="flex gap-2"><button disabled={busy} className={buttonStyle}>{busy ? 'Menyimpan…' : 'Simpan indikator'}</button><button type="button" className={buttonStyle} onClick={() => setForm(null)}>Batal</button></div></form>}
    <div className="space-y-3">{rows.map((r) => <article key={r.id} className="rounded-2xl border-2 border-zinc-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-charcoal">{r.urutan}. {r.nama}</p><p className="mt-1 text-xs text-pencil">{formulaLabels[r.tipeFormula]} · {r.aktif ? 'Aktif' : 'Nonaktif'} · {r._count.bobots} periode</p></div><div className="flex gap-2"><button className={buttonStyle} disabled={busy} onClick={() => { setForm(structuredClone(r)); setError(''); }}>Edit</button><button className={buttonStyle} disabled={busy || r._count.bobots > 0 || r._count.submissions > 0} title={r._count.bobots || r._count.submissions ? 'Sudah digunakan; nonaktifkan melalui Edit' : 'Hapus indikator belum digunakan'} onClick={() => remove(r)}>Hapus</button></div></article>)}</div>
    {contract && !rows.length && <p>Belum ada indikator. Tambahkan indikator pertama.</p>}
  </div>;
}
