export function presentField(field, item) {
  const value = field.source === 'custom' ? item.customValues?.[field.key] : field.type === 'ratio' ? `${item.pembilang ?? '—'} dari ${item.penyebut ?? '—'}` : item[field.key];
  if (value == null || value === '') return '';
  if (field.type === 'boolean') return value ? 'Ya' : 'Tidak';
  if (['select', 'multiselect'].includes(field.type)) return (Array.isArray(value) ? value : [value]).map((id) => field.options?.find((o) => o.value === id)?.label || id).join(', ');
  return typeof value === 'number' ? value : String(value);
}
