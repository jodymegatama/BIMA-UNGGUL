export default function DeskripsiIndikator({ deskripsi, ringkas = false, collapsible = false, href, konteks }) {
  const content = <div className="space-y-2">
    {konteks && <p className="text-xs font-bold text-pencil">{konteks}</p>}
    <p className={`whitespace-pre-line break-words text-sm leading-relaxed text-pencil ${ringkas ? 'line-clamp-3' : ''}`}>{deskripsi || 'Deskripsi indikator belum tersedia.'}</p>
    {href && <a className="inline-block text-sm font-bold text-eager-dark underline underline-offset-4" href={href}>Baca selengkapnya</a>}
  </div>;
  if (collapsible) return <details className="my-2 rounded-xl border border-zinc-200 p-3"><summary className="cursor-pointer text-sm font-bold text-charcoal focus-visible:outline-2">Info indikator</summary><div className="mt-3">{content}</div></details>;
  return <section className="my-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4" aria-label="Deskripsi Indikator"><h3 className="mb-2 text-sm font-black text-charcoal">Deskripsi Indikator</h3>{content}</section>;
}
