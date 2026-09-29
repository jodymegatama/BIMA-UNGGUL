import { useEffect, useState } from 'react';
import { Clock, WarningCircle, Lock, CalendarPlus } from 'phosphor-react';
import { urgency, countdownText, formatTanggal } from '../../lib/periode';

/**
 * PeriodeCutoffChip — chip status + tanggal cut-off periode untuk zona Operator.
 * Styling mengikuti DESIGN.md (Duolingo style): pill radius 12px, border 2px solid,
 * flat tanpa shadow, 11px font-black. Warna semantik:
 * - normal  : putih/zinc  — aman (>7 hari)
 * - warning : Storybook Green (#d7ffb8 / #b8eb8a) — sisa 4–7 hari
 * - danger  : amber — sisa ≤3 hari / hari-H
 * - closed  : Night Ink (#000437) — periode ditutup (cut-off lewat / finalisasi / arsip)
 * - upcoming: Spark Blue — belum dimulai
 *
 * Props:
 * - periode: { namaPeriode, status, tanggalMulai, tanggalCutoff } | null | undefined
 * - compact: sembunyikan tanggal, tampilkan hanya countdown (utk TopBar)
 * - showIcon: default true
 * - now: override waktu (test)
 */
const VARIANTS = {
  normal: 'bg-white border-zinc-200 text-pencil',
  warning: 'bg-story border-[#b8eb8a] text-eager-dark',
  danger: 'bg-amber-50 border-amber-300 text-amber-900',
  closed: 'bg-ink border-black text-white',
  upcoming: 'bg-white border-[#cde9ff] text-spark-dark',
};

const ICON_COLOR = {
  normal: '#afafaf',
  warning: '#3f9142',
  danger: '#b45309',
  closed: '#ffffff',
  upcoming: '#0b5cab',
};

// Map objek (bukan fungsi) — komponen ikon direferensikan, tidak dibuat saat render (react-hooks/static-components)
const ICON_BY_URGENCY = {
  normal: Clock,
  warning: Clock,
  danger: WarningCircle,
  closed: Lock,
  upcoming: CalendarPlus,
};

export default function PeriodeCutoffChip({ periode, compact = false, showIcon = true, now = null }) {
  // Tick menit-an agar countdown melintasi hari tengah malam tanpa reload
  // (hooks di atas early return — Rules of Hooks)
  const [, setTick] = useState(0);
  const u = urgency(periode, now || undefined);
  useEffect(() => {
    if (!u || u === 'closed' || u === 'upcoming') return undefined;
    const iv = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(iv);
  }, [u]);

  if (!u) return null; // tidak ada periode aktif — chip tidak dirender

  const refNow = now || new Date();
  const Icon = showIcon ? ICON_BY_URGENCY[u] : null;
  const tanggal = formatTanggal(periode.tanggalCutoff);
  const sisa = countdownText(periode.tanggalCutoff, refNow);

  let text;
  if (u === 'upcoming') text = compact ? 'Belum dimulai' : `Periode dimulai ${formatTanggal(periode.tanggalMulai) || '—'}`;
  else if (u === 'closed') text = compact ? 'Periode ditutup' : `Periode ditutup ${tanggal ? `• ${tanggal}` : ''}`.trim();
  else if (compact) text = sisa ? `Cut-off ${sisa}` : 'Cut-off —';
  else text = sisa ? `Cut-off ${tanggal ? `${tanggal} • ${sisa}` : sisa}` : `Cut-off ${tanggal || '—'}`;

  // Nama periode TIDAK ikut di mode compact — di TopBar sudah ada chip "Periode {nama}" di sebelahnya
  const label = !compact && periode?.namaPeriode ? `${periode.namaPeriode} — ${text}` : text;

  return (
    <span
      title={tanggal ? `Cut-off periode: ${formatTanggal(periode.tanggalCutoff, true)}` : undefined}
      className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full border-2 text-[11px] font-black whitespace-nowrap ${VARIANTS[u]}`}
    >
      {Icon && <Icon size={12} weight={u === 'danger' ? 'fill' : 'regular'} color={ICON_COLOR[u]} />}
      {label}
    </span>
  );
}
