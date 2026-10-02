/**
 * Single-flight — dedup permintaan asinkron yang berjalan bersamaan.
 *
 * Dua sumber duplikasi di app ini:
 *  1. React StrictMode (dev) menjalankan effect DUA KALI per mount, jadi setiap
 *     fetch di effect terjadi dobel (dan rantai fallback bisa jadi 4x).
 *  2. Beberapa komponen memuat sumber data yang sama secara paralel —
 *     `GET /api/operator/indikator` dipanggil OperatorContext, Dashboard, dan
 *     InputCapaian sekaligus saat halaman operator dibuka.
 *
 * Fetch dobel + setState bergantian menghasilkan render storm. Storm itulah yang
 * me-rebuild DOM di antara pointerdown dan click, sehingga klik pengguna tertelan
 * (lihat IndikatorTabs.onPointerDown). Mendup request-nya menghilangkan akarnya.
 *
 * PENTING: yang di-dedup adalah PROMISE-nya, bukan hasilnya. Setiap pemanggil
 * tetap menerapkan hasil di bawah guard-nya sendiri (`ignore` flag per effect),
 * sehingga mount yang sudah dibersihkan tidak ikut menulis state.
 *
 * KONTRAK: bungkus hanya request mentah (mis. `() => apiFetch(url)`). JANGAN
 * membungkus fungsi yang di dalamnya sudah memanggil `run()` dengan key sama —
 * `run` akan mengembalikan promise milik pembungkus itu sendiri, sehingga promise
 * menunggu dirinya sendiri dan menggantung tanpa akhir. Contoh yang benar:
 * `fetchNotifications()` di lib/notifications.js sudah single-flight; pemanggilnya
 * cukup memanggilnya langsung.
 */
export function createSingleFlight() {
  const inFlight = new Map();

  /**
   * Jalankan `fn` sekali per `key` selama promise-nya belum selesai.
   * Pemanggil konkuren dengan key sama menerima promise yang sama.
   * `key == null` → selalu jalan (tanpa dedup).
   */
  function run(key, fn) {
    if (key == null) return Promise.resolve().then(fn);
    const existing = inFlight.get(key);
    if (existing) return existing;
    const p = Promise.resolve().then(fn);
    inFlight.set(key, p);
    const clear = () => {
      if (inFlight.get(key) === p) inFlight.delete(key);
    };
    p.then(clear, clear);
    return p;
  }

  return {
    run,
    /** Jumlah request yang sedang in-flight (dipakai test). */
    size: () => inFlight.size,
    /** Bersihkan registry — dipakai antar-test agar tidak bocor. */
    reset: () => inFlight.clear(),
  };
}

/** Registry bersama seluruh app — dua komponen konkuren berbagi satu request. */
export const sharedFlight = createSingleFlight();

/** Kunci standar untuk request GET yang idempoten. */
export function getKey(path) {
  return `GET ${path}`;
}

export default sharedFlight;
