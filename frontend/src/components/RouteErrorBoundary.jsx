import { Component } from 'react';

/**
 * ErrorBoundary global — menangkap chunk load failure (lazy route gagal dimuat:
 * network putus / deploy versi baru) + error render lain, tanpa white screen.
 * Retry = re-mount ulang subtree via key (memaksa React lazy coba import lagi).
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      /Failed to fetch dynamically imported module|Importing a module script failed|Loading CSS chunk/i.test(String(error?.message || ''));

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-[440px] w-full rounded-[16px] border-2 border-zinc-200 bg-white p-6 shadow-card text-center">
          <div className="text-[15px] font-black text-charcoal">
            {isChunkError ? 'Gagal memuat halaman' : 'Terjadi kesalahan'}
          </div>
          <p className="text-[12px] font-medium text-pencil mt-2 leading-5">
            {isChunkError
              ? 'Koneksi terputus atau aplikasi baru diperbarui. Muat ulang untuk mencoba lagi.'
              : String(error?.message || 'Kesalahan tak terduga.')}
          </p>
          <button
            type="button"
            onClick={() => {
              if (isChunkError) window.location.reload();
              else this.setState({ error: null });
            }}
            className="mt-4 h-10 px-5 rounded-[12px] bg-eager border-2 border-eager-dark text-white font-black text-[13px] shadow-sticker active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isChunkError ? 'Muat Ulang' : 'Coba Lagi'}
          </button>
        </div>
      </div>
    );
  }
}
