import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardText, Buildings, Calendar, CheckCircle, Clock, ArrowRight } from 'phosphor-react';
import { apiGet, apiFetch } from '../../lib/api';
import { KELOMPOKS } from '../../constants/indikator';

const KELOMPOK_LIST = KELOMPOKS;

export default function AdminDashboard() {
  const [menungguTotal, setMenungguTotal] = useState(null);
  const [disetujuiTotal, setDisetujuiTotal] = useState(null);
  const [totalSubmission, setTotalSubmission] = useState(null);
  const [periode, setPeriode] = useState(null);
  const [kelompokRows, setKelompokRows] = useState(() => KELOMPOK_LIST.map((k) => ({ kelompok: k, aktif: 0, total: 0, menunggu: null })));

  useEffect(() => {
    let ignore = false;

    async function load() {
      // periode aktif
      try {
        const res = await apiFetch('/api/admin/periode', { auth: true });
        const list = Array.isArray(res?.data) ? res.data : [];
        const aktif = list.find((p) => p.status === 'aktif') || null;
        if (!ignore) setPeriode(aktif);
      } catch { /* no periode yet */ }

      // counts validasi (total menunggu / disetujui / all)
      try {
        const r1 = await apiFetch('/api/admin/validasi?status=menunggu&page=1&limit=1', { auth: true });
        if (!ignore) setMenungguTotal(r1?.total ?? 0);
      } catch { if (!ignore) setMenungguTotal(0); }
      try {
        const r2 = await apiFetch('/api/admin/validasi?status=disetujui&page=1&limit=1', { auth: true });
        if (!ignore) setDisetujuiTotal(r2?.total ?? 0);
      } catch { if (!ignore) setDisetujuiTotal(0); }
      try {
        const r3 = await apiFetch('/api/admin/validasi?page=1&limit=1', { auth: true });
        if (!ignore) setTotalSubmission(r3?.total ?? 0);
      } catch { if (!ignore) setTotalSubmission(0); }

      // per kelompok: total & aktif dari leaderboard publik; menunggu dari queue rows
      try {
        const lb = await apiGet('/api/leaderboard');
        const rk = lb?.rankings || {};
        const rows = KELOMPOK_LIST.map((k) => {
          const list = Array.isArray(rk[k]) ? rk[k] : [];
          return { kelompok: k, aktif: list.filter((r) => (r.totalScore ?? 0) > 0).length, total: list.length, menunggu: null };
        });
        if (!ignore) setKelompokRows(rows);
      } catch { /* leaderboard butuh periode aktif — biarkan 0 */ }
      try {
        const q = await apiFetch('/api/admin/validasi?status=menunggu&page=1&limit=500', { auth: true });
        const arr = Array.isArray(q?.data) ? q.data : [];
        if (!ignore && arr.length) {
          const byK = {};
          arr.forEach((it) => {
            const k = it.madrasah?.kelompok;
            if (k) byK[k] = (byK[k] || 0) + 1;
          });
          setKelompokRows((prev) => prev.map((r) => ({ ...r, menunggu: byK[r.kelompok] ?? 0 })));
        }
      } catch { /* ignore */ }
    }

    load();
    return () => { ignore = true; };
  }, []);

  const cutoff = periode?.tanggalCutoff ? new Date(periode.tanggalCutoff) : null;
  const daysLeft = cutoff ? Math.max(0, Math.ceil((cutoff - new Date()) / 86400000)) : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-black tracking-[-0.02em] text-[22px] lg:text-[26px] leading-none text-charcoal">Dashboard Admin</h1>
          <p className="text-[12px] font-medium text-pencil mt-1">Ringkasan Seksi Pendma • Periode {periode?.namaPeriode || '—'} • {periode ? 'Aktif' : 'Tidak ada periode aktif'}</p>
        </div>
        <Link to="/admin/validasi" className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[12px] bg-ink border-2 border-black text-white font-black text-[13px] hover:brightness-110">
          Antrian Validasi <ArrowRight size={14} weight="bold" color="white" />
        </Link>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-[12px] bg-spark border-2 border-spark-dark shadow-sticker-blue flex items-center justify-center text-white">
              <ClipboardText size={18} weight="fill" color="white" />
            </span>
            {(menungguTotal ?? 0) > 0 && <span className="inline-flex h-6 px-2 rounded-full bg-spark text-white text-[11px] font-black">Perlu aksi</span>}
          </div>
          <div className="font-display font-black text-[28px] leading-none text-charcoal mt-3">{menungguTotal ?? '—'}</div>
          <div className="text-[11px] font-black tracking-wide text-faded uppercase">Menunggu validasi</div>
          <div className="text-[11px] font-bold text-pencil mt-1">{totalSubmission ?? '—'} total submission</div>
        </div>

        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
          <div className="w-9 h-9 rounded-[12px] bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center text-white">
            <CheckCircle size={18} weight="fill" color="white" />
          </div>
          <div className="font-display font-black text-[28px] leading-none text-charcoal mt-3">{disetujuiTotal ?? '—'}</div>
          <div className="text-[11px] font-black tracking-wide text-faded uppercase">Disetujui</div>
          <div className="text-[11px] font-bold text-pencil">Masuk skor</div>
        </div>

        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
          <div className="w-9 h-9 rounded-[12px] bg-zinc-50 border-2 border-zinc-200 flex items-center justify-center">
            <Buildings size={18} weight="regular" color="#777777" />
          </div>
          <div className="font-display font-black text-[28px] leading-none text-charcoal mt-3">{kelompokRows.reduce((a, b) => a + b.total, 0)}</div>
          <div className="text-[11px] font-black tracking-wide text-faded uppercase">Madrasah aktif</div>
          <div className="text-[11px] font-bold text-pencil">6 kelompok</div>
        </div>

        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
          <div className="w-9 h-9 rounded-[12px] bg-ink border-2 border-black flex items-center justify-center text-white">
            <Calendar size={18} weight="regular" color="white" />
          </div>
          <div className="font-display font-black text-[28px] leading-none text-charcoal mt-3">{daysLeft}</div>
          <div className="text-[11px] font-black tracking-wide text-faded uppercase">Hari menuju cut-off</div>
          <div className="text-[11px] font-bold text-pencil">{cutoff ? cutoff.toLocaleDateString('id-ID') : '—'}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-4">
        {/* per kelompok */}
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
          <div className="px-5 h-12 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
            <h2 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
              <Buildings size={16} weight="regular" color="#777777" /> Madrasah per kelompok
            </h2>
            <span className="text-[11px] font-bold text-faded">{kelompokRows.reduce((a, b) => a + b.total, 0)} total</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {kelompokRows.map((k) => (
              <div key={k.kelompok} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-[13px] font-black text-charcoal">{k.kelompok}</div>
                  <div className="text-[11px] font-bold text-pencil">{k.aktif} aktif / {k.total} total</div>
                </div>
                <div className="flex items-center gap-2">
                  {k.menunggu != null && (
                    <span className="hidden sm:inline-flex h-6 px-2 rounded-full bg-zinc-50 border-2 border-zinc-100 text-[11px] font-bold text-pencil">{k.menunggu} menunggu</span>
                  )}
                  <span className="w-20 h-2 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden hidden sm:block">
                    <span className="block h-full bg-eager" style={{ width: `${k.total ? Math.round((k.aktif / k.total) * 100) : 0}%` }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* periode + shortcut */}
        <div className="space-y-4">
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
            <h3 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
              <Calendar size={16} weight="regular" color="#777777" /> Periode saat ini
            </h3>
            <div className="mt-3 rounded-[12px] bg-story border-2 border-[#b8eb8a] p-3">
              <div className="text-[11px] font-black tracking-wide text-eager-dark uppercase">Aktif</div>
              <div className="text-[15px] font-black text-charcoal">{periode?.namaPeriode || '—'}</div>
              <div className="text-[11px] font-bold text-pencil">
                {periode ? `Mulai ${new Date(periode.tanggalMulai).toLocaleDateString('id-ID')} • Cut-off ${new Date(periode.tanggalCutoff).toLocaleDateString('id-ID')}` : 'Belum ada periode aktif'}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to="/admin/periode" className="flex-1 h-9 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[12px] font-black hover:border-charcoal">Kelola periode</Link>
              <Link to="/admin/bobot" className="flex-1 h-9 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-[12px] font-black hover:border-charcoal">Atur bobot</Link>
            </div>
          </div>

          <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
            <div className="px-5 h-11 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
              <span className="text-[13px] font-black text-charcoal flex items-center gap-2"><Clock size={14} weight="regular" /> Terbaru</span>
              <Link to="/admin/validasi" className="text-[11px] font-black text-spark hover:underline">Lihat antrian →</Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {(menungguTotal ?? 0) === 0 ? (
                <div className="px-5 py-6 text-center text-[12px] font-bold text-faded">Tidak ada submission menunggu validasi.</div>
              ) : (
                <div className="px-5 py-4 flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-eager mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[12px] font-black text-charcoal leading-tight">{menungguTotal} submission menunggu validasi</div>
                    <div className="text-[11px] font-medium text-pencil">Buka Antrian Validasi untuk memproses.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
