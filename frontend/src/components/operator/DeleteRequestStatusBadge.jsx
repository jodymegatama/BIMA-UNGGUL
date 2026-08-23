import { FileText, Clock, CheckCircle, XCircle } from 'phosphor-react';

const map = {
  'Belum Diajukan': { label: 'Belum Diajukan', cls: 'bg-white border-zinc-200 text-faded', Icon: FileText, color: '#afafaf' },
  'Menunggu Persetujuan': { label: 'Menunggu Persetujuan', cls: 'bg-spark text-white border-spark-dark shadow-sticker-blue', Icon: Clock, color: 'white' },
  Disetujui: { label: 'Disetujui', cls: 'bg-eager text-white border-eager-dark shadow-sticker', Icon: CheckCircle, color: 'white' },
  Ditolak: { label: 'Ditolak', cls: 'bg-ink text-white border-black', Icon: XCircle, color: 'white' },
};

export default function DeleteRequestStatusBadge({ status = 'Belum Diajukan', size = 'sm' }) {
  const cfg = map[status] || map['Belum Diajukan'];
  const Icon = cfg.Icon;
  const sizeCls = size === 'sm' ? 'h-6 px-2.5 text-[11px]' : 'h-7 px-3 text-[12px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border-2 font-black ${cfg.cls} ${sizeCls}`}>
      <Icon size={size === 'sm' ? 12 : 14} weight={status === 'Disetujui' || status === 'Menunggu Persetujuan' ? 'fill' : 'regular'} color={cfg.color} />
      {cfg.label}
    </span>
  );
}
