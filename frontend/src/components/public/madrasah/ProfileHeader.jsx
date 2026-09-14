import { Link } from 'react-router-dom';
import { Trophy, Buildings, MapPin, Users, Hash, CaretRight, Clock, CheckCircle } from 'phosphor-react';
import { formatSkor } from '../../../lib/format';

/**
 * ProfileHeader — header profil madrasah (PRD US9)
 * - Breadcrumb, nama, badge kelompok, BMU, ranking + skor total highlight (mirip podium card)
 * - Tidak menampilkan link bukti sama sekali
 */
export default function ProfileHeader({ madrasah, periode = '2026/2027' }) {
  const kelompokColor = madrasah.status === 'Negeri' ? 'bg-[#e0f2ff] border-[#cde9ff] text-[#0b5cab]' : 'bg-white border-zinc-200 text-pencil';
  const isRanked = Number.isFinite(Number(madrasah.rank));
  const rankLabel = !isRanked
    ? `Belum ada peringkat • ${madrasah.approved} capaian`
    : madrasah.rank <= 3
      ? `Peringkat #${madrasah.rank} dari ${madrasah.rankTotal ?? madrasah.kelompok} • ${madrasah.approved} capaian disetujui`
      : `Peringkat #${madrasah.rank} dari ${madrasah.kelompok} • ${madrasah.approved} capaian disetujui`;
  const rankBadge = isRanked ? `#${madrasah.rank}` : '#—';

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      {/* breadcrumb */}
      <div className="px-5 lg:px-6 h-10 flex items-center gap-1.5 border-b-2 border-zinc-100 bg-zinc-50/60 text-[12px] font-bold">
        <Link to="/" className="text-pencil hover:text-charcoal">Beranda</Link>
        <CaretRight size={12} weight="bold" color="#afafaf" />
        <Link to={`/leaderboard?kelompok=${encodeURIComponent(madrasah.kelompok)}&periode=${encodeURIComponent(periode)}`} className="text-pencil hover:text-charcoal">
          Leaderboard
        </Link>
        <CaretRight size={12} weight="bold" color="#afafaf" />
        <span className="text-charcoal truncate max-w-[180px] sm:max-w-[260px]">{madrasah.nama}</span>
      </div>

      <div className="p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* kiri: identitas */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full border-2 text-[11px] font-black ${kelompokColor}`}>
                <Buildings size={12} weight="fill" color={madrasah.status === 'Negeri' ? '#0b5cab' : '#777777'} />
                {madrasah.kelompok}
              </span>
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil">
                <Hash size={12} weight="bold" /> {madrasah.bmuId}
              </span>
              <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
                Periode {periode}
              </span>
            </div>

            <h1 className="font-display font-black tracking-[-0.02em] text-[28px] lg:text-[36px] leading-none text-charcoal mt-4">
              {madrasah.nama}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-medium">
              <span className="inline-flex items-center gap-1.5 text-pencil">
                <MapPin size={14} weight="regular" color="#777777" /> {madrasah.alamat}
              </span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-faded" />
              <span className="inline-flex items-center gap-1.5 text-pencil">
                <Users size={14} weight="regular" color="#777777" /> {madrasah.jumlahSiswa} siswa
              </span>
            </div>

            <div className="mt-2 text-[12px] font-bold text-faded inline-flex items-center gap-1.5">
              <Clock size={12} weight="regular" /> Diperbarui {new Date(madrasah.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
            </div>
          </div>

          {/* kanan: skor & ranking highlight */}
          <div className="lg:w-[340px] shrink-0">
            <div className="rounded-[16px] border-2 border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-wide text-faded uppercase">Total skor</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-faded">
                  <CheckCircle size={12} weight="fill" color="#58cc02" /> Tervalidasi
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display font-black text-[36px] leading-none text-eager">{formatSkor(madrasah.skor)}</span>
                <span className="text-[12px] font-black text-pencil">poin</span>
                <span className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-eager text-white border-2 border-eager-dark shadow-sticker text-[12px] font-black">
                  <Trophy size={12} weight="fill" color="white" /> {rankBadge}
                </span>
              </div>
              <div className="mt-2 text-[12px] font-bold text-pencil leading-tight">{rankLabel}</div>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/leaderboard?kelompok=${encodeURIComponent(madrasah.kelompok)}`}
                  className="flex-1 inline-flex items-center justify-center h-9 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black text-charcoal hover:border-charcoal"
                >
                  Lihat kelompok
                </Link>
                <span className="inline-flex items-center justify-center h-9 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-bold text-pencil">
                  {madrasah.jenjang} • {madrasah.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
