import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, FloppyDisk, PencilSimple, Trash, WarningCircle, Info } from 'phosphor-react';
import { formatTanggal } from '../../lib/periode';

/**
 * DraftPanel — panel "Draft Tersimpan" yang bisa dibuka-tutup di halaman Input Capaian.
 * Menjawab kebingungan operator: berapa draft tersimpan, apa isinya, dan bagaimana
 * melanjutkannya — tanpa harus membuka halaman Riwayat.
 *
 * Props:
 *  - drafts: Array<{ id:number|string, indikatorKode, namaKegiatan?, updatedAt? }> — draft server tab aktif
 *  - unsavedCount: jumlah baris lokal berisi yang belum tersimpan (id bukan number)
 *  - loading: sedang memuat draft dari server
 *  - open/onToggle: mode terkontrol dari halaman (toast "Lihat Draft" memaksa terbuka); fallback ke state internal
 *  - onContinue(id): lanjutkan draft → buka baris di grid
 *  - onDelete(row): minta hapus draft → buka DeleteDraftModal
 */
export default function DraftPanel({ drafts = [], unsavedCount = 0, loading = false, defaultOpen = true, open: openProp, onToggle, onContinue, onDelete }) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : openState;
  const toggle = () => (onToggle ? onToggle(!open) : setOpenState((o) => !o));

  // Baris lokal memakai id string ("new-…") — cukup saring berdasarkan tipe id.
  const serverDrafts = drafts.filter((r) => typeof r.id === 'number');
  const total = serverDrafts.length;
  const hasAny = total > 0 || unsavedCount > 0;

  // Tidak ada yang perlu ditunjukkan — panel hilang total (bukan kartu kosong)
  if (!hasAny && !loading) return null;

  return (
    <section
      aria-label="Draft tersimpan"
      className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden"
      data-testid="draft-panel"
    >
      {/* Header — selalu tampil ketika ada draft/loading */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-zinc-50 transition"
      >
        <span className="w-9 h-9 rounded-[12px] bg-[#f0f9ff] border-2 border-[#cde9ff] flex items-center justify-center shrink-0">
          <FloppyDisk size={16} weight="fill" color="#0b5cab" />
        </span>
        <span className="min-w-0">
          <span className="block font-display font-black text-[14px] text-charcoal leading-tight">
            Draft Tersimpan
            {total > 0 && (
              <span
                data-testid="draft-count"
                className="ml-2 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-spark text-white text-[11px] font-black align-middle"
              >
                {total}
              </span>
            )}
          </span>
          <span className="block text-[11px] font-medium text-pencil mt-0.5">
            {loading
              ? 'Memuat draft tersimpan…'
              : total > 0
                ? 'Klik Lanjutkan untuk mengedit, atau lanjutkan dari Riwayat kapan saja.'
                : 'Belum ada draft tersimpan di indikator ini.'}
          </span>
        </span>
        <CaretDown
          size={16}
          weight="bold"
          color="#afafaf"
          className={`ml-auto shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {/* Isi panel — animasi expand/collapse (pola height 0→auto, Motion docs) */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="draft-panel-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t-2 border-zinc-100">
              {unsavedCount > 0 && (
                <div className="mt-2 mb-1 inline-flex items-center gap-1.5 rounded-full bg-zinc-50 border-2 border-zinc-200 px-3 h-7 text-[11px] font-black text-pencil">
                  <Info size={12} weight="fill" color="#afafaf" />
                  {unsavedCount} baris baru belum tersimpan — klik Simpan Draft
                </div>
              )}

              {total === 0 ? (
                <p className="text-[12px] font-medium text-pencil py-2">
                  {loading ? 'Memuat…' : 'Belum ada draft tersimpan di indikator ini.'}
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {serverDrafts.map((r) => (
                    <li key={r.id} className="py-2.5 flex flex-wrap items-center gap-2" data-testid="draft-item">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-black text-charcoal truncate">
                          {r.namaKegiatan || '(tanpa nama kegiatan)'}
                        </div>
                        <div className="text-[11px] font-medium text-pencil mt-0.5">
                          {r.updatedAt ? `Terakhir diubah ${formatTanggal(r.updatedAt, true)}` : 'Draft tersimpan'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onContinue?.(r.id)}
                          title="Buka draft ini di grid"
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black shadow-sticker hover:brightness-[1.03]"
                        >
                          <PencilSimple size={12} weight="bold" /> Lanjutkan
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(r)}
                          title="Hapus draft permanen"
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal hover:border-red-300 hover:text-red-700"
                        >
                          <Trash size={12} weight="bold" /> Hapus
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {unsavedCount > 0 && total > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-pencil">
                  <WarningCircle size={12} weight="fill" color="#d97706" />
                  Ada baris baru yang belum masuk draft tersimpan.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
