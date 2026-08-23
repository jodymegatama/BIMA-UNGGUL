import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, Trophy, TrendUp, PlusCircle, Bell, Buildings, ArrowRight, Info, SpinnerGap } from 'phosphor-react';
import StatusBadge from '../../components/shared/StatusBadge';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useOperator } from '../../context/OperatorContext';
import { formatSkor } from '../../lib/format';
import { fetchSkorDetail, fetchRank, fetchNotifications } from '../../lib/operatorData';

const ZERO_STATS = { Draft: 0, Menunggu: 0, Disetujui: 0, Ditolak: 0 };
const STATUS_KEY = { draft: 'Draft', menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' };

function makeStatCards(stats) {
  return [
    { status: 'Draft', label: 'Draft', value: stats.Draft, desc: 'Belum dikirim', icon: FileText, color: '#afafaf', bg: 'bg-white', border: 'border-zinc-200' },
    { status: 'Menunggu', label: 'Menunggu', value: stats.Menunggu, desc: 'Validasi Admin', icon: Clock, color: 'white', bg: 'bg-spark', border: 'border-spark-dark' },
    { status: 'Disetujui', label: 'Disetujui', value: stats.Disetujui, desc: 'Masuk skor', icon: CheckCircle, color: 'white', bg: 'bg-eager', border: 'border-eager-dark' },
    { status: 'Ditolak', label: 'Ditolak', value: stats.Ditolak, desc: 'Perlu revisi', icon: XCircle, color: 'white', bg: 'bg-ink', border: 'border-black' },
  ];
}

export default function OperatorDashboard() {
  const { token } = useAuth();
  const { madrasah: ctxMadrasah } = useOperator();
  const [stats, setStats] = useState(ZERO_STATS);
  const [skor, setSkor] = useState(null);
  const [ranking, setRanking] = useState({ rank: null, total: null, kelompok: '-', periode: '-', updatedAt: null });
  const madrasahNama = ctxMadrasah?.nama || '-';
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!token) { setLoading(false); return; }
      // 1) stats per status — utama: GET /api/operator/indikator (agregat server-side)
      try {
        const data = await apiFetch('/api/operator/indikator', { auth: true });
        if (ignore) return;
        if (data?.stats) {
          setStats({
            Draft: data.stats.draft || 0,
            Menunggu: data.stats.menunggu || 0,
            Disetujui: data.stats.disetujui || 0,
            Ditolak: data.stats.ditolak || 0,
          });
        }
        if (data?.periode?.namaPeriode) setRanking((prev) => ({ ...prev, periode: data.periode.namaPeriode }));
      } catch { /* fallback di bawah */ }

      // fallback lama: hitung manual dari daftar submission-item
      try {
        const d = await apiFetch('/api/operator/submission-item', { auth: true });
        const arr = Array.isArray(d) ? d : (d.data || []);
        if (!ignore && arr.length) {
          const s = { ...ZERO_STATS };
          arr.forEach((r) => {
            const k = STATUS_KEY[(r.status || '').toLowerCase()];
            if (k) s[k] += 1;
          });
          setStats(s);
        }
      } catch { /* keep zeros */ }

      // 3) notifikasi real
      try {
        const n = await fetchNotifications();
        if (!ignore) setNotifs(n.slice(0, 5));
      } catch { /* ignore */ }

      if (!ignore) setLoading(false);
    }
    load();
    return () => { ignore = true; };
  }, [token]);

  // 2) skor + rank — reaktif terhadap context madrasah (SATU SUMBER DATA)
  useEffect(() => {
    let ignore = false;
    async function loadSkorRank() {
      const m = ctxMadrasah;
      if (!m || !m.id) return;
      if (m.slug) {
        try {
          const detail = await fetchSkorDetail(m.slug);
          if (ignore) return;
          if (detail?.skor) setSkor(detail.skor.totalScore ?? 0);
        } catch { /* skor belum ada */ }
      }
      try {
        const r = await fetchRank(m.kelompok, m.id);
        if (!ignore && r) setRanking((prev) => ({ ...prev, ...r, kelompok: r.kelompok || m.kelompok }));
      } catch { /* ranking belum ada */ }
    }
    loadSkorRank();
    return () => { ignore = true; };
  }, [ctxMadrasah]);

  const total = stats.Draft + stats.Menunggu + stats.Disetujui + stats.Ditolak;
  const progress = total ? Math.round((stats.Disetujui / total) * 100) : 0;
  const statCards = makeStatCards(stats);

  return (
    <div className="space-y-6">
      {/* greeting + periode */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-black tracking-[-0.02em] text-[22px] lg:text-[26px] leading-none text-charcoal">Dashboard Operator</h1>
          <p className="text-[13px] font-medium text-pencil mt-1.5">
            Ringkasan capaian <span className="font-black text-charcoal">{madrasahNama}</span> • Periode {ranking.periode || '—'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark">
          <span className="w-2 h-2 rounded-full bg-eager animate-pulse" style={{ animation: 'pulse-live 1.6s ease infinite' }} />
          {ranking.kelompok !== '-' ? `${ranking.kelompok} • Rank #${ranking.rank ?? '-'}` : 'Rank belum tersedia'}
        </span>
      </div>

      {/* 4 stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.status} className="rounded-[16px] border-2 border-zinc-200 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className={`w-9 h-9 rounded-[12px] border-2 flex items-center justify-center shrink-0 ${s.bg} ${s.border} ${s.color === 'white' ? 'text-white shadow-sticker' : 'text-faded'}`}>
                <s.icon size={18} weight={s.status === 'Disetujui' || s.status === 'Menunggu' ? 'fill' : 'regular'} color={s.color} />
              </span>
              <StatusBadge status={s.status} size="sm" showIcon={false} />
            </div>
            <div className="font-display font-black text-[28px] leading-none text-charcoal mt-3">{loading ? '…' : s.value}</div>
            <div className="text-[11px] font-black tracking-wide text-faded uppercase">{s.label}</div>
            <div className="text-[11px] font-medium text-pencil">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* progress + shortcut */}
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-eager border-2 border-eager-dark shadow-sticker flex items-center justify-center text-white">
                <Trophy size={14} weight="fill" color="white" />
              </span>
              Skor sementara
            </h2>
            <span className="text-[11px] font-bold text-faded">Disetujui {stats.Disetujui}/{total} baris</span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display font-black text-[36px] leading-none text-eager">{formatSkor(skor)}</span>
            <span className="text-[12px] font-black text-pencil">poin</span>
            <span className="ml-auto inline-flex h-7 px-3 rounded-full bg-charcoal text-white text-[12px] font-black">Rank #{ranking.rank ?? '-'} / {ranking.total ?? '-'}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden">
            <div className="h-full bg-eager rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-faded">
            <span>{progress}% capaian disetujui</span>
            <span className="inline-flex items-center gap-1">
              <TrendUp size={12} weight="bold" /> Update {ranking.updatedAt ? new Date(ranking.updatedAt).toLocaleDateString('id-ID') : '—'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-2">
              <div className="text-[11px] font-black text-faded uppercase">Kelompok</div>
              <div className="text-[13px] font-black text-charcoal">{ranking.kelompok}</div>
            </div>
            <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-2">
              <div className="text-[11px] font-black text-faded uppercase">Periode</div>
              <div className="text-[13px] font-black text-charcoal">{ranking.periode}</div>
            </div>
            <div className="rounded-[12px] bg-story border-2 border-[#b8eb8a] p-2">
              <div className="text-[11px] font-black text-eager-dark uppercase">Status</div>
              <div className="text-[13px] font-black text-charcoal">Aktif</div>
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-5 shadow-card flex flex-col">
          <h2 className="font-display font-black text-[14px] text-charcoal">Aksi cepat</h2>
          <p className="text-[12px] font-medium text-pencil mt-1">Tambah capaian baru atau lanjutkan draft.</p>
          <Link
            to="/operator/input"
            className="mt-4 inline-flex items-center justify-center gap-2 h-11 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[14px] shadow-sticker hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition"
          >
            <PlusCircle size={18} weight="bold" color="white" /> Input Capaian Baru
          </Link>
          <Link
            to="/operator/riwayat"
            className="mt-2 inline-flex items-center justify-center gap-2 h-10 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px] hover:border-charcoal"
          >
            Lihat Riwayat <ArrowRight size={14} weight="bold" />
          </Link>
          <div className="mt-4 rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2">
            <Info size={16} weight="regular" color="#1cb0f6" className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-5 font-medium text-pencil">
              Link bukti wajib akses publik (Anyone with link). Draft tidak masuk skor.
            </p>
          </div>
        </div>
      </div>

      {/* notifikasi terbaru */}
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
        <div className="px-5 h-12 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
          <h2 className="font-display font-black text-[14px] text-charcoal flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
              <Bell size={16} weight="regular" color="#777777" />
            </span>
            Notifikasi terbaru
          </h2>
          <span className="text-[11px] font-bold text-faded">{notifs.length} terbaru</span>
        </div>
        {notifs.length === 0 ? (
          <div className="px-5 py-6 text-center text-[12px] font-bold text-faded flex items-center justify-center gap-2">
            {loading ? <><SpinnerGap size={14} weight="bold" className="animate-spin" /> Memuat…</> : 'Belum ada notifikasi.'}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => {}}
                className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition"
              >
                <StatusBadge status={n.read ? 'Disetujui' : 'Menunggu'} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-black text-charcoal leading-tight truncate">{n.judul}</div>
                  <div className="text-[12px] font-medium text-pencil truncate">{n.desc}</div>
                </div>
                <span className="text-[11px] font-bold text-faded whitespace-nowrap">{n.time}</span>
              </button>
            ))}
          </div>
        )}
        <div className="px-5 py-3 bg-zinc-50 border-t-2 border-zinc-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-faded inline-flex items-center gap-1">
            <Buildings size={12} weight="regular" color="#afafaf" /> {madrasahNama}
          </span>
          <Link to="/operator/riwayat" className="text-[11px] font-black text-spark hover:underline">
            Lihat semua →
          </Link>
        </div>
      </div>
    </div>
  );
}
