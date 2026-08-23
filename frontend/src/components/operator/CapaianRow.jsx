import { Trash, Link as LinkIcon, WarningCircle } from 'phosphor-react';
import StatusBadge from '../shared/StatusBadge';
import { INDIKATOR_FIELDS } from '../../constants/indikator';

/**
 * CapaianRow — form dinamis per indikator berdasarkan INDIKATOR_FIELDS (PRD §11).
 * Render field dari config; nilai select = enum schema lowercase.
 * RatioInput: pembilang/penyebut + preview % live (indikator rapor_rata_rata & rasio_penerimaan).
 */

function RatioPreview({ pembilang, penyebut }) {
  const p = Number(pembilang);
  const s = Number(penyebut);
  if (!Number.isFinite(p) || !Number.isFinite(s) || !s || penyebut === '' || pembilang === '') return null;
  const pct = ((p / s) * 100).toFixed(1).replace(/\.0$/, '');
  return (
    <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
      {p} dari {s} = {pct}%
    </span>
  );
}

export default function CapaianRow({ row, indikatorKode, onChange, onRemove, showStatus = true }) {
  const fields = INDIKATOR_FIELDS[indikatorKode] || [];
  const err = row._error || {};

  const inputBase = 'mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition';
  const inputOk = `${inputBase} border-zinc-200 focus:border-eager focus:ring-eager/20`;
  const inputErr = `${inputBase} border-red-300 focus:border-red-400 focus:ring-red-200`;

  const renderField = (f) => {
    if (f.type === 'ratio') {
      return (
        <div key={f.key}>
          <label htmlFor={`row-${row.id}-ratio`} className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
            {f.label} <span className="text-red-600">*</span>
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                id={`row-${row.id}-ratio`}
                name={`row-${row.id}-ratio-pembilang`}
                type="number"
                min={0}
                autoComplete="off"
                value={row.pembilang ?? ''}
                onChange={(e) => onChange(row.id, 'pembilang', e.target.value)}
                placeholder={f.pembilangLabel || 'X'}
                aria-label={f.pembilangLabel || 'Pembilang'}
                className={`h-10 w-[120px] px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition ${err.ratio ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
              />
              <span className="text-[12px] font-black text-pencil">dari</span>
              <input
                name={`row-${row.id}-ratio-penyebut`}
                type="number"
                min={1}
                autoComplete="off"
                value={row.penyebut ?? ''}
                onChange={(e) => onChange(row.id, 'penyebut', e.target.value)}
                placeholder={f.penyebutLabel || 'Y'}
                aria-label={f.penyebutLabel || 'Penyebut'}
                className={`h-10 w-[120px] px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition ${err.ratio ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
              />
            </div>
            <RatioPreview pembilang={row.pembilang} penyebut={row.penyebut} />
          </div>
          {err.ratio && <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {err.ratio}</div>}
          {!err.ratio && f.help && <div className="text-[11px] font-medium text-faded mt-1">{f.help}</div>}
        </div>
      );
    }

    if (f.type === 'select') {
      return (
        <div key={f.key}>
          <label htmlFor={`row-${row.id}-${f.key}`} className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
            {f.label} {f.required && <span className="text-red-600">*</span>}
          </label>
          <select
            id={`row-${row.id}-${f.key}`}
            name={`row-${row.id}-${f.key}`}
            value={row[f.key] ?? ''}
            onChange={(e) => onChange(row.id, f.key, e.target.value)}
            className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 transition ${err[f.key] ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
          >
            <option value="">{f.placeholder || 'Pilih...'}</option>
            {(f.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {err[f.key] && <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {err[f.key]}</div>}
        </div>
      );
    }

    if (f.type === 'textarea') {
      return (
        <div key={f.key}>
          <label htmlFor={`row-${row.id}-${f.key}`} className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
            {f.label} <span className="text-faded font-bold normal-case">(opsional)</span>
          </label>
          <textarea
            id={`row-${row.id}-${f.key}`}
            name={`row-${row.id}-${f.key}`}
            value={row[f.key] ?? ''}
            onChange={(e) => onChange(row.id, f.key, e.target.value)}
            placeholder={f.placeholder || 'Catatan...'}
            rows={2}
            className="mt-1.5 w-full px-3 py-2 rounded-[12px] border-2 border-zinc-200 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:border-eager focus:ring-2 focus:ring-eager/20 transition resize-none"
          />
        </div>
      );
    }

    // text | number
    return (
      <div key={f.key}>
        <label htmlFor={`row-${row.id}-${f.key}`} className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
          {f.label} {f.required && <span className="text-red-600">*</span>}
        </label>
        <div className="relative">
          {f.key === 'linkBukti' && <LinkIcon size={14} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-faded pointer-events-none" />}
          <input
            id={`row-${row.id}-${f.key}`}
            name={`row-${row.id}-${f.key}`}
            type={f.type === 'number' ? 'number' : 'text'}
            min={f.min}
            autoComplete="off"
            value={row[f.key] ?? ''}
            onChange={(e) => onChange(row.id, f.key, e.target.value)}
            placeholder={f.placeholder}
            className={`w-full ${f.key === 'linkBukti' ? 'pl-8 pr-3' : 'px-3'} rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition ${f.key === 'linkBukti' ? '' : 'mt-1.5 h-10'} ${err[f.key] ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'} ${f.key === 'linkBukti' ? 'h-10 mt-1.5' : ''}`}
          />
        </div>
        {err[f.key] && <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {err[f.key]}</div>}
        {!err[f.key] && f.help && <div className="text-[11px] font-medium text-faded mt-1">{f.help}</div>}
      </div>
    );
  };

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-zinc-50 border-2 border-zinc-200 flex items-center justify-center text-[10px] font-black text-faded">#{row._idx}</span>
          {showStatus && <StatusBadge status={row.status || 'Draft'} size="sm" />}
        </div>
        <button onClick={() => onRemove(row.id)} className="w-8 h-8 rounded-full border-2 border-zinc-200 bg-white flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-faded transition" aria-label="Hapus baris">
          <Trash size={14} weight="regular" />
        </button>
      </div>

      <div className="mt-3 grid gap-3">
        {fields.map(renderField)}
        {row.alasan && row.status === 'Ditolak' && (
          <div className="rounded-[12px] bg-red-50 border-2 border-red-200 p-3">
            <div className="text-[11px] font-black text-red-900 uppercase">Alasan penolakan Admin</div>
            <p className="text-[12px] font-medium text-red-800 mt-1">{row.alasan}</p>
          </div>
        )}
      </div>
    </div>
  );
}
