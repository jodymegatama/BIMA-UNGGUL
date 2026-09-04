import { Trophy, CheckCircle } from 'phosphor-react';
import { INDIKATORS } from '../../../constants/indikator';

/**
 * IndikatorTable — 9 baris, kolom Indikator + Skor. Pola sama LeaderboardTable tapi sederhana.
 */
export default function IndikatorTable({ data = [] }) {
  const total = data.reduce((a, b) => a + (typeof b.skor === 'number' ? b.skor : 0), 0);
  const totalDisplay = Number.isInteger(total) ? String(total) : total.toFixed(2).replace(/\.?0+$/, '');
  const max = Math.max(...data.map((d) => (typeof d.skor === 'number' ? d.skor : 0)), 1);

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      <div className="px-5 h-[56px] flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
            <Trophy size={16} weight="regular" color="#777777" />
          </span>
          <div>
            <div className="text-[13px] font-black text-charcoal leading-none">Rincian skor per indikator</div>
            <div className="text-[11px] font-bold text-pencil">{INDIKATORS.length} indikator • total {totalDisplay} poin</div>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center shrink-0 gap-1 text-[11px] font-bold text-faded bg-white border-2 border-zinc-200 rounded-full px-3 h-7 whitespace-nowrap">
          <CheckCircle size={12} weight="regular" color="#58cc02" /> Tervalidasi
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b-2 border-zinc-100">
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Indikator</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Skor</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase hidden sm:table-cell">Kontribusi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((row) => {
              const skorNum = typeof row.skor === 'number' ? row.skor : 0;
              const skorDisplay = row.skorDisplay ?? (Number.isInteger(skorNum) ? String(skorNum) : skorNum.toFixed(2).replace(/\.?0+$/, ''));
              const pct = Math.round((skorNum / max) * 100);
              return (
                <tr key={row.kode} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-black text-charcoal leading-tight">{row.nama}</div>
                    <div className="text-[11px] font-bold text-pencil">{row.kode}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-charcoal text-white text-[12px] font-black">
                      {skorDisplay}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell min-w-[140px]">
                    <div className="h-2 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden">
                      <div className="h-full bg-eager rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[11px] font-bold text-faded mt-1">{pct}% dari max</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-50 border-t-2 border-zinc-100">
              <td className="px-4 py-3 text-[12px] font-black text-charcoal">Total</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center whitespace-nowrap h-7 px-3 rounded-full bg-eager text-white border-2 border-eager-dark shadow-sticker text-[12px] font-black">
                  {totalDisplay} poin
                </span>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
