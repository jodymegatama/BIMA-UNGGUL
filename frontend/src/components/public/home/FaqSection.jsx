import { Question, Plus, Minus, Chats, ArrowRight } from 'phosphor-react';

/**
 * FaqSection — persis dari _backup/index.html #faq
 * 5 <details> + CTA "Masih ada pertanyaan?" — copy & class persis
 */
export default function FaqSection() {
  return (
    <section id="faq" className="py-14 lg:py-20 bg-white scroll-mt-[76px]">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        <div className="max-w-[760px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-[#e0f2ff] border-2 border-[#cde9ff] text-[12px] font-black text-[#0b5cab]">
            <Question size={14} weight="regular" />
            Perlu Bantuan?
          </div>
          <h2 className="font-display font-black tracking-[-0.02em] text-[32px] lg:text-[40px] leading-[0.95] text-charcoal mt-4">Pertanyaan umum</h2>
          <p className="text-[15px] leading-[1.5] text-pencil font-medium mt-3">Jawaban cepat untuk Operator, Admin, dan publik yang memantau peringkat.</p>
        </div>

        <div className="max-w-[760px] mx-auto mt-8 space-y-3">
          <details className="group rounded-[16px] border-2 border-zinc-200 bg-white open:bg-zinc-50 open:border-zinc-300 transition-colors" open>
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
              <span className="text-[15px] font-black text-charcoal leading-tight text-left">Siapa yang bisa menginput capaian?</span>
              <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 group-open:bg-charcoal group-open:text-white group-open:border-charcoal flex items-center justify-center shrink-0 transition-colors">
                <Plus size={14} weight="regular" className="group-open:hidden" />
                <Minus size={14} weight="regular" className="hidden group-open:block" />
              </span>
            </summary>
            <div className="px-5 pb-5 text-[14px] leading-[1.6] text-pencil font-medium">
              Operator madrasah yang akunnya sudah disetujui Admin Seksi Pendma. Setiap madrasah memiliki satu akun Operator yang mengelola 9 indikator.
              Publik hanya bisa melihat leaderboard tanpa login.
            </div>
          </details>

          <details className="group rounded-[16px] border-2 border-zinc-200 bg-white open:bg-zinc-50 open:border-zinc-300 transition-colors">
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
              <span className="text-[15px] font-black text-charcoal leading-tight text-left">Bagaimana jika bukti fisik ditolak?</span>
              <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 group-open:bg-charcoal group-open:text-white group-open:border-charcoal flex items-center justify-center shrink-0 transition-colors">
                <Plus size={14} weight="regular" className="group-open:hidden" />
                <Minus size={14} weight="regular" className="hidden group-open:block" />
              </span>
            </summary>
            <div className="px-5 pb-5 text-[14px] leading-[1.6] text-pencil font-medium">
              Admin wajib menulis alasan penolakan. Operator dapat mengedit baris yang sama dan mengirim ulang. Riwayat status tercatat lengkap untuk audit.
            </div>
          </details>

          <details className="group rounded-[16px] border-2 border-zinc-200 bg-white open:bg-zinc-50 open:border-zinc-300 transition-colors">
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
              <span className="text-[15px] font-black text-charcoal leading-tight text-left">Apakah skor bisa turun setelah disetujui?</span>
              <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 group-open:bg-charcoal group-open:text-white group-open:border-charcoal flex items-center justify-center shrink-0 transition-colors">
                <Plus size={14} weight="regular" className="group-open:hidden" />
                <Minus size={14} weight="regular" className="hidden group-open:block" />
              </span>
            </summary>
            <div className="px-5 pb-5 text-[14px] leading-[1.6] text-pencil font-medium">
              Ya. Admin dapat melakukan revoke dengan alasan wajib jika ditemukan kesalahan. Skor madrasah akan dihitung ulang otomatis dan peringkat diperbarui.
            </div>
          </details>

          <details className="group rounded-[16px] border-2 border-zinc-200 bg-white open:bg-zinc-50 open:border-zinc-300 transition-colors">
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
              <span className="text-[15px] font-black text-charcoal leading-tight text-left">Kapan periode penilaian dikunci?</span>
              <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 group-open:bg-charcoal group-open:text-white group-open:border-charcoal flex items-center justify-center shrink-0 transition-colors">
                <Plus size={14} weight="regular" className="group-open:hidden" />
                <Minus size={14} weight="regular" className="hidden group-open:block" />
              </span>
            </summary>
            <div className="px-5 pb-5 text-[14px] leading-[1.6] text-pencil font-medium">
              Setelah status Cut off, Operator tidak bisa submit baru. Admin menyelesaikan validasi lalu melakukan Finalisasi. Periode yang sudah final hanya bisa dibuka
              kembali dengan alasan dan tercatat di audit log.
            </div>
          </details>

          <details className="group rounded-[16px] border-2 border-zinc-200 bg-white open:bg-zinc-50 open:border-zinc-300 transition-colors">
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
              <span className="text-[15px] font-black text-charcoal leading-tight text-left">Apakah leaderboard bisa diunduh sebagai laporan resmi?</span>
              <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 group-open:bg-charcoal group-open:text-white group-open:border-charcoal flex items-center justify-center shrink-0 transition-colors">
                <Plus size={14} weight="regular" className="group-open:hidden" />
                <Minus size={14} weight="regular" className="hidden group-open:block" />
              </span>
            </summary>
            <div className="px-5 pb-5 text-[14px] leading-[1.6] text-pencil font-medium">
              Ya. Admin dapat mengekspor PDF dengan kop instansi dan Excel dengan rincian skor 9 indikator per madrasah. Hanya data berstatus Disetujui yang masuk
              laporan.
            </div>
          </details>
        </div>

        <div className="max-w-[760px] mx-auto mt-8 rounded-[16px] border-2 border-zinc-200 bg-zinc-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
              <Chats size={18} weight="regular" color="#777777" />
            </div>
            <div className="text-left">
              <div className="text-[14px] font-black text-charcoal leading-none">Masih ada pertanyaan?</div>
              <div className="text-[13px] font-medium text-pencil">Hubungi Seksi Pendma Kankemenag Kab. Pasuruan</div>
            </div>
          </div>
          <a
            href="#"
            className="inline-flex items-center justify-center h-10 px-5 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px] hover:border-charcoal transition gap-1.5"
          >
            Hubungi Admin <ArrowRight size={14} weight="regular" />
          </a>
        </div>
      </div>
    </section>
  );
}
