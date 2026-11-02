import { inputStyle } from './indikatorStyles';
import { legacyScoreRefs } from '../../lib/customFields';
const roleLabels = { quantity: 'Sumber jumlah / pengali', numerator: 'Sumber pembilang', denominator: 'Sumber penyebut', category: 'Sumber kategori' };
export default function ScoringSourceEditor({ value, onChange, contract, structuralLocked }) {
  const method = value.tipeFormula, config = value.scoringConfig || legacyScoreRefs[method] || {}, fields = value.fields || [];
  const refs = fields.flatMap((f) => f.type === 'ratio' ? ['pembilang', 'penyebut'].map((key) => ({ ...f, key, label: f[`${key}Label`] || key, type: 'number' })) : [f]).map((f) => ({ ...f, source: f.source || 'builtin' }));
  const roles = [...(contract.scoreRoles?.[method] || { per_capaian: [], per_jumlah: ['quantity'], per_kategori: ['category'], persentase: ['numerator', 'denominator'], per_tingkat_wilayah: ['category'], per_jenjang: ['category', 'quantity'] }[method] || []), ...(method === 'per_kategori' ? ['quantity'] : [])];
  const category = refs.find((f) => f.key === config.category?.key && f.source === config.category?.source);
  function choose(role, encoded) {
    const next = { ...config };
    const [source, key] = encoded.split(':');
    if (encoded) next[role] = { source, key }; else delete next[role];
    if (role === 'category') { delete next.categoryMap; delete next.weights; if (method === 'per_kategori') next.weights = Object.fromEntries((refs.find((f) => f.key === key)?.options || []).map((o) => [o.value, null])); }
    const bound = Object.entries(next).filter(([r]) => ['quantity', 'numerator', 'denominator', 'category'].includes(r)).map(([, ref]) => ref);
    onChange({ ...value, scoringConfig: next, fields: fields.map((f) => bound.some((r) => r.key === f.key || (f.key === 'ratio' && ['pembilang', 'penyebut'].includes(r.key))) ? { ...f, required: true, ...(['integer', 'decimal'].includes(f.type) ? { min: Math.max(0, f.min ?? 0) } : {}) } : f) });
  }
  return <section className="rounded-xl border border-zinc-200 p-4 space-y-3"><h3 className="text-sm font-bold">Sumber perhitungan skor</h3>{!roles.length && <p className="text-xs text-pencil">Setiap baris yang disetujui dihitung sebagai satu capaian.</p>}{roles.map((role) => {
    const candidates = refs.filter((f) => role === 'category' ? f.type === 'select' && (method === 'per_kategori' ? f.source === 'custom' : f.source === 'custom' || f.key === (method === 'per_jenjang' ? 'jenjangPendidikan' : 'tingkatWilayah')) : (['numerator', 'denominator'].includes(role) ? ['number', 'integer'] : ['number', 'integer', 'decimal']).includes(f.type));
    return <label key={role} className="block text-xs font-bold">{roleLabels[role]}<select className={inputStyle} disabled={structuralLocked} value={config[role] ? `${config[role].source}:${config[role].key}` : ''} onChange={(e) => choose(role, e.target.value)}><option value="">{method === 'per_kategori' && role === 'quantity' ? 'Satu per capaian' : 'Pilih field sumber…'}</option>{candidates.map((f) => <option key={`${f.source}:${f.key}`} value={`${f.source}:${f.key}`}>{f.label}{f.source === 'custom' ? ' (tambahan)' : ''}</option>)}</select></label>;
  })}
    {category?.source === 'custom' && ['per_tingkat_wilayah', 'per_jenjang'].includes(method) && category.options.map((o) => <label key={o.value} className="block text-xs">Pemetaan {o.label}<select className={inputStyle} disabled={structuralLocked} value={config.categoryMap?.[o.value] || ''} onChange={(e) => onChange({ ...value, scoringConfig: { ...config, categoryMap: { ...config.categoryMap, [o.value]: e.target.value } } })}><option value="">Pilih kategori…</option>{(method === 'per_jenjang' ? ['s1', 's2', 's3'] : ['kabupaten', 'provinsi', 'nasional', 'internasional']).map((k) => <option key={k} value={k}>{k}</option>)}</select></label>)}
    {method === 'per_kategori' && category?.options.map((o) => <label key={o.value} className="block text-xs">Bobot {o.label}<input className={inputStyle} type="number" min={0} max={1000000} step="any" required value={config.weights?.[o.value] ?? ''} onChange={(e) => onChange({ ...value, scoringConfig: { ...config, weights: { ...config.weights, [o.value]: e.target.value === '' ? null : Number(e.target.value) } } })} /></label>)}
    {roles.length > 0 && <p className="text-xs text-pencil">Field sumber otomatis wajib saat submit. Angka sumber skor harus nonnegatif. Tambahkan field yang sesuai jika pilihan belum tersedia.</p>}
  </section>;
}
