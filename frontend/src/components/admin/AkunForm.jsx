import { useState } from 'react';
import { X, Buildings, ShieldCheck } from 'phosphor-react';

/**
 * AkunForm — modal create/edit akun operator/admin.
 * Mode create: NIP + password wajib. Mode edit: NIP readonly, password opsional.
 * Props: { onClose, onSubmit, initial = null, madrasahList = [], submitLabel }
 */
export default function AkunForm({ onClose, onSubmit, initial = null, madrasahList = [], submitLabel = 'Buat Akun' }) {
  const isEdit = Boolean(initial);
  const [nip, setNip] = useState(initial?.nip ?? '');
  const [name, setName] = useState(initial?.nama ?? '');
  const [email, setEmail] = useState(initial?._raw?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initial?._raw?.role ?? 'operator');
  const [madrasahId, setMadrasahId] = useState(initial?.madrasahId ? String(initial.madrasahId) : '');
  const [status, setStatus] = useState(initial?.status === 'Menunggu' ? 'menunggu' : initial?.status === 'Nonaktif' ? 'nonaktif' : 'aktif');
  const [err, setErr] = useState({});

  const handle = () => {
    const e = {};
    if (!nip.trim()) e.nip = 'NIP wajib';
    else if (!/^\d{8,18}$/.test(nip.trim())) e.nip = 'NIP harus 8–18 digit angka';
    if (!name.trim()) e.name = 'Nama wajib';
    if (!email.trim()) e.email = 'Email wajib';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Format email tidak valid';
    if (!isEdit && !password) e.password = 'Password wajib (min 8 karakter)';
    else if (password && password.length < 8) e.password = 'Password minimal 8 karakter';
    setErr(e);
    if (Object.keys(e).length) return;

    const payload = { nip: nip.trim(), name: name.trim(), email: email.trim(), role, status };
    if (password) payload.password = password;
    if (madrasahId) payload.madrasahId = String(madrasahId);
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[540px] rounded-[16px] border-2 border-zinc-200 bg-white shadow-float overflow-hidden">
        <div className="h-12 px-5 flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
          <h3 className="font-display font-black text-[15px] text-charcoal">{isEdit ? 'Edit Akun' : 'Tambah Akun'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-50 hover:border-zinc-300 active:translate-y-[1px] transition"><X size={14} weight="bold" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="akun-nip" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">NIP <span className="text-red-600">*</span></label>
              <input
                id="akun-nip" name="nip" type="text" inputMode="numeric" autoComplete="off"
                value={nip}
                onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 18))}
                placeholder="197812345678900001"
                className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 ${err.nip ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
              />
              {err.nip && <div className="text-[11px] font-bold text-red-600 mt-1">{err.nip}</div>}
            </div>
            <div>
              <label htmlFor="akun-name" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Nama <span className="text-red-600">*</span></label>
              <input
                id="akun-name" name="name" type="text" autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 ${err.name ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
              />
              {err.name && <div className="text-[11px] font-bold text-red-600 mt-1">{err.name}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="akun-email" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Email <span className="text-red-600">*</span></label>
              <input
                id="akun-email" name="email" type="email" autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@madrasah.sch.id"
                className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 ${err.email ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
              />
              {err.email && <div className="text-[11px] font-bold text-red-600 mt-1">{err.email}</div>}
            </div>
            <div>
              <label htmlFor="akun-password" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Password {isEdit ? '(opsional)' : <span className="text-red-600">*</span>}</label>
              <input
                id="akun-password" name="password" type="password" autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
                className={`mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 bg-white text-[13px] font-bold text-charcoal placeholder:text-faded focus:outline-none focus:ring-2 ${err.password ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:border-ink focus:ring-zinc-200'}`}
              />
              {err.password && <div className="text-[11px] font-bold text-red-600 mt-1">{err.password}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="akun-role" className="block text-[11px] font-black tracking-wide text-charcoal uppercase flex items-center gap-1"><ShieldCheck size={12} /> Role</label>
              <select
                id="akun-role" name="role" value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 border-zinc-200 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 focus:border-ink focus:ring-zinc-200"
              >
                <option value="operator">Operator Madrasah</option>
                <option value="admin">Admin Seksi Pendma</option>
              </select>
            </div>
            <div>
              <label htmlFor="akun-madrasah" className="block text-[11px] font-black tracking-wide text-charcoal uppercase flex items-center gap-1"><Buildings size={12} /> Madrasah (opsional)</label>
              <select
                id="akun-madrasah" name="madrasahId" value={madrasahId}
                onChange={(e) => setMadrasahId(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 border-zinc-200 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 focus:border-ink focus:ring-zinc-200"
              >
                <option value="">— Tanpa madrasah —</option>
                {madrasahList.map((m) => (
                  <option key={m.id} value={m.id}>{m.nomorMadrasah} • {m.namaMadrasah}</option>
                ))}
              </select>
            </div>
          </div>

          {isEdit && (
            <div>
              <label htmlFor="akun-status" className="block text-[11px] font-black tracking-wide text-charcoal uppercase">Status</label>
              <select
                id="akun-status" name="status" value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-[12px] border-2 border-zinc-200 bg-white text-[13px] font-bold text-charcoal focus:outline-none focus:ring-2 focus:border-ink focus:ring-zinc-200"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          )}

          <div className="rounded-[12px] bg-zinc-50 border-2 border-zinc-100 p-3 flex gap-2">
            <ShieldCheck size={16} weight="regular" color="#777777" className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-5 font-medium text-pencil">
              {isEdit
                ? 'NIP dapat diubah — wajib unik. Password kosong = tetap. Status nonaktif akan menolak login.'
                : 'Akun baru berstatus <b>Aktif</b> langsung (admin membuat). Nonaktif hanya via data akun.'}
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 h-10 rounded-full bg-white border-2 border-zinc-200 text-[13px] font-black hover:border-charcoal active:translate-y-[1px] transition">Batal</button>
            <button onClick={handle} className="flex-1 h-10 rounded-full bg-ink text-white border-2 border-black text-[13px] font-black shadow-[0_4px_0_0_#000437] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-none transition">{submitLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
