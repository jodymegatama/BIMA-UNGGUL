import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { scoringSources } from '../../lib/customFields';
import IndikatorPeriodCard from '../../components/admin/IndikatorPeriodCard';
import { inputStyle, buttonStyle } from '../../components/admin/IndikatorEditor';

export default function KonfigurasiBobot() {
  const [periods, setPeriods] = useState([]), [pid, setPid] = useState(''), [configs, setConfigs] = useState([]), [masters, setMasters] = useState([]), [contract, setContract] = useState(null);
  const [selected, setSelected] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const [sourcePeriod, setSourcePeriod] = useState(''), [message, setMessage] = useState('');
  useEffect(() => {
    let ignore = false;
    Promise.all([apiFetch('/api/admin/periode', { auth: true }), apiFetch('/api/admin/indikator', { auth: true }), apiFetch('/api/admin/indikator-contract', { auth: true })]).then(([p, m, c]) => {
      if (ignore) return; setPeriods(p.data); setPid(String(p.data[0]?.id || '')); setMasters(m.data); setContract(c);
    }).catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, []);
  const load = useCallback(async () => {
    if (!pid) return; setLoading(true); setError('');
    try { const res = await apiFetch(`/api/admin/periode/${pid}/indikator`, { auth: true }); setConfigs(res.data); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [pid]);
  useEffect(() => {
    if (!pid) return undefined;
    let ignore = false;
    apiFetch(`/api/admin/periode/${pid}/indikator`, { auth: true }).then((res) => { if (!ignore) { setConfigs(res.data); setLoading(false); } }).catch((e) => { if (!ignore) { setError(e.message); setLoading(false); } });
    return () => { ignore = true; };
  }, [pid]);
  const periode = periods.find((p) => String(p.id) === pid);
  const locked = ['finalisasi', 'arsip'].includes(periode?.status);
  async function add() {
    setLoading(true);
    try { await apiFetch(`/api/admin/periode/${pid}/indikator`, { auth: true, method: 'POST', body: { indikatorId: Number(selected) } }); setSelected(''); await load(); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function copy() {
    const sources = configs.map((c) => `${c.nama}: ${scoringSources(c).map((s) => s.field.label).join(', ') || 'Jumlah capaian'}`).join('\n');
    if (!window.confirm(`Salin bobot dengan metode dan sumber yang kompatibel? Bobot serta skor live periode tujuan akan diperbarui.\n\nSumber skor tujuan:\n${sources}`)) return;
    setLoading(true); setError('');
    try {
      const result = await apiFetch(`/api/admin/periode/${pid}/indikator/copy-bobot`, { auth: true, method: 'POST', body: { sourcePeriodeId: Number(sourcePeriod), revisions: Object.fromEntries(configs.map((c) => [c.id, c.revision])) } });
      setMessage(`${result.copied} bobot disalin; ${result.skipped} indikator dilewati karena metode, sumber, atau opsi kategorinya tidak kompatibel.`); await load();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  return <div className="space-y-5">
    <header><h1 className="font-display text-2xl font-black text-charcoal">Indikator & Bobot Periode</h1><p className="mt-2 text-sm text-pencil">Atur deskripsi, formulir, metode, dan bobot. Periode finalisasi dan arsip terkunci.</p></header>
    <Link to="/admin/indikator" className="text-sm font-bold underline">Kelola master indikator →</Link>
    <label className="block max-w-sm text-sm font-bold">Periode penilaian<select className={inputStyle} value={pid} onChange={(e) => { setPid(e.target.value); setConfigs([]); setLoading(true); setError(''); setMessage(''); }}><option value="">Pilih periode</option>{periods.map((p) => <option key={p.id} value={p.id}>{p.namaPeriode} · {p.status}</option>)}</select></label>
    {error && <p role="alert" className="bg-red-50 text-red-800 p-4 rounded-xl">{error} <button onClick={load} className="underline">Muat ulang</button></p>}
    {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm">{message}</p>}
    {periode && !locked && <div className="flex flex-wrap gap-3 items-end rounded-2xl border-2 border-zinc-200 bg-white p-4"><label className="min-w-48 text-sm font-bold">Salin bobot dari periode<select className={inputStyle} value={sourcePeriod} onChange={(e) => setSourcePeriod(e.target.value)}><option value="">Pilih periode sumber</option>{periods.filter((p) => String(p.id) !== pid).map((p) => <option key={p.id} value={p.id}>{p.namaPeriode}</option>)}</select></label><button className={buttonStyle} disabled={!sourcePeriod || loading} onClick={copy}>Salin bobot</button></div>}
    {periode && !locked && <div className="rounded-2xl border-2 border-zinc-200 bg-white p-4 flex flex-wrap items-end gap-3"><label className="flex-1 min-w-48 text-sm font-bold">Tambahkan indikator aktif<select className={inputStyle} value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Pilih indikator</option>{masters.filter((m) => m.aktif && !configs.some((c) => c.id === m.id)).map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}</select></label><button className={buttonStyle} disabled={!selected || loading} onClick={add}>Tambahkan ke periode</button></div>}
    {loading && <p role="status">Memuat konfigurasi…</p>}
    {periode && contract && !loading && configs.map((c) => <IndikatorPeriodCard key={`${pid}-${c.id}-${c.revision}`} config={c} contract={contract} periode={periode} onSaved={load} />)}
    {periode && !loading && !configs.length && <p>Belum ada indikator pada periode ini.</p>}
  </div>;
}
