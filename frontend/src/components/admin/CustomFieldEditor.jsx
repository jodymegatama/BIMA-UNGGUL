import { customTypeLabels } from '../../lib/customFields';
import { inputStyle, buttonStyle } from './indikatorStyles';

const newId = (prefix) => `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
function typedField(field, type) {
  const { key, label, required, visibility, help = '', placeholder = '' } = field;
  return { source: 'custom', key, label, type, required, visibility, help, placeholder,
    ...(['integer', 'decimal'].includes(type) ? { min: 0, max: 1e9 } : {}),
    ...(type === 'decimal' ? { precision: 2 } : {}),
    ...(['select', 'multiselect'].includes(type) ? { options: [{ value: newId('opt'), label: 'Pilihan 1' }] } : {}),
    ...(['text', 'textarea', 'url'].includes(type) ? { maxLen: type === 'textarea' ? 4000 : 2000 } : {}) };
}
export default function CustomFieldEditor({ fields, onChange, contract, locked }) {
  const custom = fields.filter((f) => f.source === 'custom');
  const limit = contract.customLimits?.fields ?? 25;
  const edit = (key, patch) => onChange(fields.map((f) => f.key === key ? { ...f, ...patch } : f));
  const move = (key, delta) => { const i = fields.findIndex((f) => f.key === key), next = [...fields]; [next[i], next[i + delta]] = [next[i + delta], next[i]]; onChange(next); };
  return <fieldset disabled={locked} className="space-y-4 min-w-0"><legend className="font-bold text-sm mb-3">Field tambahan ({custom.length}/{limit})</legend>
    <p className="text-xs text-pencil">Jawaban bersifat internal secara default. Pilih Publik jika jawabannya boleh tampil pada prestasi terverifikasi.</p>
    {custom.map((f, index) => <div key={f.key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Nama field {index + 1}<input className={inputStyle} value={f.label} maxLength={1000} required onChange={(e) => edit(f.key, { label: e.target.value })} /></label><label className="text-xs font-bold">Tipe field<select className={inputStyle} value={f.type} onChange={(e) => onChange(fields.map((x) => x.key === f.key ? typedField(f, e.target.value) : x))}>{(contract.customTypes || Object.keys(customTypeLabels)).map((type) => <option key={type} value={type}>{customTypeLabels[type]}</option>)}</select></label>
        <label className="text-xs">Bantuan pengisian<input className={inputStyle} maxLength={1000} value={f.help || ''} onChange={(e) => edit(f.key, { help: e.target.value })} /></label><label className="text-xs">Contoh isian<input className={inputStyle} maxLength={1000} value={f.placeholder || ''} onChange={(e) => edit(f.key, { placeholder: e.target.value })} /></label>
        <label className="text-xs">Visibilitas jawaban<select className={inputStyle} value={f.visibility} onChange={(e) => edit(f.key, { visibility: e.target.value })}><option value="internal">Internal — admin dan operator</option><option value="public">Publik — prestasi terverifikasi</option></select></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.required} onChange={(e) => edit(f.key, { required: e.target.checked })} />Wajib saat submit</label>
        {['integer', 'decimal'].includes(f.type) && ['min', 'max'].map((prop) => <label key={prop} className="text-xs">{prop === 'min' ? 'Nilai minimum' : 'Nilai maksimum'}<input type="number" step={f.type === 'integer' ? 1 : 'any'} min={-1e9} max={1e9} required className={inputStyle} value={f[prop] ?? ''} onChange={(e) => edit(f.key, { [prop]: e.target.value === '' ? undefined : Number(e.target.value) })} /></label>)}
        {f.type === 'decimal' && <label className="text-xs">Angka di belakang koma<input type="number" min={0} max={6} required className={inputStyle} value={f.precision ?? 6} onChange={(e) => edit(f.key, { precision: Number(e.target.value) })} /></label>}
        {['text', 'textarea', 'url'].includes(f.type) && <label className="text-xs">Panjang maksimum<input type="number" min={1} max={f.type === 'textarea' ? 4000 : 2000} required className={inputStyle} value={f.maxLen} onChange={(e) => edit(f.key, { maxLen: Number(e.target.value) })} /></label>}
      </div>
      {['select', 'multiselect'].includes(f.type) && <fieldset className="space-y-2"><legend className="text-xs font-bold">Pilihan jawaban</legend>{f.options.map((o, i) => <div key={o.value} className="flex gap-2"><label className="flex-1 text-xs">Pilihan {i + 1}<input className={inputStyle} value={o.label} required maxLength={100} onChange={(e) => edit(f.key, { options: f.options.map((x) => x.value === o.value ? { ...x, label: e.target.value } : x) })} /></label><button type="button" className={buttonStyle} disabled={f.options.length === 1} aria-label={`Hapus pilihan ${i + 1} dari ${f.label}`} onClick={() => edit(f.key, { options: f.options.filter((x) => x.value !== o.value) })}>Hapus</button></div>)}<button type="button" className={buttonStyle} disabled={f.options.length >= (contract.customLimits?.options ?? 50)} onClick={() => edit(f.key, { options: [...f.options, { value: newId('opt'), label: `Pilihan ${f.options.length + 1}` }] })}>Tambah pilihan</button></fieldset>}
      <div className="flex flex-wrap gap-2"><button type="button" className={buttonStyle} disabled={fields[0]?.key === f.key} onClick={() => move(f.key, -1)}>Naik</button><button type="button" className={buttonStyle} disabled={fields.at(-1)?.key === f.key} onClick={() => move(f.key, 1)}>Turun</button><button type="button" className={buttonStyle} disabled={custom.length >= limit} onClick={() => onChange([...fields, { ...structuredClone(f), key: newId('cf'), label: `${f.label} (salinan)`, ...(f.options ? { options: f.options.map((o) => ({ ...o, value: newId('opt') })) } : {}) }])}>Duplikasi field</button><button type="button" className={`${buttonStyle} text-red-700`} onClick={() => onChange(fields.filter((x) => x.key !== f.key))}>Hapus field</button></div>
    </div>)}
    <button type="button" className={buttonStyle} disabled={custom.length >= limit} onClick={() => onChange([...fields, typedField({ key: newId('cf'), label: `Field tambahan ${custom.length + 1}`, required: false, visibility: 'internal' }, 'text')])}>Tambah field baru</button>
  </fieldset>;
}
