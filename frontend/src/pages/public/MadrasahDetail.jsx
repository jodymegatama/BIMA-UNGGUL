import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Info, ShareNetwork, Trophy, WarningCircle, ArrowsClockwise } from 'phosphor-react';
import ProfileHeader from '../../components/public/madrasah/ProfileHeader';
import IndikatorChart from '../../components/public/madrasah/IndikatorChart';
import IndikatorTable from '../../components/public/madrasah/IndikatorTable';
import PrestasiList from '../../components/public/madrasah/PrestasiList';
import useRevealOnScroll from '../../hooks/useRevealOnScroll';
import { apiGet } from '../../lib/api';
import { INDIKATORS } from '../../constants/indikator';

/**
 * MadrasahDetail — /madrasah/:slug (PRD US9)
 * - Header profil, radar 9 indikator, tabel 9 baris, prestasi terverifikasi (tanpa link bukti)
 * - Real API: GET /api/madrasah/:slug (tanpa Authorization)
 * - SECURITY: linkBukti tidak pernah dirender — backend sudah filter di select, frontend juga strip
 */

function capitalizeTingkat(v) {
  if (!v) return 'Kabupaten';
  const map = { kabupaten: 'Kabupaten', provinsi: 'Provinsi', nasional: 'Nasional', internasional: 'Internasional' };
  return map[String(v).toLowerCase()] || String(v);
}

function mapPrestasi(apiList) {
  if (!Array.isArray(apiList)) return [];
  return apiList.map((p) => {
    // SECURITY: linkBukti/link_bukti/bukti sengaja TIDAK dipetakan ke output
    // (defense in depth — backend sudah filter di select). Jangan tambahkan tanpa review security.
    return {
      id: p.id,
      indikatorKode: p.indikator?.slug || p.indikatorKode || 'diklat',
      indikatorNama: p.indikator?.nama || p.indikatorNama || '-',
      nama: p.namaKegiatan || p.nama || '-',
      institusi: p.institusi || '-',
      tingkat: capitalizeTingkat(p.tingkatWilayah || p.tingkat),
      tahun: p.tahun || new Date(p.createdAt).getFullYear(),
      siswa: p.namaPeserta || p.siswa || null,
      pembilang: p.pembilang ?? null,
      penyebut: p.penyebut ?? null,
      jenjangPendidikan: p.jenjangPendidikan || null,
      jumlah: p.jumlah ?? null,
      // catatan intentionally not showing linkBukti
    };
  });
}

function formatSkor(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '0';
  if (Number.isInteger(v)) return String(v);
  return v % 1 === 0 ? String(v) : v.toFixed(2).replace(/\.?0+$/, '');
}

function mapIndikatorSkor(breakdown) {
  if (!breakdown || typeof breakdown !== 'object') return INDIKATORS.map((ind) => ({ ...ind, skor: 0, skorRaw: 0 }));
  return INDIKATORS.map((ind) => {
    const raw = typeof breakdown[ind.kode] === 'number' && Number.isFinite(breakdown[ind.kode]) ? breakdown[ind.kode] : 0;
    return { ...ind, skor: raw, skorRaw: raw, skorDisplay: formatSkor(raw) };
  });
}

export default function MadrasahDetail() {
  const { slug } = useParams();
  const ref = useRef(null);
  useRevealOnScroll(ref);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [madrasahUi, setMadrasahUi] = useState(null);
  const [periode, setPeriode] = useState(null);
  const [indikatorSkor, setIndikatorSkor] = useState([]);
  const [prestasi, setPrestasi] = useState([]);

  useEffect(() => {
    let ignore = false;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const data = await apiGet(`/api/madrasah/${encodeURIComponent(slug)}`);
        if (ignore) return;
        const m = data.madrasah;
        const skor = data.skor;
        const per = data.periode;
        setPeriode(per);

        // adapt madrasah to ProfileHeader shape (mock-compatible)
        const adapted = {
          nama: m.namaMadrasah || m.nama || '-',
          bmuId: m.nomorMadrasah || m.bmuId || '-',
          jenjang: m.jenjang || '',
          status: m.statusKepemilikan || m.status || '',
          kelompok: m.kelompok || `${m.jenjang || ''} ${m.statusKepemilikan || ''}`.trim(),
          jumlahSiswa: m.jumlahSiswa ?? 0,
          alamat: m.alamat || '-',
          slug: m.slug,
          // rank/score derived from skor — if ranking not available, show "-" but keep skor
          rank: '-', // ranking per kelompok bisa di-fetch terpisah jika perlu; untuk Zona 1 tampilkan skor saja
          // skor raw — format tampilan via formatSkor di ProfileHeader (konsisten dgn leaderboard)
          skor: skor ? (skor.totalScore ?? 0) : 0,
          approved: Array.isArray(data.prestasi) ? data.prestasi.length : skor?.indikatorCount ?? 0,
          updatedAt: m.updatedAt || per?.updatedAt || new Date().toISOString(),
        };
        setMadrasahUi(adapted);
        setIndikatorSkor(mapIndikatorSkor(skor?.breakdown));
        const cleanPrestasi = mapPrestasi(data.prestasi);
        // final guarantee: ensure no item contains linkBukti key
        cleanPrestasi.forEach((p) => {
          if ('linkBukti' in p || 'link_bukti' in p) delete p.linkBukti;
        });
        setPrestasi(cleanPrestasi);
      } catch (e) {
        if (ignore) return;
        if (e.status === 404) setNotFound(true);
        else setError(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchDetail();
    return () => { ignore = true; };
  }, [slug]);

  // 404 fallback — reuse style sebelumnya tapi tanpa mock list yang menyesatkan
  if (notFound) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-10">
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-50 border-2 border-zinc-200 mx-auto flex items-center justify-center">
            <Trophy size={20} weight="regular" color="#afafaf" />
          </div>
          <h1 className="font-display font-black text-[20px] text-charcoal mt-4">Madrasah tidak ditemukan</h1>
          <p className="text-[13px] font-medium text-pencil mt-2">
            Slug <code className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-xs">/{slug}</code> tidak ditemukan di database.
          </p>
          <Link to="/leaderboard" className="mt-6 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-eager text-white border-2 border-eager-dark shadow-sticker text-[13px] font-black">
            <ArrowLeft size={14} weight="bold" /> Kembali ke Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div ref={ref} className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6 lg:pt-8 pb-10">
        <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-6 animate-pulse">
          <div className="h-6 w-40 bg-zinc-100 rounded-full" />
          <div className="h-8 w-64 bg-zinc-100 rounded-full mt-4" />
          <div className="h-4 w-full bg-zinc-100 rounded-full mt-4" />
        </div>
        <div className="mt-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-5">
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-6 h-[380px] animate-pulse" />
          <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-6 h-[380px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-10">
        <div className="rounded-[16px] border-2 border-amber-200 bg-amber-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center">
              <WarningCircle size={18} weight="fill" color="#d97706" />
            </span>
            <div>
              <div className="text-[13px] font-black text-charcoal">Gagal memuat profil madrasah</div>
              <div className="text-[12px] font-medium text-pencil">{error.message || 'Terjadi kesalahan jaringan.'}</div>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-charcoal text-white text-[13px] font-black hover:brightness-110 shrink-0">
            <ArrowsClockwise size={14} weight="bold" /> Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* dot-pattern kini dari layer global App.jsx — duplikat inline dihapus */}

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6 lg:pt-8 pb-10">
        {/* Header */}
        <div className="reveal">
          <ProfileHeader madrasah={madrasahUi} periode={periode?.namaPeriode || '2026/2027'} />
        </div>

        {/* Chart + Table */}
        <div className="mt-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-5 lg:gap-6 items-start">
          <div className="reveal" style={{ transitionDelay: '0.06s' }}>
            <IndikatorChart data={indikatorSkor} />
          </div>
          <div className="reveal" style={{ transitionDelay: '0.1s' }}>
            <IndikatorTable data={indikatorSkor} />
          </div>
        </div>

        {/* Prestasi — verified: linkBukti 100% tidak bocor */}
        <div className="mt-6 reveal" style={{ transitionDelay: '0.14s' }}>
          <PrestasiList prestasi={prestasi} />
        </div>

        {/* Footer nav */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 reveal">
          <Link to="/leaderboard" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black text-charcoal hover:border-charcoal">
            <ArrowLeft size={14} weight="bold" /> Kembali ke Leaderboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-faded">
              <Info size={12} weight="regular" /> Data real-time — link bukti disembunyikan (publik)
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-charcoal text-white text-[13px] font-black hover:brightness-110"
            >
              <ShareNetwork size={14} weight="regular" /> Salin link profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
