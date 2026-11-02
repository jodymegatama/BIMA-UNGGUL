import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import IndikatorEditor, { inputStyle, buttonStyle, formulaLabels } from './IndikatorEditor';
import ScoringSampleFields from './ScoringSampleFields';

export default function IndikatorPeriodCard({ config, contract, periode, onSaved }) {
  const [form, setForm] = useState(() => structuredClone(config)), [error, setError] = useState(''), [busy, setBusy] = useState(false), [preview, setPreview] = useState(null);
  const [sample, setSample] = useState({ count: 1, jumlah: 1, tingkatWilayah: 'kabupaten', jenjangPendidikan: 's1', pembilang: 80, penyebut: 100 });
  const updateSample = (patch) => { setSample((prev) => ({ ...prev, ...patch })); setPreview(null); };
  const locked = config.terkunci || ['finalisasi', 'arsip'].includes(periode.status);
  const weightKeys = form.tipeFormula === 'per_tingkat_wilayah' ? ['kabupaten', 'provinsi', 'nasional', 'internasional'] : form.tipeFormula === 'per_jenjang' ? ['s1', 's2', 's3'] : [];
  const mapKey = form.tipeFormula === 'per_tingkat_wilayah' ? 'bobotTingkatWilayah' : 'bobotJenjang';
  const base = `/api/admin/periode/${periode.id}/indikator/${config.id}`;
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await apiFetch(base, { auth: true, method: 'PATCH', body: form }); await onSaved(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function simulate() {
    setBusy(true); setError('');
    try {
      const count = form.tipeFormula === 'per_capaian' || form.tipeFormula === 'per_tingkat_wilayah' ? Number(sample.count) : 1;
      if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error('Jumlah contoh 1–100 capaian');
      const result = await apiFetch(`${base}/preview`, { auth: true, method: 'POST', body: { revision: config.revision, items: Array.from({ length: count }, () => sample) } });
      setPreview(result);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const dirty = JSON.stringify(form) !== JSON.stringify(config);
  return <article className="rounded-2xl border-2 border-zinc-200 bg-white p-5 space-y-4">
    <header><h2 className="font-display font-black text-lg text-charcoal">{config.nama}</h2><p className="text-xs text-pencil mt-1">{formulaLabels[config.tipeFormula]} · {config.capaianCount} capaian · {config.lengkap ? 'Konfigurasi lengkap' : 'Belum lengkap'}{locked && ' · Terkunci'}</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <form onSubmit={save} className="space-y-4">
      <details><summary className="cursor-pointer text-sm font-bold">Deskripsi dan pengaturan indikator</summary><div className="mt-4"><IndikatorEditor value={form} onChange={setForm} contract={contract} locked={locked || busy} structuralLocked={config.capaianCount > 0} /></div></details>
      <fieldset disabled={locked || busy} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {form.tipeFormula === 'per_kategori' ? <p className="text-xs text-pencil sm:col-span-2">Bobot per pilihan diatur pada bagian Sumber perhitungan skor di atas.</p> : !weightKeys.length ? <label className="text-sm font-bold">{form.tipeFormula === 'persentase' ? 'Skor pada capaian 100%' : form.tipeFormula === 'per_jumlah' ? 'Bobot per satuan jumlah' : 'Bobot per capaian'}<input type="number" step="any" min={0} max={1000000} required className={inputStyle} value={form.nilaiBobot ?? ''} onChange={(e) => setForm({ ...form, nilaiBobot: e.target.value === '' ? null : Number(e.target.value) })} /></label> : weightKeys.map((key) => <label key={key} className="text-sm font-bold capitalize">Bobot {key}<input type="number" min={0} max={1000000} step="any" required className={inputStyle} value={form[mapKey]?.[key] ?? ''} onChange={(e) => setForm({ ...form, [mapKey]: { ...(form[mapKey] || {}), [key]: e.target.value === '' ? null : Number(e.target.value) } })} /></label>)}
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.menerimaInput} disabled={locked || busy} onChange={(e) => setForm({ ...form, menerimaInput: e.target.checked })} />Terima input capaian operator</label>
      <p className="text-xs text-pencil">Bobot nol menghasilkan skor nol. Menghentikan input mempertahankan capaian dan skor yang telah disetujui. Perubahan bobot memperbarui skor langsung pada periode ini.</p>
      <button className={buttonStyle} disabled={locked || busy || !dirty}>{busy ? 'Memproses…' : 'Simpan konfigurasi periode'}</button>
    </form>
    <details className="border-t border-zinc-100 pt-3"><summary className="cursor-pointer font-bold text-sm">Simulasi skor</summary><p className="mt-3 text-xs text-pencil">Simulasi memakai konfigurasi yang sudah disimpan; contoh tidak menjadi capaian.</p><div className="my-3 grid gap-3 sm:grid-cols-2">
      {['per_capaian', 'per_tingkat_wilayah'].includes(config.tipeFormula) && <label className="text-sm">Jumlah contoh capaian<input type="number" min={1} max={100} className={inputStyle} value={sample.count} onChange={(e) => updateSample({ count: Number(e.target.value) })} /></label>}
      {!config.scoringConfig && config.tipeFormula === 'per_tingkat_wilayah' && <label className="text-sm">Tingkat wilayah<select className={inputStyle} value={sample.tingkatWilayah} onChange={(e) => updateSample({ tingkatWilayah: e.target.value })}>{['kabupaten', 'provinsi', 'nasional', 'internasional'].map((k) => <option key={k}>{k}</option>)}</select></label>}
      {!config.scoringConfig && config.tipeFormula === 'per_jenjang' && <><label className="text-sm">Jenjang<select className={inputStyle} value={sample.jenjangPendidikan} onChange={(e) => updateSample({ jenjangPendidikan: e.target.value })}>{['s1', 's2', 's3'].map((k) => <option key={k} value={k}>{k.toUpperCase()}</option>)}</select></label><label className="text-sm">Jumlah lulusan<input className={inputStyle} type="number" min={1} value={sample.jumlah} onChange={(e) => updateSample({ jumlah: Number(e.target.value) })} /></label></>}
      {!config.scoringConfig && config.tipeFormula === 'persentase' && ['pembilang', 'penyebut'].map((k) => <label key={k} className="text-sm">{config.fields?.find((f) => f.key === 'ratio')?.[`${k}Label`] || k}<input className={inputStyle} type="number" min={0} value={sample[k]} onChange={(e) => updateSample({ [k]: Number(e.target.value) })} /></label>)}
      {config.scoringConfig && <ScoringSampleFields config={config} sample={sample} onChange={updateSample} />}
    </div><button type="button" className={buttonStyle} disabled={busy || !config.lengkap || dirty} onClick={simulate}>Hitung contoh</button>{dirty && <p className="mt-2 text-xs">Simpan perubahan sebelum simulasi.</p>}{preview && !dirty && <p role="status" className="mt-3 rounded-xl bg-green-50 p-4 text-sm font-bold">{preview.totalScore} poin · {periode.namaPeriode}</p>}</details>
  </article>;
}
