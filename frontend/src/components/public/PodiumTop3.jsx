import { Trophy, Medal, Crown, Star, User } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { formatSkor } from '../../lib/format';

/**
 * PodiumTop3 — shared, reusable
 * Visual: #2 kiri (h-[54px]), #1 tengah paling tinggi (h-[78px] + crown), #3 kanan (h-[42px])
 * Pola sama dengan HeroSection skeleton, tapi dengan data real + warna eager/spark
 * - Juara 1: bg-white border-eager/30, badge crown, trophy fill eager, podium eager
 * - Juara 2/3: bg-zinc-50, medal outline, podium zinc-100
 * - Slot kosong (data.length < 3) → placeholder dashed setinggi podium rank tsb,
 *   bukan null — agar kartu "Podium Top 3" tidak tampak hampa (PRD US8 transparansi)
 * Props: { data: Array<{rank, nama, slug, skor, approved, bmuId}> }
 * Pattern Context7 /reactjs/react.dev (Rendering Lists): map slots + key={rank} di komponen.
 */

const PODIUM_HEIGHT = { 1: 'h-[78px]', 2: 'h-[54px]', 3: 'h-[42px]' };
const PODIUM_WIDTH = { 1: 'max-w-[168px] -mt-4', 0: 'max-w-[148px]' };

function Placeholder({ rank }) {
  const isOne = rank === 1;
  return (
    <div className={`flex-1 ${rank === 1 ? 'max-w-[168px] -mt-4' : 'max-w-[148px]'}`}>
      <div className="relative rounded-[16px] border-2 border-dashed border-zinc-200 bg-white/50 p-3 text-center">
        {/* medali/crown pudar */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-zinc-50 border-2 border-zinc-100 ${
            isOne ? '-top-4 w-9 h-9' : '-top-3 w-7 h-7'
          }`}
        >
          <Trophy size={isOne ? 14 : 12} weight="regular" color="#d4d4d8" />
        </div>

        {/* avatar dashed */}
        <div
          className={`mx-auto flex items-center justify-center rounded-full border-2 border-dashed border-zinc-200 ${
            isOne ? 'w-14 h-14 mt-3' : 'w-12 h-12 mt-2'
          }`}
        >
          <User size={18} weight="regular" color="#d4d4d8" />
        </div>

        <div className="mt-3">
          <div className="font-display font-black text-[13px] leading-tight text-faded line-clamp-2">Belum ada</div>
          <div className="text-[11px] font-bold text-faded mt-0.5 truncate">—</div>
        </div>

        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center justify-center rounded-full border-2 border-dashed border-zinc-200 text-[11px] font-black px-2.5 h-7 text-faded">
            0 poin
          </span>
        </div>
        <div className="text-[10px] font-bold text-faded mt-1.5">Menunggu validasi</div>
      </div>

      {/* podium block dashed */}
      <div className={`border-2 border-dashed border-t-0 rounded-b-[12px] -mt-2 flex flex-col items-center justify-center gap-1 border-zinc-200 ${PODIUM_HEIGHT[rank]}`}>
        <span className="font-display font-black leading-none text-[18px] text-zinc-300">#{rank}</span>
      </div>
    </div>
  );
}

export default function PodiumTop3({ data = [] }) {
  const first = data[0];
  const second = data[1];
  const third = data[2];

  const Card = ({ item, rank }) => {
    const isOne = rank === 1;
    return (
      <div className={`flex-1 ${rank === 1 ? 'max-w-[168px] -mt-4' : 'max-w-[148px]'}`}>
        <div
          className={`relative rounded-[16px] border-2 p-3 text-center ${
            isOne ? 'bg-white border-eager/30 shadow-sm p-3 pt-4' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          {/* medali/crown */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full border-white shadow-sm ${
              isOne ? '-top-4 w-9 h-9 bg-story border-[3px]' : '-top-3 w-7 h-7 bg-zinc-200 border-2'
            }`}
          >
            {isOne ? <Crown size={16} weight="fill" color="#ffb800" /> : <Medal size={12} weight="fill" color="white" />}
          </div>

          {/* avatar */}
          <div
            className={`mx-auto flex items-center justify-center rounded-full border-2 ${
              isOne
                ? 'w-14 h-14 mt-3 bg-story border-[#b8eb8a] text-eager'
                : 'w-12 h-12 mt-2 bg-white border-zinc-200 text-zinc-400'
            }`}
          >
            <Trophy size={isOne ? 20 : 18} weight="fill" color={isOne ? '#58cc02' : '#a1a1aa'} />
          </div>

          <div className="mt-3">
            <Link
              to={`/madrasah/${item.slug}`}
              className="font-display font-black text-[13px] leading-tight text-charcoal hover:text-eager line-clamp-2 block"
              title={item.nama}
            >
              {item.nama}
            </Link>
            <div className="text-[11px] font-bold text-pencil mt-0.5 truncate">{item.bmuId}</div>
          </div>

          <div className="mt-3 flex justify-center">
            <span
              className={`inline-flex items-center justify-center rounded-full border-2 text-[11px] font-black px-2.5 h-7 ${
                isOne ? 'bg-eager text-white border-eager-dark shadow-sticker' : 'bg-white border-zinc-200 text-charcoal'
              }`}
            >
              {formatSkor(item.skor)} poin
            </span>
          </div>
          {!isOne && (
            <div className="text-[10px] font-bold text-faded mt-1.5">{item.approved} capaian</div>
          )}
          {isOne && (
            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-pencil">
              <Star size={10} weight="fill" color="#ffb800" /> {item.approved} capaian
            </div>
          )}
        </div>

        {/* podium block */}
        <div
          className={`border-2 border-t-0 rounded-b-[12px] -mt-2 flex flex-col items-center justify-center gap-1 ${
            isOne
              ? 'h-[78px] bg-eager border-eager-dark text-white shadow-sticker'
              : rank === 2
                ? 'h-[54px] bg-white border-zinc-200'
                : 'h-[42px] bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`font-display font-black leading-none ${isOne ? 'text-[28px] text-white' : 'text-[18px] text-faded'}`}>#{rank}</span>
          {isOne && <span className="text-[11px] font-bold text-white/90 -mt-1">Juara 1</span>}
        </div>
      </div>
    );
  };

  // 3 slot tetap dirender — entri nyata atau placeholder dashed (key={rank}, Context7 Rendering Lists)
  const slots = [
    { rank: 2, item: second },
    { rank: 1, item: first },
    { rank: 3, item: third },
  ];

  return (
    <div className="flex items-end gap-2 lg:gap-3 justify-center">
      {slots.map(({ rank, item }) =>
        item ? <Card key={rank} item={item} rank={rank} /> : <Placeholder key={rank} rank={rank} />
      )}
    </div>
  );
}
