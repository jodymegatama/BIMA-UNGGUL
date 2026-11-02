import { scoringSources, sourceLabels, formatFieldValue } from '../../lib/customFields';
export default function ScoreSourceSummary({ config, row }) {
  const sources = scoringSources(config);
  if (!sources.length) return null;
  return <section className="rounded-xl border border-zinc-200 p-3"><h4 className="text-xs font-bold mb-2">Sumber perhitungan skor</h4><dl className="space-y-1 text-xs">{sources.map(({ role, field }) => <div key={role} className="break-words"><dt className="inline font-bold">{sourceLabels[role]} — {field.label}: </dt><dd className="inline">{formatFieldValue(field, row)}</dd></div>)}</dl></section>;
}
