import { INDIKATORS as MOCK_INDIKATORS } from '../../constants/indikator';

export default function IndikatorTabs({ activeKode, onChange, counts = {}, indikatorList, draftCounts = {} }) {
  const list = Array.isArray(indikatorList) && indikatorList.length ? indikatorList : MOCK_INDIKATORS;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      {list.map((ind, idx) => {
        const active = ind.kode === activeKode;
        const count = counts[ind.kode] || 0;
        // Jumlah draft server per indikator — satu-satunya sumber badge
        const draftCount = draftCounts[ind.kode] || 0;
        const draftTitle = draftCount > 0 ? `Ada ${draftCount} draf tersimpan di tab ini` : undefined;
        const draftAria = draftCount > 0 ? `Ada ${draftCount} draf tersimpan` : undefined;
        // Seleksi di onPointerDown (bukan click): render storm dari loadDrafts/
        // swap indikator list bisa me-rebuild DOM di antara pointerdown dan click,
        // sehingga click tertelan — tab terasa "tidak bisa diklik".
        // Keyboard (Enter/Space) tetap lewat onClick (e.detail === 0).
        const select = () => onChange(ind.kode);
        return (
          <button
            key={ind.kode}
            onPointerDown={(e) => { if (e.pointerType !== 'keyboard') select(); }}
            onClick={(e) => { if (e.detail === 0) select(); }}
            title={draftTitle}
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
            {/* Badge jumlah draft — angka eksplisit, bukan dot tanpa informasi */}
            {draftCount > 0 && (
              <span
                data-testid={`draft-badge-${ind.kode}`}
                aria-label={draftAria}
                className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black bg-spark text-white border-2 ${active ? 'border-eager-dark' : 'border-white'}`}
              >
                {draftCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
