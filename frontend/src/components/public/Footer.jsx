import { Link } from 'react-router-dom';
import { Trophy, EnvelopeSimple, Phone, MapPin } from 'phosphor-react';
import { INDIKATORS } from '../../constants/indikator';

/**
 * Footer — ekstrak persis dari _backup/index.html <footer>
 * - 4 kolom grid lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr] dipertahankan
 * - Warna bg-eager + border-eager-dark, token duo radius, sticker shadow path tidak diubah
 * - Periode aktif dijadikan prop dynamic (default "2026/2027") untuk data API nanti
 * - Link publik → react-router <Link> (/leaderboard, /#indikator, /#metode, /#faq, /login, /daftar)
 * - Bottom bar year dynamic via new Date().getFullYear()
 */
export default function Footer({ activePeriod = '2026/2027' }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-eager border-t-2 border-eager-dark">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-10">
        <div className="grid lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr] gap-8">
          {/* Kol 1: identitas */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-white border-2 border-eager-dark flex items-center justify-center">
                <Trophy weight="fill" size={20} color="#58cc02" />
              </div>
              <div className="leading-none">
                <div className="font-display font-black text-[18px] text-white leading-none">BIMA UNGGUL</div>
                <div className="text-[11px] font-black tracking-wide text-white/80 uppercase">Bina Madrasah Unggul</div>
              </div>
            </div>
            <p className="text-[13px] leading-[1.6] font-bold text-white/90 mt-4 max-w-[36ch]">
              Sistem pemeringkatan capaian mutu madrasah berbasis bukti tervalidasi. Dikelola Seksi Pendidikan Madrasah Kankemenag Kabupaten
              Pasuruan.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white text-eager-dark font-black text-[12px] border-2 border-eager-dark">
              <span className="w-2 h-2 rounded-full bg-eager animate-pulse" aria-hidden="true" />
              Periode aktif {activePeriod}
            </div>
          </div>

          {/* Kol 2: Akses cepat */}
          <div>
            <div className="text-[11px] font-black tracking-wide uppercase text-white/70">Akses cepat</div>
            <ul className="mt-3 space-y-2 text-[13px] font-bold">
              <li>
                <Link to="/leaderboard" className="text-white hover:text-white/80 transition">
                  Leaderboard Publik
                </Link>
              </li>
              <li>
                <Link to="/#indikator" className="text-white hover:text-white/80 transition">
                  {INDIKATORS.length} Indikator Mutu
                </Link>
              </li>
              <li>
                <Link to="/#metode" className="text-white hover:text-white/80 transition">
                  Cara Kerja &amp; Bobot
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="text-white hover:text-white/80 transition">
                  Bantuan
                </Link>
              </li>
            </ul>
          </div>

          {/* Kol 3: Untuk operator */}
          <div>
            <div className="text-[11px] font-black tracking-wide uppercase text-white/70">Untuk operator</div>
            <ul className="mt-3 space-y-2 text-[13px] font-bold">
              <li>
                <Link to="/login" className="text-white hover:text-white/80 transition">
                  Masuk
                </Link>
              </li>
              <li>
                <Link to="/daftar" className="text-white hover:text-white/80 transition">
                  Daftar akun Operator
                </Link>
              </li>
              <li>
                <Link to="/#indikator" className="text-white hover:text-white/80 transition">
                  Panduan input capaian
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-white hover:text-white/80 transition">
                  Status validasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Kol 4: Kontak */}
          <div>
            <div className="text-[11px] font-black tracking-wide uppercase text-white/70">Kontak</div>
            <div className="mt-3 text-[13px] font-bold leading-relaxed text-white">
              Seksi Pendidikan Madrasah
              <br />
              Kantor Kementerian Agama
              <br />
              Kabupaten Pasuruan
              <br />
              <span className="text-white/80 font-medium">Jl. Dokter Wahidin Sudiro Husodo No.5, Pekuncen, Kec. Panggungrejo, Kota Pasuruan, Jawa Timur</span>
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href="#"
                aria-label="Email"
                className="w-9 h-9 rounded-full bg-white border-2 border-eager-dark flex items-center justify-center text-eager hover:brightness-95 transition"
              >
                <EnvelopeSimple size={16} weight="regular" />
              </a>
              <a
                href="#"
                aria-label="Telepon"
                className="w-9 h-9 rounded-full bg-white border-2 border-eager-dark flex items-center justify-center text-eager hover:brightness-95 transition"
              >
                <Phone size={16} weight="regular" />
              </a>
              <a
                href="#"
                aria-label="Lokasi"
                className="w-9 h-9 rounded-full bg-white border-2 border-eager-dark flex items-center justify-center text-eager hover:brightness-95 transition"
              >
                <MapPin size={16} weight="regular" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] font-bold text-white/90">
          <span>© {year} Kankemenag Kabupaten Pasuruan. Seluruh hak dilindungi.</span>
          <span className="inline-flex items-center gap-2">
            Dibuat dengan <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" /> untuk mutu madrasah yang terukur.
          </span>
        </div>
      </div>
    </footer>
  );
}
