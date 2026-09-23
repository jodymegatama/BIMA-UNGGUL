import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useOperator } from '../../context/OperatorContext';
import { fetchSkorDetail, fetchRank } from '../../lib/operatorData';
import {
  Buildings,
  MapPin,
  Users,
  Hash,
  Trophy,
  TrendUp,
  IdentificationCard,
  Phone,
  ShieldCheck,
  Info,
  ArrowSquareOut,
  PencilSimple,
  FloppyDisk,
  X,
  CheckCircle,
  WarningCircle,
  SpinnerGap,
} from 'phosphor-react';
import { INDIKATORS } from '../../constants/indikator';
import { formatSkor } from '../../lib/format';
import IndikatorTable from '../../components/public/madrasah/IndikatorTable';

function mapIndikatorSkor(breakdown) {
  if (!breakdown || typeof breakdown !== 'object') return INDIKATORS.map((ind) => ({ ...ind, skor: 0 }));
  return INDIKATORS.map((ind) => ({
    ...ind,
    skor: typeof breakdown[ind.kode] === 'number' ? Math.round(breakdown[ind.kode]) : 0,
  }));
}

export default function ProfilMadrasah() {
  const { user } = useAuth();
  const { madrasah: ctxMadrasah, loading: ctxLoading, error: ctxError, refresh: refreshMadrasah, updateMadrasah } = useOperator();
  // Lokal madrasah mengikuti context (SATU SUMBER DATA) — tetap ada setMadrasah lokal untuk optimistik, tapi sumber utama ctx
  const [madrasah, setMadrasah] = useState(ctxMadrasah);
  const [skorTotal, setSkorTotal] = useState(null);
  const [ranking, setRanking] = useState({ rank: null, total: null, kelompok: '', periode: '', updatedAt: null });
  const [indikatorSkor, setIndikatorSkor] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(ctxLoading);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(madrasah);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Sinkron dari context — pola "adjusting state when props change" (docs react.dev):
  // bandingkan nilai prev SAAT RENDER, bukan di effect (hindari cascading render).
  const [prevCtx, setPrevCtx] = useState({ m: ctxMadrasah, l: ctxLoading });
  if (prevCtx.m !== ctxMadrasah || prevCtx.l !== ctxLoading) {
    setPrevCtx({ m: ctxMadrasah, l: ctxLoading });
    setMadrasah(ctxMadrasah);
    setLoadingProfile(ctxLoading);
    setForm(ctxMadrasah); // reset form mengikuti data terbaru
    if (ctxError) setToast({ type: 'error', msg: ctxError });
  }

  // Skor & rank — tergantung madrasah dari context, bukan fetchOwnMadrasah lagi
  useEffect(() => {
    let ignore = false;
    async function loadSkorRank() {
      const m = ctxMadrasah;
      if (!m || !m.id || m.id === null) return;
      // skor & indikator via public detail (butuh slug)
      if (m.slug) {
        try {
          const detail = await fetchSkorDetail(m.slug);
          if (ignore) return;
          if (detail?.skor) setSkorTotal(detail.skor.totalScore ?? 0);
          setIndikatorSkor(mapIndikatorSkor(detail?.skor?.breakdown));
        } catch { /* skor belum tersedia */ }
      }
      // rank per kelompok
      try {
        const r = await fetchRank(m.kelompok, m.id);
        if (ignore || !r) return;
        setRanking(r);
      } catch { /* ranking belum tersedia */ }
    }
    loadSkorRank();
    return () => { ignore = true; };
  }, [ctxMadrasah]);

  const startEdit = () => {
    setForm(madrasah);
    setErrors({});
    setEdit(true);
  };
  const cancel = () => {
    setForm(madrasah);
    setErrors({});
    setEdit(false);
  };

  const validate = () => {
    const e = {};
    const n = String(form.nama ?? '').trim();
    if (n.length < 3 || n.length > 120) e.nama = 'Nama madrasah 3-120 karakter';
    const a = String(form.alamat ?? '').trim();
    if (a.length < 5 || a.length > 500) e.alamat = 'Alamat 5-500 karakter';
    const j = Number(form.jumlahSiswa);
    if (!Number.isInteger(j) || j <= 0) e.jumlahSiswa = 'Jumlah siswa harus integer >0';
    else if (j > 10000) e.jumlahSiswa = 'Maks 10000 siswa';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setToast(null);

    try {
      const updated = await apiFetch('/api/operator/madrasah', {
        method: 'PATCH',
        auth: true,
        body: {
          namaMadrasah: String(form.nama).trim(),
          alamat: String(form.alamat).trim(),
          jumlahSiswa: Number(form.jumlahSiswa),
        },
      });
      const patch = { nama: updated.namaMadrasah, alamat: updated.alamat, jumlahSiswa: updated.jumlahSiswa };
      setMadrasah((prev) => ({ ...prev, ...patch }));
      // SATU SUMBER DATA: update context agar Sidebar & semua halaman /operator/* ikut reaktif tanpa refresh manual
      updateMadrasah(patch);
      // opsional re-fetch penuh untuk konsistensi slug/kelompok dari server
      refreshMadrasah().catch(() => {});
      setEdit(false);
      setToast({ type: 'success', msg: 'Profil madrasah berhasil diperbarui.' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Gagal menyimpan.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-black tracking-[-0.02em] text-[20px] lg:text-[24px] leading-none text-charcoal">Profil Madrasah</h1>
          <p className="text-[12px] font-medium text-pencil mt-1">
            {edit ? 'Edit 3 field yang diizinkan — langsung tanpa approval. Slug tidak berubah.' : 'Data madrasah Anda — 3 field bisa diedit langsung.'}
          </p>
        </div>
        {!edit ? (
          <button onClick={startEdit} disabled={loadingProfile} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-eager border-2 border-eager-dark text-white font-black text-[12px] shadow-sticker hover:brightness-[1.03] disabled:opacity-60">
            <PencilSimple size={14} weight="bold" color="white" /> Edit Profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancel} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white border-2 border-zinc-200 text-charcoal font-black text-[12px] hover:border-charcoal">
              <X size={14} weight="bold" /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-eager border-2 border-eager-dark text-white font-black text-[12px] shadow-sticker disabled:opacity-60"
            >
              {saving ? <SpinnerGap size={14} weight="bold" className="animate-spin" /> : <FloppyDisk size={14} weight="fill" color="white" />} Simpan
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className={`rounded-[12px] border-2 px-4 py-3 flex gap-2.5 text-[13px] font-bold ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} weight="fill" color="#059669" className="shrink-0 mt-0.5" /> : <WarningCircle size={18} weight="fill" color="#dc2626" className="shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header profil */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
        <div className="h-1.5 bg-eager" />
        <div className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-pencil">
                  <Hash size={12} weight="bold" /> {madrasah.bmuId}
                </span>
                <span className={`inline-flex h-7 px-3 rounded-full border-2 text-[11px] font-black ${madrasah.status === 'Negeri' ? 'bg-[#e0f2ff] border-[#cde9ff] text-[#0b5cab]' : 'bg-white border-zinc-200 text-pencil'}`}>
                  {madrasah.kelompok}
                </span>
                <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
                  <ShieldCheck size={12} weight="fill" color="#4caf00" /> Terverifikasi
                </span>
              </div>

              {/* Nama — editable */}
              <div className="mt-3">
                {edit ? (
                  <div>
                    <label htmlFor="profil-nama-madrasah" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
                      Nama madrasah <span className="text-red-600">*</span> <span className="normal-case font-bold text-faded">(editable)</span>
                    </label>
                    <input
                      id="profil-nama-madrasah"
                      name="namaMadrasah"
                      type="text"
                      autoComplete="off"
                      value={form.nama ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, nama: e.target.value }))}
                      placeholder="Nama madrasah"
                      className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[14px] font-black text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition ${errors.nama ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
                    />
                    {errors.nama && <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {errors.nama}</div>}
                    <div className="mt-1 text-[11px] font-medium text-faded">Slug tetap: <span className="font-mono font-bold text-charcoal">{madrasah.slug || '-'}</span> (tidak regenerate)</div>
                  </div>
                ) : (
                  <h2 className="font-display font-black tracking-[-0.02em] text-[22px] lg:text-[26px] leading-none text-charcoal">{madrasah.nama}</h2>
                )}
              </div>

              {/* Alamat & jumlahSiswa — editable */}
              {edit ? (
                <div className="mt-4 grid gap-4">
                  <div>
                    <label htmlFor="profil-alamat" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
                      Alamat madrasah <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      id="profil-alamat"
                      name="alamat"
                      value={form.alamat ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, alamat: e.target.value }))}
                      placeholder="Jl. Raya ..."
                      rows={2}
                      className={`mt-1.5 w-full px-3 py-2 rounded-[12px] border-2 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition resize-none ${errors.alamat ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
                    />
                    {errors.alamat && <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {errors.alamat}</div>}
                  </div>
                  <div>
                    <label htmlFor="profil-jumlah-siswa" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">
                      Jumlah siswa <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="profil-jumlah-siswa"
                      name="jumlahSiswa"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={10000}
                      autoComplete="off"
                      value={form.jumlahSiswa ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, jumlahSiswa: e.target.value }))}
                      placeholder="342"
                      className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[14px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition ${errors.jumlahSiswa ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-eager focus:ring-eager/20'}`}
                    />
                    {errors.jumlahSiswa ? (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {errors.jumlahSiswa}</div>
                    ) : (
                      <div className="text-[11px] font-medium text-faded mt-1">Integer &gt;0, tanpa validasi silang rapor/rasio (sesuai konfirmasi).</div>
                    )}
                  </div>
                  {/* read-only */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 opacity-70">
                      <div className="text-[11px] font-black tracking-wide text-faded uppercase">Jenjang</div>
                      <div className="text-[13px] font-black text-charcoal mt-1">{madrasah.jenjang} • {madrasah.status}</div>
                      <div className="text-[11px] font-bold text-faded">Read-only</div>
                    </div>
                    <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 opacity-70">
                      <div className="text-[11px] font-black tracking-wide text-faded uppercase">Kelompok</div>
                      <div className="text-[13px] font-black text-charcoal mt-1">{madrasah.kelompok}</div>
                      <div className="text-[11px] font-bold text-faded">Derived, immutable</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-medium text-pencil">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} weight="regular" color="#777777" /> {madrasah.alamat}
                  </span>
                  <span className="hidden sm:inline w-1 h-1 rounded-full bg-faded" />
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} weight="regular" color="#777777" /> {madrasah.jumlahSiswa ?? '—'} siswa
                  </span>
                  <span className="hidden sm:inline w-1 h-1 rounded-full bg-faded" />
                  <span className="inline-flex items-center gap-1.5">
                    <Buildings size={12} weight="regular" /> {madrasah.jenjang} • {madrasah.status}
                  </span>
                </div>
              )}
            </div>
            {madrasah.slug && (
              <Link to={`/madrasah/${madrasah.slug}`} target="_blank" className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black text-charcoal hover:border-charcoal shrink-0">
                Lihat publik <ArrowSquareOut size={14} weight="regular" />
              </Link>
            )}
          </div>

          {/* skor ringkas */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1">
                <Trophy size={12} weight="fill" color="#58cc02" /> Skor total
              </div>
              <div className="font-display font-black text-[24px] leading-none text-eager mt-1">
                {formatSkor(skorTotal)} <span className="text-[12px] font-black text-pencil">poin</span>
              </div>
              <div className="text-[11px] font-bold text-pencil">
                {ranking.rank != null ? `Rank #${ranking.rank} / ${ranking.total} di ${madrasah.kelompok}` : `Kelompok ${madrasah.kelompok}`}
              </div>
            </div>
            <div className="rounded-[12px] bg-white border-2 border-zinc-200 p-3">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase">Periode aktif</div>
              <div className="text-[13px] font-black text-charcoal mt-1">{ranking.periode || '—'}</div>
              <div className="text-[11px] font-bold text-pencil">Status: Aktif</div>
            </div>
            <div className="rounded-[12px] bg-white border-2 border-zinc-200 p-3">
              <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1">
                <TrendUp size={12} weight="bold" /> Tren
              </div>
              <div className="text-[12px] font-bold text-pencil mt-1">
                {ranking.updatedAt ? `Update ${new Date(ranking.updatedAt).toLocaleDateString('id-ID')}` : 'Belum ada update'}
              </div>
              <div className="text-[11px] font-medium text-faded">Realtime setelah validasi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Operator info */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
        <h3 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-zinc-50 border-2 border-zinc-200 flex items-center justify-center">
            <IdentificationCard size={16} weight="regular" color="#777777" />
          </span>
          Operator penanggung jawab
        </h3>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
            <div className="text-[11px] font-black tracking-wide text-faded uppercase">Nama lengkap</div>
            <div className="text-[13px] font-black text-charcoal mt-1">{user?.name || user?.namaLengkap || '—'}</div>
            <div className="text-[11px] font-bold text-pencil">{user?.email || '—'}</div>
          </div>
          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3">
            <div className="text-[11px] font-black tracking-wide text-faded uppercase flex items-center gap-1">
              <Phone size={12} weight="regular" /> Kontak
            </div>
            <div className="text-[13px] font-bold text-charcoal mt-1">{user?.telepon || '—'}</div>
            <div className="text-[11px] font-medium text-faded">No. Telepon/WhatsApp — untuk verifikasi Admin</div>
          </div>
        </div>
        <div className="mt-3 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2">
          <Info size={16} weight="regular" color="#777777" className="shrink-0 mt-0.5" />
          <p className="text-[11px] leading-5 font-medium text-pencil">
            3 field di atas bisa diedit langsung tanpa approval. <b>Jenjang, status, BMU, slug, kelompok</b> tetap read-only — hubungi Admin Seksi Pendma jika perlu perubahan data pokok.
          </p>
        </div>
      </div>

      {/* Indikator table */}
      <IndikatorTable data={indikatorSkor} />

      {/* Aksi */}
      <div className="flex flex-wrap gap-2">
        <Link to="/operator/input" className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker">
          <PencilSimple size={16} weight="bold" color="white" /> Input Capaian
        </Link>
        {madrasah.slug && (
          <Link to={`/madrasah/${madrasah.slug}`} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px] hover:border-charcoal">
            Lihat versi publik <ArrowSquareOut size={14} weight="regular" />
          </Link>
        )}
      </div>
    </div>
  );
}
