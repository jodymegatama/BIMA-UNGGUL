import { FileText, Clock, CheckCircle, XCircle } from 'phosphor-react';

const map = {
  Draft: { label: 'Draft', cls: 'bg-white border-zinc-200 text-faded', Icon: FileText, color: '#afafaf' },
  Menunggu: { label: 'Menunggu', cls: 'bg-spark text-white border-spark-dark shadow-sticker-blue', Icon: Clock, color: 'white' },
  Disetujui: { label: 'Disetujui', cls: 'bg-eager text-white border-eager-dark shadow-sticker', Icon: CheckCircle, color: 'white' },
  Ditolak: { label: 'Ditolak', cls: 'bg-ink text-white border-black', Icon: XCircle, color: 'white' },
};

/**
 * StatusBadge — shared reusable untuk Operator & Admin
 * Dipindahkan dari components/operator/StatusBadge agar bisa dipakai lintas zona
 */
export default function StatusBadge({ status = 'Draft', size = 'sm', showIcon = true, className = '' }) {
  const cfg = map[status] || map.Draft;
  const Icon = cfg.Icon;
  const sizeCls = size === 'sm' ? 'h-6 px-2.5 text-[11px]' : 'h-7 px-3 text-[12px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border-2 font-black ${cfg.cls} ${sizeCls} ${className}`}>
      {showIcon && <Icon size={size === 'sm' ? 12 : 14} weight={status === 'Disetujui' || status === 'Menunggu' ? 'fill' : 'regular'} color={cfg.color} />}
      {cfg.label}
    </span>
  );
}
