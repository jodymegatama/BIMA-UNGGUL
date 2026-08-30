import { Buildings, Target, Scales, Lightbulb, ShieldCheck, Prohibit, CheckCircle, ArrowRight } from 'phosphor-react';
import { Link } from 'react-router-dom';
import { KELOMPOKS } from '../../../constants/indikator';

/**
 * IntroSection — Bagian 1: Tentang BIMA UNGGUL (PRD §1 Overview)
 * Identitas, problem statement, proposed solution + alur 4 langkah + anti-goal
 */
export default function IntroSection() {
  return (
    <section className="py-10 lg:py-14">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        {/* eyebrow */}
        <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
          <Buildings size={14} weight="fill" color="#4caf00" /> Tentang BIMA UNGGUL
        </div>

        <div className="mt-4 grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-10 items-start">
          {/* kiri: identitas + problem */}
          <div>
            <h2 className="font-display font-black tracking-[-0.02em] text-[28px] lg:text-[36px] leading-[0.95] text-charcoal">
              Sistem pemeringkatan mutu madrasah yang transparan, berbasis bukti
            </h2>
            <p className="text-[14px] leading-6 text-pencil font-medium mt-3">
              <span className="font-black text-charcoal">BIMA UNGGUL — Bina Madrasah Unggul</span> dikelola Seksi Pendidikan Madrasah (Pendma)
              Kankemenag Kabupaten Pasuruan untuk seluruh madrasah <b>MI/MTs/MA, Negeri & Swasta</b> se-Kabupaten Pasuruan. Periode contoh:{' '}
              <span className="inline-flex h-6 px-2 rounded-full bg-story border border-[#b8eb8a] text-[11px] font-black text-eager-dark">2026/2027</span>
            </p>

            <div className="mt-6 rounded-[16px] border-2 border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-2 text-[11px] font-black tracking-wide text-faded uppercase">
                <Target size={14} weight="fill" color="#afafaf" /> Problem
              </div>
              <p className="text-[13px] leading-6 text-pencil font-medium mt-2">
                Sebelumnya pengumpulan & pemeringkatan capaian mutu masih manual, rawan bias, dan tidak memberi insentif terukur. Operator butuh cara mudah
                melapor, Admin butuh validasi yang auditable, publik butuh transparansi peringkat.
              </p>
              <div className="mt-4 flex items-start gap-2 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
                <Scales size={16} weight="regular" color="#1cb0f6" className="mt-0.5 shrink-0" />
                <p className="text-[12px] leading-5 font-bold text-charcoal">
                  Solusi: alur digital <span className="text-eager">Input Operator → Validasi Admin → Skor → Leaderboard</span> — skor murni
                  akumulasi <code className="px-1 py-0.5 rounded bg-white border border-zinc-200 text-[11px]">capaian Approved × bobot</code> per 9
                  indikator, tanpa target/minimum, tanpa score engine otomatis.
                </p>
              </div>
            </div>

            {/* anti-goal */}
            <div className="mt-4 rounded-[12px] border-2 border-amber-200 bg-amber-50 p-4 flex gap-3">
              <Prohibit size={18} weight="fill" color="#d97706" className="shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] font-black text-amber-900">Prinsip anti-goal (pembeda sistem)</div>
                <ul className="mt-1.5 list-disc pl-4 text-[12px] leading-5 font-medium text-amber-900/80 space-y-1">
                  <li>Tidak ada skor target, passing grade, atau skor minimum.</li>
                  <li>Tidak ada bobot otomatis/kategori — bobot dikonfigurasi manusia per periode.</li>
                  <li>Tidak ada batas jumlah capaian per indikator.</li>
                  <li>Tidak ada kolaborasi real-time multi-user pada satu form.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* kanan: alur 4 langkah (reuse MetodeSection style) */}
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-[11px] font-black tracking-wide text-faded uppercase">
              <Lightbulb size={14} weight="fill" color="#afafaf" /> Alur proses
            </div>
            <div className="mt-4 grid gap-3">
              {[
                { n: 1, title: 'Input Operator', desc: 'Isi capaian per 9 indikator, simpan draft, kirim saat siap. Link bukti wajib.', color: 'bg-eager border-eager-dark text-white' },
                { n: 2, title: 'Validasi Admin', desc: 'Admin cek bukti, approve/reject (alasan wajib) atau revoke jika salah.', color: 'bg-spark border-spark-dark text-white' },
                { n: 3, title: 'Hitung Skor', desc: 'Backend hitung Σ capaian × bobot per indikator → total skor realtime.', color: 'bg-ink border-black text-white' },
                { n: 4, title: 'Leaderboard', desc: `Publik lihat peringkat per ${KELOMPOKS.length} kelompok + grafik Top 10 tanpa login.`, color: 'bg-eager border-eager-dark text-white shadow-sticker' },
              ].map((s) => (
                <div key={s.n} className="flex gap-3 rounded-[12px] border-2 border-zinc-100 bg-zinc-50 p-3">
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[12px] font-black shrink-0 ${s.color}`}>{s.n}</span>
                  <div>
                    <div className="text-[13px] font-black text-charcoal leading-tight">{s.title}</div>
                    <div className="text-[12px] leading-5 font-medium text-pencil">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[12px] bg-story border-2 border-[#b8eb8a] p-3 flex items-center gap-2 text-[12px] font-bold text-charcoal">
              <ShieldCheck size={16} weight="fill" color="#4caf00" /> Transparan: hanya capaian <b>Disetujui</b> yang masuk skor & laporan.
            </div>
            <div className="mt-4 flex gap-2">
              <Link to="/leaderboard" className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-eager border-2 border-eager-dark text-white text-[13px] font-black shadow-sticker">
                Lihat Peringkat <ArrowRight size={14} weight="bold" color="white" />
              </Link>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-faded">
                <CheckCircle size={12} weight="fill" color="#58cc02" /> Real-time
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
