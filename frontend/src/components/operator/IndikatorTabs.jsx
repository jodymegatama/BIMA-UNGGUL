import { INDIKATORS as MOCK_INDIKATORS } from '../../constants/indikator';

const iconMap = {
  diklat: '🎓',
  penghargaan_individu: '🏅',
  penghargaan_institusi: '🏛️',
  prestasi_siswa: '🏆',
  lulus_jenjang_lanjutan: '🎓',
  rapor_rata_rata: '📊',
  siswa_lanjutan_unggulan: '🎯',
  giat_inovatif: '💡',
  rasio_penerimaan: '📈',
};

export default function IndikatorTabs({ activeKode, onChange, counts = {}, indikatorList, draftKodes = new Set() }) {
  const list = Array.isArray(indikatorList) && indikatorList.length ? indikatorList : MOCK_INDIKATORS;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      {list.map((ind, idx) => {
        const active = ind.kode === activeKode;
        const count = counts[ind.kode] || 0;
        const hasDraft = draftKodes.has(ind.kode);
        return (
          <button
            key={ind.kode}
            onClick={() => onChange(ind.kode)}
            title={hasDraft ? 'Ada draf tersimpan di tab ini' : undefined}
            className={`relative shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full border-2 text-[12px] font-black whitespace-nowrap transition ${
              active ? 'bg-eager text-white border-eager-dark shadow-sticker' : 'bg-white text-charcoal border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <span className="text-[11px] font-black opacity-70">0{idx + 1}</span>
            <span>{ind.short}</span>
            {count > 0 && (
              <span className={`min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-black ${active ? 'bg-white text-eager' : 'bg-zinc-100 text-charcoal border border-zinc-200'}`}>
                {count}
              </span>
            )}
            {/* Dot indicator draf — visibilitas tanpa harus klik tiap tab */}
            {hasDraft && (
              <span
                aria-label="Ada draf tersimpan"
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-spark border-2 ${active ? 'border-eager-dark' : 'border-white'} animate-pulse`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
