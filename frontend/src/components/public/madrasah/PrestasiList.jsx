import { Trophy, Medal, GraduationCap, UsersThree, Lightbulb, Buildings, ChartBar, CheckCircle, Calendar } from 'phosphor-react';

const tingkatStyle = {
  Kabupaten: 'bg-white border-zinc-200 text-charcoal',
  Provinsi: 'bg-[#e0f2ff] border-[#cde9ff] text-[#0b5cab]',
  Nasional: 'bg-eager text-white border-eager-dark shadow-sticker',
  Internasional: 'bg-ink text-white border-black',
};

const indikatorIcon = {
  diklat: GraduationCap,
  penghargaan_individu: Medal,
  penghargaan_institusi: Buildings,
  prestasi_siswa: Trophy,
  lulus_jenjang_lanjutan: GraduationCap,
  rapor_rata_rata: ChartBar,
  siswa_lanjutan_unggulan: UsersThree,
  giat_inovatif: Lightbulb,
  rasio_penerimaan: Buildings,
};

/**
 * PrestasiList — daftar prestasi terverifikasi TANPA link bukti
 * Hanya menampilkan: nama, institusi, tingkat (badge), tahun/siswa — sesuai PRD US9
 * Props: { prestasi: Array<{id, indikatorKode, indikatorNama, nama, institusi, tingkat, tahun, siswa}> }
 */
export default function PrestasiList({ prestasi = [] }) {
  if (prestasi.length === 0) {
    return (
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center">
          <Trophy size={20} weight="regular" color="#afafaf" />
        </div>
        <div className="text-[14px] font-black text-charcoal mt-3">Belum ada prestasi terverifikasi</div>
        <div className="text-[13px] font-medium text-pencil">Capaian yang disetujui Admin akan muncul di sini.</div>
      </div>
    );
  }

  // kelompokkan per indikator untuk readability, tapi tampil flat dengan header indikator
  const grouped = prestasi.reduce((acc, p) => {
    if (!acc[p.indikatorKode]) acc[p.indikatorKode] = [];
    acc[p.indikatorKode].push(p);
    return acc;
  }, {});

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      <div className="px-5 h-[56px] flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
            <Medal size={16} weight="regular" color="#777777" />
          </span>
          <div>
            <div className="text-[13px] font-black text-charcoal leading-none">Prestasi terverifikasi</div>
            <div className="text-[11px] font-bold text-pencil">{prestasi.length} capaian • tanpa link bukti (publik)</div>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-pencil">
          <CheckCircle size={12} weight="fill" color="#58cc02" /> Disetujui Admin
        </span>
      </div>

      <div className="divide-y-2 divide-zinc-100">
        {Object.entries(grouped).map(([kode, list]) => {
          const Icon = indikatorIcon[kode] || Trophy;
          return (
            <div key={kode} className="p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-zinc-50 border-2 border-zinc-200 flex items-center justify-center">
                  <Icon size={14} weight="fill" color="#58cc02" />
                </span>
                <span className="text-[12px] font-black text-charcoal">{list[0].indikatorNama}</span>
                <span className="text-[11px] font-bold text-faded">• {list.length} capaian</span>
              </div>

              <div className="grid gap-3">
                {list.map((p) => (
                  <div key={p.id} className="rounded-[12px] border-2 border-zinc-200 bg-white p-4 hover:border-zinc-300 transition">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-black text-[14px] leading-tight text-charcoal">{p.nama}</div>
                        <div className="text-[12px] font-bold text-pencil mt-1 flex items-center gap-1.5">
                          <Buildings size={12} weight="regular" color="#777777" /> {p.institusi}
                        </div>
                        {p.siswa && <div className="text-[12px] font-medium text-pencil">Siswa: <span className="font-bold text-charcoal">{p.siswa}</span></div>}
                      </div>
                      <span className={`inline-flex items-center justify-center h-7 px-3 rounded-full border-2 text-[11px] font-black shrink-0 ${tingkatStyle[p.tingkat] || 'bg-white border-zinc-200'}`}>
                        {p.tingkat}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-faded">
                      <Calendar size={12} weight="regular" /> Tahun {p.tahun}
                      <span className="w-1 h-1 rounded-full bg-faded" />
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle size={12} weight="fill" color="#58cc02" /> Tervalidasi
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 bg-zinc-50 border-t-2 border-zinc-100 text-[11px] font-bold text-pencil flex items-center gap-1.5">
        <CheckCircle size={12} weight="regular" color="#afafaf" />
        Link bukti fisik disembunyikan di halaman publik sesuai PRD — hanya Admin/Operator yang dapat melihat.
      </div>
    </div>
  );
}
