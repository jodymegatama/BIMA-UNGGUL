import { Calendar, Funnel } from 'phosphor-react';
import { KELOMPOKS as KELOMPOK_LIST } from '../../../constants/indikator';

// render pill dari registry frontend (constants/indikator.js KELOMPOKS)
const KELOMPOKS = KELOMPOK_LIST.map((k) => ({ id: k, label: k }));

/**
 * FilterBar — pill solid eager untuk aktif (mirip badge "Nasional 3x" di Indikator), outline untuk non-aktif
 * Props: { periode, kelompok, onPeriode, onKelompok }
 */
export default function FilterBar({ periode, kelompok, onPeriode, onKelompok, periodes = [] }) {
  const activePeriod = periodes.find((p) => p.namaPeriode === periode) || (periode ? { namaPeriode: periode } : null);
  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 lg:p-5 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Periode */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex w-8 h-8 rounded-full bg-zinc-50 border-2 border-zinc-200 items-center justify-center">
            <Calendar size={14} weight="regular" color="#777777" />
          </span>
          <div>
            <div className="text-[11px] font-black tracking-wide text-faded uppercase">Periode penilaian</div>
            <div className="flex items-center gap-2 mt-1.5">
              {periodes.map((p) => {
                const active = p.namaPeriode === periode;
                return (
                  <button
                    key={String(p.id)}
                    onClick={() => onPeriode(p.namaPeriode)}
                    className={`h-8 px-4 rounded-full border-2 text-[13px] font-black transition ${
                      active
                        ? 'bg-eager text-white border-eager-dark shadow-sticker'
                        : 'bg-white text-charcoal border-zinc-200 hover:border-charcoal'
                    }`}
                  >
                    {p.namaPeriode}
                  </button>
                );
              })}
              <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-[11px] font-bold text-faded">
                <span className={`w-1.5 h-1.5 rounded-full ${activePeriod?.statusEfektif === 'aktif' ? 'bg-eager animate-pulse' : 'bg-zinc-300'}`} />
                {activePeriod?.statusEfektif === 'aktif' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        </div>

        {/* info */}
        <div className="hidden lg:flex items-center gap-2 text-[12px] font-bold text-pencil">
          <Funnel size={14} weight="regular" color="#afafaf" />
          Pilih 1 dari {KELOMPOKS.length} kelompok — ranking dihitung terpisah per kelompok
        </div>
      </div>

      {/* pill kelompok */}
      <div className="mt-5">
        <div className="text-[11px] font-black tracking-wide text-faded uppercase mb-3">Kelompok madrasah</div>
        <div className="flex flex-wrap gap-2">
          {KELOMPOKS.map((k) => {
            const active = k.id === kelompok;
            return (
              <button
                key={k.id}
                onClick={() => onKelompok(k.id)}
                className={`h-9 px-4 rounded-full border-2 text-[13px] font-black transition ${
                  active
                    ? 'bg-eager text-white border-eager-dark shadow-sticker'
                    : 'bg-white text-charcoal border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
