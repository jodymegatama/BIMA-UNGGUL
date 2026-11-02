import CustomFieldInput from '../shared/CustomFieldInput';
export default function ScoringSampleFields({ config, sample, onChange }) {
  const refs = Object.entries(config.scoringConfig || {}).filter(([key]) => ['category', 'quantity', 'numerator', 'denominator'].includes(key)).map(([, ref]) => ref);
  const unique = [...new Map(refs.map((r) => [`${r.source}:${r.key}`, r])).values()];
  return unique.map((ref) => {
    const field = config.fields.find((f) => f.key === ref.key && (f.source || 'builtin') === ref.source) || (['pembilang', 'penyebut'].includes(ref.key) ? { type: 'integer', label: config.fields.find((f) => f.key === 'ratio')?.[`${ref.key}Label`] || ref.key, min: 0, max: 1000000 } : null);
    if (!field) return null;
    const numeric = ['number', 'integer', 'decimal'].includes(field.type);
    return <CustomFieldInput key={`${ref.source}:${ref.key}`} id={`sample-${config.id}-${ref.key}`} field={{ ...field, type: field.type === 'number' ? 'integer' : field.type }} value={ref.source === 'custom' ? sample.customValues?.[ref.key] : sample[ref.key]} onChange={(v) => { const val = numeric && v !== '' ? Number(v) : v; onChange(ref.source === 'custom' ? { customValues: { ...sample.customValues, [ref.key]: val } } : { [ref.key]: val }); }} />;
  });
}
