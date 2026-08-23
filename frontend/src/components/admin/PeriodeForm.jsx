import { useState } from 'react';
import { X, Calendar, Clock, Info } from 'phosphor-react';

export default function PeriodeForm({ onClose, onSubmit }) {
  const [nama, setNama] = useState('');
  const [mulai, setMulai] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [err, setErr] = useState({});

  const tahun = (() => {
    const m = nama.match(/(\d{4})\s*\/\s*(\d{4})/);
    return m ? parseInt(m[1], 10) : null;
  })();

  const handle = () => {
    const e = {};
    if (!nama.trim()) e.nama = 'Nama periode wajib (contoh 2026/2027)';
    else if (!/^\d{4}\/\d{4}$/.test(nama.trim())) e.nama = 'Format harus YYYY/YYYY';
    if (!mulai) e.mulai = 'Tanggal mulai wajib';
    if (!cutoff) e.cutoff = 'Tanggal cut-off wajib';
    if (mulai && cutoff && new Date(cutoff) <= new Date(mulai)) e.cutoff = 'Cut-off harus setelah mulai';
    setErr(e);
    if (Object.keys(e).length) return;
    onSubmit({ nama: nama.trim(), tahunCapaian: tahun, tanggalMulai: new Date(mulai).toISOString(), tanggalCutoff: new Date(cutoff).toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-[16px] border-2 border-zinc-200 bg-white shadow-float overflow-hidden">
        <div className="h-12 px-5 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
          <h3 className="font-display font-black text-[15px] text-charcoal">Buat Periode Baru</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center"><X size={14} weight="bold" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="periode-nama" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Nama periode <span className="text-red-600">*</span></label>
            <input id="periode-nama" name="namaPeriode" type="text" autoComplete="off" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="2026/2027" className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 ${err.nama ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`} />
            {err.nama ? <div className="text-[11px] font-bold text-red-600 mt-1">{err.nama}</div> : <div className="text-[11px] font-medium text-faded mt-1">Tahun capaian otomatis: {tahun ?? '-'}</div>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="periode-mulai" className="block text-[11px] font-black tracking-wide text-charcoal uppercase flex items-center gap-1"><Calendar size={12} /> Tanggal mulai <span className="text-red-600">*</span></label>
              <input id="periode-mulai" name="tanggalMulai" type="datetime-local" value={mulai} onChange={(e) => setMulai(e.target.value)} className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 ${err.mulai ? 'border-red-300 focus:border-red-400' : 'border-zinc-200 focus:border-ink'}`} />
              {err.mulai && <div className="text-[11px] font-bold text-red-600 mt-1">{err.mulai}</div>}
            </div>
            <div>
              <label htmlFor="periode-cutoff" className="block text-[11px] font-black tracking-wide text-charcoal uppercase flex items-center gap-1"><Clock size={12} /> Cut-off <span className="text-red-600">*</span></label>
              <input id="periode-cutoff" name="tanggalCutoff" type="datetime-local" value={cutoff} onChange={(e) => setCutoff(e.target.value)} className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 ${err.cutoff ? 'border-red-300 focus:border-red-400' : 'border-zinc-200 focus:border-ink'}`} />
              {err.cutoff && <div className="text-[11px] font-bold text-red-600 mt-1">{err.cutoff}</div>}
            </div>
          </div>
          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2">
            <Info size={16} weight="regular" color="#777777" className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-5 font-medium text-pencil">Periode baru akan berstatus <b>Belum Dimulai</b> hingga tanggal mulai tiba. Bobot per periode bisa diatur setelah periode dibuat.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black">Batal</button>
            <button onClick={handle} className="flex-1 h-10 rounded-full bg-ink text-white border-2 border-black text-[13px] font-black hover:brightness-110">Buat Periode</button>
          </div>
        </div>
      </div>
    </div>
  );
}
