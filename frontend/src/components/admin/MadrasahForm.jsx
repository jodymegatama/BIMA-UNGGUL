import { useState } from 'react';
import { X, Buildings } from 'phosphor-react';

/**
 * MadrasahForm — modal create/edit madrasah.
 * Mode edit: jenjang & statusKepemilikan & BMU immutable (disabled).
 * Props: { onClose, onSubmit, initial = null }
 */
export default function MadrasahForm({ onClose, onSubmit, initial = null }) {
  const isEdit = Boolean(initial);
  const [nama, setNama] = useState(initial?.namaMadrasah ?? '');
  const [jenjang, setJenjang] = useState(initial?.jenjang ?? 'MI');
  const [kepemilikan, setKepemilikan] = useState(initial?.statusKepemilikan ?? 'Swasta');
  const [siswa, setSiswa] = useState(initial?.jumlahSiswa != null ? String(initial.jumlahSiswa) : '');
  const [alamat, setAlamat] = useState(initial?.alamat ?? '');
  const [err, setErr] = useState({});

  const handle = () => {
    const e = {};
    if (!nama.trim()) e.nama = 'Nama madrasah wajib';
    const n = parseInt(siswa, 10);
    if (!Number.isFinite(n) || n <= 0) e.siswa = 'Jumlah siswa harus angka > 0';
    setErr(e);
    if (Object.keys(e).length) return;
    onSubmit({
      namaMadrasah: nama.trim(),
      jenjang,
      statusKepemilikan: kepemilikan,
      jumlahSiswa: n,
      alamat: alamat.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[540px] rounded-[16px] border-2 border-zinc-200 bg-white shadow-float overflow-hidden">
        <div className="h-12 px-5 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
          <h3 className="font-display font-black text-[15px] text-charcoal">{isEdit ? 'Edit Madrasah' : 'Tambah Madrasah'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-50 hover:border-zinc-300 active:translate-y-[1px] transition"><X size={14} weight="bold" /></button>
        </div>

        <div className="p-5 space-y-4">
          {isEdit && (
            <div className="flex items-center gap-2 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 px-3 py-2.5">
              <Buildings size={14} weight="regular" color="#777777" className="shrink-0" />
              <span className="text-[12px] font-mono font-black text-charcoal">{initial.nomorMadrasah}</span>
              <span className="text-[11px] font-bold text-faded">• Kelompok {initial.kelompok}</span>
            </div>
          )}

          <div>
            <label htmlFor="madrasah-nama" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Nama Madrasah <span className="text-red-600">*</span></label>
            <input
              id="madrasah-nama" name="namaMadrasah" type="text" autoComplete="off"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="MI Negeri Bangil"
              className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 ${err.nama ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
            />
            {err.nama && <div className="text-[11px] font-bold text-red-600 mt-1">{err.nama}</div>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="madrasah-jenjang" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Jenjang {isEdit && <span className="text-faded font-bold">(immutable)</span>}</label>
              <select
                id="madrasah-jenjang" name="jenjang" value={jenjang} disabled={isEdit}
                onChange={(e) => setJenjang(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 border-zinc-200 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 focus:border-ink focus:ring-zinc-200 disabled:bg-zinc-50 disabled:text-faded"
              >
                <option value="MI">MI — Madrasah Ibtidaiyah</option>
                <option value="MTs">MTs — Madrasah Tsanawiyah</option>
                <option value="MA">MA — Madrasah Aliyah</option>
              </select>
            </div>
            <div>
              <label htmlFor="madrasah-kepemilikan" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Kepemilikan {isEdit && <span className="text-faded font-bold">(immutable)</span>}</label>
              <select
                id="madrasah-kepemilikan" name="statusKepemilikan" value={kepemilikan} disabled={isEdit}
                onChange={(e) => setKepemilikan(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 border-zinc-200 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 focus:border-ink focus:ring-zinc-200 disabled:bg-zinc-50 disabled:text-faded"
              >
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="madrasah-siswa" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Jumlah Siswa <span className="text-red-600">*</span></label>
              <input
                id="madrasah-siswa" name="jumlahSiswa" type="number" min={1}
                autoComplete="off"
                value={siswa}
                onChange={(e) => setSiswa(e.target.value.replace(/\D/g, ''))}
                placeholder="250"
                className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 ${err.siswa ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
              />
              {err.siswa && <div className="text-[11px] font-bold text-red-600 mt-1">{err.siswa}</div>}
            </div>
            <div>
              <label htmlFor="madrasah-alamat" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Alamat</label>
              <input
                id="madrasah-alamat" name="alamat" type="text" autoComplete="off"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Jl. Merdeka No. 12, Pasuruan"
                className="mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 border-zinc-200 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 focus:border-ink focus:ring-zinc-200"
              />
            </div>
          </div>

          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2">
            <Buildings size={16} weight="regular" color="#777777" className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-5 font-medium text-pencil">
              {isEdit
                ? 'Nomor BMU, jenjang, dan kepemilikan tidak dapat diubah. Nama & jumlah siswa bebas diubah.'
                : 'Nomor <b>BMU-XXXXXX</b> dan slug dibuat otomatis. Kelompok dihitung dari jenjang + kepemilikan.'}
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black hover:border-charcoal active:translate-y-[1px] transition">Batal</button>
            <button onClick={handle} className="flex-1 h-10 rounded-full bg-ink text-white border-2 border-black text-[13px] font-black shadow-[0_4px_0_0_#000437] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition">{isEdit ? 'Simpan Perubahan' : 'Tambah Madrasah'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
