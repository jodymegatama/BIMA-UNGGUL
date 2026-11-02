import DeskripsiIndikator from '../shared/DeskripsiIndikator';
export const formulaLabels = { per_capaian: 'Per capaian', per_tingkat_wilayah: 'Per tingkat wilayah', per_jenjang: 'Per jenjang pendidikan', persentase: 'Persentase dari jumlah' };
export const inputStyle = 'mt-1 w-full rounded-xl border-2 border-zinc-200 bg-white px-3 py-2 text-sm text-charcoal disabled:bg-zinc-100 focus:border-eager focus:outline-none';
export const buttonStyle = 'rounded-xl border-2 border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-charcoal hover:bg-zinc-50 disabled:opacity-50';

export default function IndikatorEditor({ value, onChange, contract, structuralLocked = false, locked = false, master = false }) {
  const set = (key, val) => onChange({ ...value, [key]: val });
  const fields = value.fields || [];
  const required = new Set((contract.defaults[value.tipeFormula] || []).filter((f) => f.required && f.key !== 'namaKegiatan').map((f) => f.key));
  const editField = (key, prop, val) => set('fields', fields.map((f) => f.key === key ? { ...f, [prop]: val } : f));
  return <fieldset disabled={locked} className="space-y-4 min-w-0">
    <div className="grid gap-4 sm:grid-cols-2">
      {master && ['kode', 'slug'].map((key) => <label key={key} className="text-sm font-bold">{key === 'kode' ? 'Kode unik' : 'Identitas tautan'}<input className={inputStyle} value={value[key] || ''} disabled={Boolean(value.id)} required maxLength={80} pattern="[a-z0-9][a-z0-9_-]*" onChange={(e) => set(key, e.target.value)} /></label>)}
      <label className="text-sm font-bold">Nama indikator<input className={inputStyle} value={value.nama || ''} required maxLength={191} onChange={(e) => set('nama', e.target.value)} /></label>
      <label className="text-sm font-bold">Label singkat<input className={inputStyle} value={value.short || ''} maxLength={191} onChange={(e) => set('short', e.target.value)} /></label>
      <label className="text-sm font-bold">Urutan tampilan<input type="number" min={0} max={100000} className={inputStyle} value={value.urutan ?? 0} onChange={(e) => set('urutan', Number(e.target.value))} /></label>
      <label className="text-sm font-bold">Metode perhitungan<select className={inputStyle} value={value.tipeFormula} disabled={structuralLocked} onChange={(e) => onChange({ ...value, tipeFormula: e.target.value, fields: structuredClone(contract.defaults[e.target.value]) })}>{Object.entries(formulaLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    <label className="block text-sm font-bold">Deskripsi Indikator<textarea className={inputStyle} value={value.deskripsi || ''} maxLength={10000} rows={5} onChange={(e) => set('deskripsi', e.target.value)} /><span className="text-xs font-normal text-pencil">Informasi untuk publik dan operator. Maksimal 10.000 karakter; wajib sebelum aktivasi.</span></label>
    <details className="rounded-xl border border-zinc-200 p-3"><summary className="cursor-pointer font-bold text-sm">Pratinjau deskripsi publik dan operator</summary><DeskripsiIndikator deskripsi={value.deskripsi} /><p className="text-xs font-bold">Ringkasan kartu beranda</p><DeskripsiIndikator deskripsi={value.deskripsi} ringkas /></details>
    {structuralLocked && <p className="text-sm text-pencil">Formulir dan metode terkunci karena sudah ada capaian. Deskripsi masih dapat diperbaiki selama periode belum final.</p>}
    <details className="rounded-xl border border-zinc-200 p-3"><summary className="cursor-pointer text-sm font-bold">Atur field formulir operator</summary><div className="mt-3 space-y-3">{Object.entries(contract.fields).map(([key, f]) => {
      const current = fields.find((field) => field.key === key);
      return <div key={key} className="rounded-xl bg-zinc-50 p-3">
        <label className="flex gap-2 items-center text-sm font-bold"><input type="checkbox" disabled={structuralLocked || required.has(key)} checked={Boolean(current)} onChange={(e) => set('fields', e.target.checked ? [...fields, { key, ...f, required: false }] : fields.filter((x) => x.key !== key))} />{f.label}{required.has(key) && ' (wajib untuk metode ini)'}</label>
        {current && <div className="mt-2 grid gap-2 sm:grid-cols-2"><label className="text-xs">Label field<input disabled={structuralLocked} className={inputStyle} value={current.label} maxLength={1000} onChange={(e) => editField(key, 'label', e.target.value)} /></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={structuralLocked || required.has(key)} checked={current.required} onChange={(e) => editField(key, 'required', e.target.checked)} />Wajib saat submit</label><label className="text-xs sm:col-span-2">Bantuan pengisian<input disabled={structuralLocked} className={inputStyle} value={current.help || ''} maxLength={1000} onChange={(e) => editField(key, 'help', e.target.value)} /></label><div className="sm:col-span-2 flex gap-2"><button type="button" className={buttonStyle} disabled={structuralLocked || fields[0]?.key === key} onClick={() => { const i = fields.findIndex((f) => f.key === key); const next = [...fields]; [next[i-1], next[i]] = [next[i], next[i-1]]; set('fields', next); }}>Naik</button><button type="button" className={buttonStyle} disabled={structuralLocked || fields.at(-1)?.key === key} onClick={() => { const i = fields.findIndex((f) => f.key === key); const next = [...fields]; [next[i], next[i+1]] = [next[i+1], next[i]]; set('fields', next); }}>Turun</button></div>{key === 'ratio' && ['pembilangLabel', 'penyebutLabel'].map((prop) => <label key={prop} className="text-xs">{prop === 'pembilangLabel' ? 'Label pembilang' : 'Label penyebut'}<input disabled={structuralLocked} className={inputStyle} value={current[prop] || ''} onChange={(e) => editField(key, prop, e.target.value)} /></label>)}</div>}
      </div>;
    })}</div></details>
  </fieldset>;
}
