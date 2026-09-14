import { Lock, PencilSimple } from 'phosphor-react';

const labelMap = {
  diklat: 'Diklat',
  penghargaan_individu: 'Pengh. Individu',
  penghargaan_institusi: 'Pengh. Institusi',
  prestasi_siswa: 'Prestasi Siswa',
  lulus_jenjang_lanjutan: 'Lulus Jenjang',
  rapor_rata_rata: 'Nilai > 85',
  siswa_lanjutan_unggulan: 'Lanjutan Unggulan',
  giat_inovatif: 'Giat Inovatif',
  rasio_penerimaan: 'Rasio',
};

export default function BobotIndikatorForm({ data, onChange, locked }) {
  const update = (kode, field, val) => {
    if (locked) return;
    const num = val === '' ? '' : Number(val);
    onChange(kode, field, num);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      {Object.values(data || {}).map((item) => {
        const tipe = item.tipe;
        return (
          <div key={item.kode} className={`rounded-[16px] border-2 p-4 ${locked ? 'bg-zinc-50 border-zinc-200 opacity-70' : 'bg-white border-zinc-200 shadow-card'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-eager border-2 border-eager-dark flex items-center justify-center text-white text-[11px] font-black">{labelMap[item.kode]?.slice(0,2).toUpperCase()}</span>
                  <div>
                    <div className="text-[13px] font-black text-charcoal leading-tight">{item.nama}</div>
                    <div className="text-[11px] font-mono font-bold text-faded">{item.kode} • {tipe === 'per_capaian' ? 'per capaian × bobot' : tipe === 'per_tingkat' ? 'per tingkat wilayah' : tipe === 'per_jenjang' ? 'per jenjang' : 'persentase × bobot'}</div>
                  </div>
                </div>
              </div>
              {locked ? (
                <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-zinc-100 border-2 border-zinc-200 text-[10px] font-black text-faded"><Lock size={12} weight="fill" color="#afafaf" /> Terkunci</span>
              ) : (
                <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-story border-2 border-[#b8eb8a] text-[10px] font-black text-eager-dark"><PencilSimple size={12} weight="regular" /> Editable</span>
              )}
            </div>

            {/* inputs */}
            <div className="mt-4">
              {tipe === 'per_capaian' && (
                <div>
                  <label htmlFor={`bobot-${item.kode}-nilai`} className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Bobot per capaian</label>
                  <input
                    id={`bobot-${item.kode}-nilai`}
                    name={`bobot-${item.kode}-nilai`}
                    type="number"
                    min={0}
                    step={0.5}
                    autoComplete="off"
                    disabled={locked}
                    value={item.nilai ?? ''}
                    onChange={(e) => update(item.kode, 'nilai', e.target.value)}
                    className={`mt-1.5 w-full max-w-[220px] h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 ${locked ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
                    placeholder="10"
                  />
                  <div className="text-[11px] font-medium text-faded mt-1">Contoh: 10 poin per capaian disetujui • 0 = indikator nonaktif</div>
                </div>
              )}
              {tipe === 'persentase' && (
                <div>
                  <label htmlFor={`bobot-${item.kode}-nilai`} className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Bobot persentase</label>
                  <div className="relative mt-1.5">
                    <input
                      id={`bobot-${item.kode}-nilai`}
                      name={`bobot-${item.kode}-nilai`}
                      type="number"
                      min={0}
                      step={0.1}
                      autoComplete="off"
                      disabled={locked}
                      value={item.nilai ?? ''}
                      onChange={(e) => update(item.kode, 'nilai', e.target.value)}
                      className={`w-full max-w-[220px] h-10 pl-3 pr-8 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 ${locked ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
                      placeholder="0.5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-faded">× %</span>
                  </div>
                  <div className="text-[11px] font-medium text-faded mt-1">Mis. 0.5 × persentase siswa &gt;85 • 0 = indikator nonaktif</div>
                </div>
              )}
              {tipe === 'per_tingkat' && (
                <div>
                  <div className="text-[11px] font-black tracking-wide text-charcoal uppercase">Bobot per tingkat wilayah</div>
                  <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { k: 'kabupaten', label: 'Kab' },
                      { k: 'provinsi', label: 'Prov' },
                      { k: 'nasional', label: 'Nasional' },
                      { k: 'internasional', label: 'Inter' },
                    ].map((t) => (
                      <div key={t.k} className={`rounded-[12px] border-2 p-2 text-center ${t.k === 'nasional' ? 'bg-eager/10 border-eager/30' : 'bg-zinc-50 border-zinc-100'}`}>
                        <div className="text-[11px] font-black text-charcoal">{t.label}</div>
                        <input
                          id={`bobot-${item.kode}-${t.k}`}
                          name={`bobot-${item.kode}-${t.k}`}
                          type="number"
                          min={0}
                          autoComplete="off"
                          aria-label={`Bobot ${t.label} — ${item.nama || item.kode}`}
                          disabled={locked}
                          value={item[t.k] ?? ''}
                          onChange={(e) => update(item.kode, t.k, e.target.value)}
                          className={`mt-1 w-full h-8 px-2 rounded-full border-2 bg-white text-center text-[12px] font-black text-charcoal focus:outline-none focus:ring-2 ${locked ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
                        />
                        <div className="text-[10px] font-bold text-faded mt-1">{item[t.k] ?? 0}x</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <span className="h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Kab 1x</span>
                    <span className="h-6 px-2 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black">Prov 2x</span>
                    <span className="h-6 px-2 rounded-full bg-eager text-white border-2 border-eager-dark text-[11px] font-black">Nasional 3x</span>
                  </div>
                </div>
              )}
              {tipe === 'per_jenjang' && (
                <div>
                  <div className="text-[11px] font-black tracking-wide text-charcoal uppercase">Bobot per jenjang</div>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {[
                      { k: 's1', label: 'S1' },
                      { k: 's2', label: 'S2' },
                      { k: 's3', label: 'S3' },
                    ].map((j) => (
                      <div key={j.k} className={`rounded-[12px] border-2 p-2 text-center ${j.k === 's3' ? 'bg-eager/10 border-eager/30' : 'bg-zinc-50 border-zinc-100'}`}>
                        <div className="text-[11px] font-black text-charcoal">{j.label}</div>
                        <input
                          id={`bobot-${item.kode}-${j.k}`}
                          name={`bobot-${item.kode}-${j.k}`}
                          type="number"
                          min={0}
                          step={0.5}
                          autoComplete="off"
                          aria-label={`Bobot ${j.label} — ${item.nama || item.kode}`}
                          disabled={locked}
                          value={item[j.k] ?? ''}
                          onChange={(e) => update(item.kode, j.k, e.target.value)}
                          className={`mt-1 w-full h-8 px-2 rounded-full border-2 bg-white text-center text-[12px] font-black text-charcoal focus:outline-none focus:ring-2 ${locked ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <span className="flex-1 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black">S1</span>
                    <span className="flex-1 h-7 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[11px] font-black">S2 x1.5</span>
                    <span className="flex-1 h-7 rounded-full bg-eager text-white border-2 border-eager-dark flex items-center justify-center text-[11px] font-black">S3 x2</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
