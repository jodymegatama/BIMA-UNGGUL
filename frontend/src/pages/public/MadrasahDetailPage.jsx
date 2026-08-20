import { useParams } from 'react-router-dom';

export default function MadrasahDetailPage() {
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-neutral-light p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-navy mb-4">Detail Madrasah: {slug}</h1>
        <p className="text-neutral-dark">Placeholder — Madrasah Detail Page</p>
      </div>
    </div>
  );
}
