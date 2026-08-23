/**
 * LeaderboardPage — placeholder di bawah PublicLayout
 * Navbar harus menampilkan pill eager-filled pada item "Lihat Peringkat" saat di route ini.
 */
export default function LeaderboardPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-10 lg:py-12">
      <div className="rounded-[16px] border-2 border-zinc-200 bg-white p-6 lg:p-8">
        <h1 className="font-display font-black tracking-tight text-[28px] lg:text-[32px] text-charcoal">Leaderboard — placeholder</h1>
        <p className="text-[14px] leading-6 text-pencil font-medium mt-2">
          Halaman ini sudah di dalam <code className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs font-bold">PublicLayout</code>.
          Verifikasi: Navbar item &ldquo;Lihat Peringkat&rdquo; harus filled <span className="inline-block w-3 h-3 rounded-full bg-eager border border-eager-dark align-middle" /> eager-green.
        </p>
      </div>
    </div>
  );
}
