import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Stack, GraduationCap, Medal, Buildings, Trophy, Student, ChartLineUp, PaperPlaneTilt, Lightbulb, UsersThree } from 'phosphor-react';
import useIndikatorCatalog from '../../hooks/useIndikatorCatalog';
import { customTypeLabels } from '../../lib/customFields';
import DeskripsiIndikator from '../shared/DeskripsiIndikator';
const icons = { diklat: GraduationCap, penghargaan_individu: Medal, penghargaan_institusi: Buildings, prestasi_siswa: Trophy, lulus_jenjang_lanjutan: Student, rapor_rata_rata: ChartLineUp, siswa_lanjutan_unggulan: PaperPlaneTilt, giat_inovatif: Lightbulb, rasio_penerimaan: UsersThree };
const formulas = { per_jumlah: 'Total nilai field jumlah terpilih × bobot', per_kategori: 'Nilai pengali (atau satu capaian) × bobot pilihan kategori, lalu dijumlahkan', per_capaian: 'Jumlah capaian disetujui × bobot', per_tingkat_wilayah: 'Jumlah capaian tiap wilayah × bobot wilayah, lalu dijumlahkan', per_jenjang: 'Jumlah lulusan tiap jenjang × bobot jenjang, lalu dijumlahkan', persentase: 'Total pembilang ÷ total penyebut × bobot (0 dari 0 = 0)' };

export default function IndikatorCatalog({ lengkap = false }) {
  const { data, loading, error } = useIndikatorCatalog();
  useEffect(() => {
    if (lengkap && data.length && window.location.hash.startsWith('#indikator-')) document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
  }, [lengkap, data]);
  return <section id="indikator" className="py-14 lg:py-20 border-t-2 border-zinc-100 bg-white scroll-mt-24"><div className="max-w-[1200px] mx-auto px-4 lg:px-6">
    <div className="mb-8 max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border-2 border-[#b8eb8a] bg-story px-3 py-1 text-xs font-black text-eager-dark"><Stack size={14} />Kriteria Penilaian</span><h2 className="mt-4 font-display font-black text-3xl text-charcoal">{lengkap ? 'Kenali setiap indikator mutu' : 'Indikator mutu madrasah'}</h2><p className="mt-3 text-sm text-pencil">{loading ? 'Memuat informasi indikator…' : `${data.length} indikator aktif. Informasi disusun oleh admin untuk publik dan operator madrasah.`}</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}. Muat ulang halaman untuk mencoba lagi.</p>}
    {!loading && !error && !data.length && <p>Belum ada indikator yang dipublikasikan.</p>}
    <div className={`grid gap-5 ${lengkap ? 'lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>{data.map((ind, index) => {
      const Icon = icons[ind.slug] || Stack;
      return <article id={lengkap ? `indikator-${ind.slug}` : undefined} key={ind.id} className="scroll-mt-24 rounded-2xl border-2 border-zinc-200 p-5 shadow-card">
        <div className="flex items-center justify-between"><span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-eager-dark bg-eager text-white shadow-sticker"><Icon size={22} weight="fill" /></span><span className="font-black text-sm text-faded">{String(index + 1).padStart(2, '0')}</span></div>
        <h3 className="mt-5 font-display font-black text-lg leading-tight text-charcoal">{ind.nama}</h3>
        <DeskripsiIndikator deskripsi={ind.deskripsi} ringkas={!lengkap} href={!lengkap ? `/tentang#indikator-${ind.slug}` : undefined} />
        {lengkap && <><h4 className="text-xs font-black uppercase text-pencil">Field capaian</h4><ul className="mt-2 flex flex-wrap gap-2">{(ind.fields || []).map((f) => <li key={f.key} className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold">{f.label}{f.required ? ' *' : ''} · {customTypeLabels[f.type] || ({ number: 'Bilangan bulat', ratio: 'Perbandingan' }[f.type]) || f.type}{f.help ? ` — ${f.help}` : ''}</li>)}</ul><p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm"><strong>Cara menghitung:</strong> {formulas[ind.tipeFormula]}. Bobot mengikuti periode penilaian.</p><Link className="mt-4 inline-block text-sm font-bold underline" to="/login">Masuk sebagai operator →</Link></>}
      </article>;
    })}</div>
  </div></section>;
}
