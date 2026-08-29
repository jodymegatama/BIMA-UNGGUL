import { Funnel, MagnifyingGlass } from 'phosphor-react';
import { INDIKATORS } from '../../constants/indikator';

const statusOptions = ['Semua', 'Menunggu', 'Disetujui', 'Ditolak', 'Draft'];
const periodeOptions = ['2026/2027', '2025/2026'];

export default function ValidasiFilterBar({ filters, onChange }) {
  const set = (k, v) => onChange({ ...filters, [k]: v });

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap gap-3">
        <select value={filters.status} onChange={(e) => set('status', e.target.value)} className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-black text-charcoal hover:border-zinc-300 transition">
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={filters.indikator} onChange={(e) => set('indikator', e.target.value)} className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-bold text-charcoal hover:border-zinc-300 transition">
          <option value="Semua">Semua Indikator</option>
          {INDIKATORS.map((ind) => (
            <option key={ind.kode} value={ind.kode}>{ind.nama}</option>
          ))}
        </select>

        <select value={filters.periode} onChange={(e) => set('periode', e.target.value)} className="h-9 px-3 rounded-full border-2 border-zinc-200 bg-white text-[12px] font-bold text-charcoal hover:border-zinc-300 transition">
          {periodeOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={16} weight="regular" color="#afafaf" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="validasi-search"
            name="validasi-search"
            type="search"
            autoComplete="off"
            aria-label="Cari madrasah atau kata kunci"
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Cari madrasah / kata kunci..."
            className="w-full h-9 pl-9 pr-3 rounded-full border-2 border-zinc-200 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:border-ink"
          />
        </div>

        <button
          onClick={() => onChange({ status: 'Menunggu', indikator: 'Semua', periode: '2026/2027', q: '', kelompok: 'Semua' })}
          className="h-9 px-4 rounded-full bg-zinc-50 border-2 border-zinc-200 text-[12px] font-black text-pencil hover:border-charcoal hover:text-charcoal active:translate-y-[1px] transition"
        >
          Reset
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {['Semua', 'MI Negeri', 'MI Swasta', 'MTs Negeri', 'MTs Swasta', 'MA Negeri', 'MA Swasta'].map((k) => (
          <button
            key={k}
            onClick={() => set('kelompok', k)}
            className={`h-7 px-3 rounded-full border-2 text-[11px] font-black transition ${filters.kelompok === k ? 'bg-ink text-white border-black shadow-[0_2px_0_0_#000437]' : 'bg-white border-zinc-200 text-charcoal hover:border-zinc-300 hover:bg-zinc-50 active:translate-y-[1px]'}`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-faded">
        <Funnel size={12} weight="regular" color="#afafaf" /> Filter: status • indikator • periode • kelompok • kata kunci
      </div>
    </div>
  );
}
