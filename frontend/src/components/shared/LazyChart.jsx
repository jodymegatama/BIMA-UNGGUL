import { lazy, Suspense } from 'react';

// Wrapper lazy-load untuk ApexCharts (944 kB / gzip 268 kB).
// react-apexcharts di-impor dinamis supaya chunk vendor hanya didownload
// saat komponen chart benar-benar dirender (bukan saat entry app / halaman non-chart).
const Chart = lazy(() => import('react-apexcharts'));

export default function LazyChart(props) {
  return (
    <Suspense
      fallback={
        <div className="h-[300px] w-full animate-pulse rounded-[12px] bg-zinc-100" />
      }
    >
      <Chart {...props} />
    </Suspense>
  );
}
