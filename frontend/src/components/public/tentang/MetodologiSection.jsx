import { ShieldCheck, GitBranch, Trophy, Scales, Clock, Flag, CheckCircle, WarningCircle, ArrowsLeftRight } from 'phosphor-react';

/**
 * MetodologiSection — Bagian 3: Metodologi & Cara Kerja (PRD §6 Interaction, §11 formula, §9 lifecycle, 6 kelompok, tie-breaker)
 */
export default function MetodologiSection() {
  return (
    <section className="py-10 lg:py-14 bg-zinc-50 border-y-2 border-zinc-100">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        <div className="max-w-[760px]">
          <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-charcoal">
            <Scales size={14} weight="fill" color="#777777" /> Metodologi penilaian
          </div>
          <h2 className="font-display font-black tracking-[-0.02em] text-[28px] lg:text-[36px] leading-none text-charcoal mt-4">Bagaimana peringkat dihitung</h2>
          <p className="text-[13px] leading-6 text-pencil font-medium mt-3">
            Skor transparan, real-time, dan deterministik. Di bawah ini ringkasan alur validasi, pengelompokan, tie-breaker, dan lifecycle periode untuk konteks publik.
          </p>
        </div>

        {/* validasi flow */}
        <div className="mt-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
            <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1.5">
              <GitBranch size={14} weight="regular" color="#afafaf" /> Alur validasi per baris
            </div>
            <div className="mt-4 grid gap-3">
              {[
                { s: 'Draft', d: 'Disimpan di server, bisa dilanjutkan lain sesi.', c: 'bg-zinc-50 border-zinc-200 text-charcoal' },
                { s: 'Menunggu', d: 'Dikirim untuk divalidasi Admin.', c: 'bg-[#e0f2ff] border-[#cde9ff] text-[#0b5cab]' },
                { s: 'Disetujui', d: 'Masuk skor. Picu hitung ulang otomatis.', c: 'bg-eager text-white border-eager-dark shadow-sticker' },
                { s: 'Ditolak', d: 'Wajib alasan. Operator edit baris yang sama & kirim ulang.', c: 'bg-white border-zinc-200 text-charcoal' },
              ].map((r) => (
                <div key={r.s} className="flex gap-3">
                  <span className={`h-7 px-3 rounded-full border-2 text-[11px] font-black shrink-0 inline-flex items-center justify-center ${r.c}`}>{r.s}</span>
                  <span className="text-[12px] leading-5 font-medium text-pencil pt-0.5">{r.d}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[12px] bg-amber-50 border-2 border-amber-200 p-3 flex gap-2">
              <WarningCircle size={16} weight="fill" color="#d97706" className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-5 font-bold text-amber-900">
                Revoke: Admin dapat membatalkan persetujuan (alasan wajib) → skor hitung ulang. Koreksi tanpa undo/redo, semua tercatat di audit trail.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 6 kelompok */}
            <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase">6 kelompok (ranking terpisah)</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {['MI Negeri', 'MI Swasta', 'MTs Negeri', 'MTs Swasta', 'MA Negeri', 'MA Swasta'].map((k) => (
                  <span key={k} className="h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[12px] font-black text-charcoal">
                    {k}
                  </span>
                ))}
              </div>
              <p className="text-[11px] leading-5 font-medium text-pencil mt-3">Tiap madrasah hanya bersaing dalam kelompoknya. Tidak ada perbandingan lintas jenjang/status.</p>
            </div>

            {/* tie-breaker */}
            <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1.5">
                <Scales size={14} weight="regular" color="#afafaf" /> Tie-breaker deterministik
              </div>
              <ol className="mt-3 space-y-2 text-[12px] font-bold">
                <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-eager text-white flex items-center justify-center text-[11px] font-black shrink-0">1</span> Skor total tertinggi</li>
                <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black shrink-0">2</span> Jumlah submission Approved terbanyak</li>
                <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black shrink-0">3</span> Waktu pencapaian skor lebih awal</li>
                <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black shrink-0">4</span> BMU ID terkecil (stabil)</li>
              </ol>
              <p className="text-[11px] leading-5 font-medium text-faded mt-3">Menjamin ranking unik meski skor sama — ditampilkan di Leaderboard.</p>
            </div>
          </div>
        </div>

        {/* formula + periode */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5">
            <div className="text-[11px] font-black tracking-wide text-faded uppercase">Formula</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 font-display font-black text-[18px] lg:text-[20px] leading-none text-charcoal">
              <span className="inline-flex h-8 px-3 rounded-full bg-story border-2 border-[#b8eb8a] items-center text-[14px]">Skor</span>
              <span className="text-faded">=</span>
              <span className="inline-flex items-center gap-1">Σ <span className="text-[11px] font-bold text-pencil">capaian disetujui</span></span>
              <span className="text-eager">×</span>
              <span className="inline-flex h-8 px-3 rounded-full bg-eager text-white border-2 border-eager-dark shadow-sticker items-center text-[14px]">bobot</span>
            </div>
            <p className="text-[12px] leading-5 font-medium text-pencil mt-3">Diakumulasi per indikator, lalu dijumlah. Tidak ada maksimum.</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-black">
              <span className="h-6 px-2 rounded-full bg-zinc-50 border-2 border-zinc-200">per capaian</span>
              <span className="h-6 px-2 rounded-full bg-zinc-50 border-2 border-zinc-200">per tingkat</span>
              <span className="h-6 px-2 rounded-full bg-zinc-50 border-2 border-zinc-200">persentase</span>
            </div>
          </div>

          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5">
            <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1.5">
              <Clock size={14} weight="regular" color="#afafaf" /> Lifecycle periode (publik ringkas)
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Belum Dimulai', 'Aktif', 'Cut-off', 'Penyelesaian Validasi', 'Finalisasi', 'Arsip'].map((s, i) => (
                <span key={s} className={`h-7 px-3 rounded-full border-2 text-[11px] font-black inline-flex items-center gap-1 ${i === 1 ? 'bg-eager text-white border-eager-dark shadow-sticker' : i === 4 ? 'bg-ink text-white border-black' : 'bg-white border-zinc-200 text-charcoal'}`}>
                  <Flag size={12} weight={i === 1 || i === 4 ? 'fill' : 'regular'} /> {s}
                </span>
              ))}
            </div>
            <div className="mt-3 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2">
              <ArrowsLeftRight size={14} weight="regular" color="#777777" className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-5 font-bold text-pencil">
                Setelah <b>Cut-off</b> operator tidak bisa submit; Admin selesaikan validasi → <b>Finalisasi</b> mengunci periode & bobot. Reopen final butuh alasan & tercatat audit log.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[11px] font-bold text-faded">
          <ShieldCheck size={14} weight="regular" color="#afafaf" /> Sumber: PRD §1, §3, §6, §11, §17 — tidak ada data yang dikarang.
        </div>
      </div>
    </section>
  );
}
