import { useState } from 'react';
import { X, Link as LinkIcon, CheckCircle, XCircle, ArrowClockwise, WarningCircle } from 'phosphor-react';
import StatusBadge from '../shared/StatusBadge';

export default function ValidasiDetailModal({ item, onClose, onApprove, onReject, onRevoke }) {
  const [mode, setMode] = useState(null); // 'reject' | 'revoke' | null
  const [alasan, setAlasan] = useState('');
  const [err, setErr] = useState('');

  if (!item) return null;

  const handleReject = () => {
    if (!alasan.trim()) return setErr('Alasan wajib diisi.');
    onReject(item.id, alasan.trim());
    setMode(null);
    setAlasan('');
    setErr('');
  };
  const handleRevoke = () => {
    if (!alasan.trim()) return setErr('Alasan revoke wajib diisi.');
    onRevoke(item.id, alasan.trim());
    setMode(null);
    setAlasan('');
    setErr('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[640px] max-h-[90vh] overflow-auto rounded-[16px] border-2 border-zinc-200 bg-white shadow-float">
        <div className="sticky top-0 bg-white border-b-2 border-zinc-100 p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-[16px] text-charcoal leading-tight">{item.namaKegiatan}</h3>
              <StatusBadge status={item.status} />
            </div>
            <div className="text-[12px] font-bold text-pencil mt-1">{item.madrasahNama} • {item.madrasahKelompok} • {item.indikatorNama}</div>
            <div className="text-[11px] font-medium text-faded mt-1">ID {item.id} • {new Date(item.tanggalSubmit).toLocaleString('id-ID')} • Periode {item.periode} {item.skor ? `• Skor ${item.skor}` : ''}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-50 border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-100">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-4 space-y-2">
            <div className="text-[11px] font-black tracking-wide text-faded uppercase">Detail capaian</div>
            <div className="grid sm:grid-cols-2 gap-3 text-[12px]">
              {item.namaKegiatan && <div><span className="font-bold text-faded">Nama Kegiatan/Penghargaan</span><div className="font-black text-charcoal">{item.namaKegiatan}</div></div>}
              {item.institusi && <div><span className="font-bold text-faded">Institusi Penerbit</span><div className="font-black text-charcoal">{item.institusi}</div></div>}
              {item.namaPeserta && <div><span className="font-bold text-faded">Nama Peserta/Siswa</span><div className="font-black text-charcoal">{item.namaPeserta}</div></div>}
              {item.statusPegawai && <div><span className="font-bold text-faded">Status Pegawai</span><div className="font-black text-charcoal">{item.statusPegawai === 'non_asn' ? 'non-ASN' : 'ASN'}</div></div>}
              {item.tingkatWilayah && <div><span className="font-bold text-faded">Tingkat Wilayah</span><div className="font-black text-charcoal">{item.tingkatWilayah.charAt(0).toUpperCase() + item.tingkatWilayah.slice(1)}</div></div>}
              {item.jenjangPendidikan && <div><span className="font-bold text-faded">Jenjang Pendidikan</span><div className="font-black text-charcoal">{item.jenjangPendidikan.toUpperCase()}</div></div>}
              {item.jumlah != null && item.jumlah !== '' && <div><span className="font-bold text-faded">Jumlah ASN</span><div className="font-black text-charcoal">{item.jumlah}</div></div>}
              {item.pembilang != null && item.penyebut != null && (
                <div>
                  <span className="font-bold text-faded">Rasio</span>
                  <div className="font-black text-charcoal">
                    {item.pembilang} dari {item.penyebut}
                    {Number(item.penyebut) > 0 ? ` = ${((Number(item.pembilang) / Number(item.penyebut)) * 100).toFixed(1).replace(/\.0$/, '')}%` : ''}
                  </div>
                </div>
              )}
              <div className="sm:col-span-2"><span className="font-bold text-faded">Catatan</span><div className="font-medium text-charcoal">{item.catatan || '-'}</div></div>
            </div>
            {item.alasan && <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 text-[12px]"><span className="font-black text-red-900">Alasan penolakan sebelumnya:</span> <span className="font-medium text-red-800">{item.alasan}</span></div>}
          </div>

          <a href={item.linkBukti} target="_blank" rel="noreferrer" className="flex items-center gap-2 h-10 px-4 rounded-[12px] bg-white border-2 border-zinc-200 hover:border-ink text-[13px] font-black text-charcoal">
            <LinkIcon size={16} weight="regular" /> Buka Bukti Fisik (tab baru)
          </a>

          {!mode && (
            <div className="flex flex-wrap gap-2">
              {item.status === 'Menunggu' && (
                <>
                  <button onClick={() => onApprove(item.id)} className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 h-10 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker">
                    <CheckCircle size={16} weight="fill" color="white" /> Approve
                  </button>
                  <button onClick={() => setMode('reject')} className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 h-10 rounded-[12px] bg-white border-2 border-zinc-200 text-charcoal font-black text-[13px] hover:border-ink">
                    <XCircle size={16} weight="regular" /> Reject
                  </button>
                </>
              )}
              {item.status === 'Disetujui' && (
                <button onClick={() => setMode('revoke')} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[12px] bg-ink border-2 border-black text-white font-black text-[13px]">
                  <ArrowClockwise size={16} weight="regular" color="white" /> Revoke
                </button>
              )}
              {item.status === 'Ditolak' && (
                <button onClick={() => onApprove(item.id)} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker">
                  <CheckCircle size={16} weight="fill" color="white" /> Approve ulang
                </button>
              )}
            </div>
          )}

          {mode && (
            <div className="rounded-[12px] border-2 border-zinc-200 bg-white p-4 space-y-3">
              <div className="text-[13px] font-black text-charcoal">{mode === 'reject' ? 'Alasan penolakan (wajib)' : 'Alasan revoke (wajib)'}</div>
              <textarea
                id="validasi-alasan"
                name="alasanValidasi"
                aria-label={mode === 'reject' ? 'Alasan penolakan (wajib)' : 'Alasan revoke (wajib)'}
                value={alasan}
                onChange={(e) => { setAlasan(e.target.value); setErr(''); }}
                placeholder={mode === 'reject' ? 'Jelaskan mengapa ditolak...' : 'Jelaskan mengapa revoke...'}
                rows={3}
                className={`w-full px-3 py-2 rounded-[12px] border-2 bg-white text-[13px] font-medium text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 transition resize-none ${err ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
              />
              {err && <div className="flex items-center gap-1 text-[11px] font-bold text-red-600"><WarningCircle size={12} weight="fill" /> {err}</div>}
              <div className="flex gap-2">
                <button onClick={() => { setMode(null); setAlasan(''); setErr(''); }} className="flex-1 h-9 rounded-full bg-white border-2 border-zinc-200 text-[12px] font-black">Batal</button>
                <button onClick={mode === 'reject' ? handleReject : handleRevoke} className="flex-1 h-9 rounded-full bg-ink text-white border-2 border-black text-[12px] font-black">
                  Konfirmasi {mode === 'reject' ? 'Reject' : 'Revoke'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
