const map = {
  'Belum Dimulai': 'bg-white border-zinc-200 text-faded',
  Aktif: 'bg-eager text-white border-eager-dark shadow-sticker',
  'Cut-off': 'bg-spark text-white border-spark-dark shadow-sticker-blue',
  'Penyelesaian Validasi': 'bg-[#e0f2ff] border-[#cde9ff] text-[#0b5cab]',
  Finalisasi: 'bg-ink text-white border-black',
  Arsip: 'bg-zinc-100 border-zinc-200 text-faded',
};

export default function PeriodeStatusBadge({ status }) {
  const cls = map[status] || map['Belum Dimulai'];
  return <span className={`inline-flex items-center h-6 px-2.5 rounded-full border-2 text-[11px] font-black ${cls}`}>{status}</span>;
}
