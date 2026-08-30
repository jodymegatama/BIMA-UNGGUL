import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowUp, ArrowDown, ArrowsDownUp, Clock, CheckCircle, Hash } from 'phosphor-react';
import { formatSkor } from '../../../lib/format';

function SortIcon({ active, dir }) {
  if (!active) return <ArrowsDownUp size={12} weight="bold" color="#afafaf" />;
  return dir === 'asc' ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />;
}

/**
 * LeaderboardTable — peringkat #4 ke atas
 * Kolom: Rank, Madrasah (nama + BMU + badge negeri/swasta), Skor, Approved, Updated (tie-breaker), Aksi
 * Sortable: skor (default), approved, updatedAt
 */
export default function LeaderboardTable({ data = [] }) {
  const rows = data.slice(3); // #4 dst
  const [sort, setSort] = useState({ key: 'rank', dir: 'asc' });

  const sorted = useMemo(() => {
    const arr = [...rows];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (key === 'updatedAt') {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sort]);

  const toggle = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'skor' ? 'desc' : 'asc' }));
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center">
          <Trophy size={20} weight="regular" color="#afafaf" />
        </div>
        <div className="text-[14px] font-black text-charcoal mt-3">Belum ada data peringkat</div>
        <div className="text-[13px] font-medium text-pencil">Pilih periode/kelompok lain atau tunggu validasi Admin.</div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      {/* header */}
      <div className="px-5 h-[56px] flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
            <Hash size={16} weight="regular" color="#777777" />
          </span>
          <div>
            <div className="text-[13px] font-black text-charcoal leading-none">Peringkat #4 ke atas</div>
            <div className="text-[11px] font-bold text-pencil">Tie-breaker: skor → approved → waktu → BMU ID</div>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-pencil bg-white border-2 border-zinc-200 rounded-full px-3 h-7">
          <CheckCircle size={12} weight="regular" color="#58cc02" /> {rows.length} madrasah
        </span>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b-2 border-zinc-100">
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase whitespace-nowrap">
                <button onClick={() => toggle('rank')} className="inline-flex items-center gap-1 hover:text-charcoal">
                  Rank <SortIcon active={sort.key === 'rank'} dir={sort.dir} />
                </button>
              </th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase">Madrasah</th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase whitespace-nowrap text-right">
                <button onClick={() => toggle('skor')} className="inline-flex items-center gap-1 hover:text-charcoal">
                  Skor <SortIcon active={sort.key === 'skor'} dir={sort.dir} />
                </button>
              </th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase whitespace-nowrap text-right hidden sm:table-cell">
                <button onClick={() => toggle('approved')} className="inline-flex items-center gap-1 hover:text-charcoal">
                  Approved <SortIcon active={sort.key === 'approved'} dir={sort.dir} />
                </button>
              </th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase whitespace-nowrap hidden lg:table-cell">
                <button onClick={() => toggle('updatedAt')} className="inline-flex items-center gap-1 hover:text-charcoal">
                  Updated <SortIcon active={sort.key === 'updatedAt'} dir={sort.dir} />
                </button>
              </th>
              <th className="px-4 py-3 text-[11px] font-black tracking-wide text-faded uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map((r) => (
              <tr key={r.bmuId} className="hover:bg-zinc-50/70 transition">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black text-charcoal">
                    #{r.rank}
                  </span>
                </td>
                <td className="px-4 py-3 min-w-[220px]">
                  <Link to={`/madrasah/${r.slug}`} className="font-display font-black text-[13px] text-charcoal hover:text-eager leading-tight block">
                    {r.nama}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] font-bold text-pencil">{r.bmuId}</span>
                    <span className="w-1 h-1 rounded-full bg-faded" />
                    <span
                      className={`inline-flex h-5 px-2 rounded-full border text-[10px] font-black ${
                        r.status === 'Negeri' ? 'bg-[#e0f2ff] border-[#cde9ff] text-[#0b5cab]' : 'bg-white border-zinc-200 text-pencil'
                      }`}
                    >
                      {r.jenjang} • {r.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-charcoal text-white text-[12px] font-black">
                    {formatSkor(r.skor)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap hidden sm:table-cell text-[13px] font-bold text-charcoal">{r.approved}</td>
                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pencil">
                    <Clock size={12} weight="regular" /> {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('id-ID') : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link
                    to={`/madrasah/${r.slug}`}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black text-charcoal hover:border-charcoal"
                  >
                    Lihat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-zinc-50 border-t-2 border-zinc-100 flex items-center justify-between text-[11px] font-bold text-pencil">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} weight="regular" /> Urutan final ditentukan backend (tie-breaker deterministik)
        </span>
        <span className="hidden sm:inline">Total {data.length} madrasah di kelompok ini</span>
      </div>
    </div>
  );
}
