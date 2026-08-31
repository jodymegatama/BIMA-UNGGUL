import LazyChart from '../../shared/LazyChart';
import { ChartBar } from 'phosphor-react';
import { INDIKATORS } from '../../../constants/indikator';
import useTheme from '../../../hooks/useTheme';

/**
 * IndikatorChart — radar 9 indikator (ApexCharts). Fallback bar jika radar tidak cocok di mobile, tapi radar default.
 * Warna eager #58cc02 (fill), spark #1cb0f6 untuk stroke alternatif? Kita pakai eager solid + story wash.
 */
export default function IndikatorChart({ data = [] }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const categories = data.map((d) => d.short);
  const scores = data.map((d) => d.skor);

  const options = {
    theme: { mode: dark ? 'dark' : 'light' },
    chart: {
      type: 'radar',
      toolbar: { show: false },
      fontFamily: 'Nunito Sans, ui-sans-serif, system-ui, sans-serif',
      animations: { enabled: true, speed: 600 },
    },
    colors: ['#58cc02'],
    fill: { opacity: 0.18, colors: ['#58cc02'] },
    stroke: { show: true, width: 2, colors: ['#58cc02'] },
    markers: { size: 4, colors: ['#58cc02'], strokeColors: '#4caf00', strokeWidth: 2 },
    xaxis: {
      categories,
      labels: {
        show: true,
        style: { fontSize: '10px', fontWeight: 800, colors: dark ? '#a6afcc' : '#4b4b4b' },
      },
    },
    yaxis: { show: false, min: 0 },
    grid: { show: true },
    tooltip: { y: { formatter: (val) => `${val} poin` } },
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: dark ? '#2b3560' : '#e4e4e7',
          fill: { colors: dark ? ['#161c36', '#141a33'] : ['#ffffff', '#f9fafb'] },
        },
      },
    },
  };

  const series = [{ name: 'Skor', data: scores }];

  // Bar alternative for small screens is handled via responsive CSS, but we keep radar as primary.
  // Provide also a bar fallback hidden on desktop? For simplicity we only show radar; ApexCharts radar is readable.

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      <div className="px-5 h-[56px] flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
            <ChartBar size={16} weight="regular" color="#777777" />
          </span>
          <div>
            <div className="text-[13px] font-black text-charcoal leading-none">Skor {INDIKATORS.length} indikator</div>
            <div className="text-[11px] font-bold text-pencil">Radar — distribusi per indikator</div>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center shrink-0 h-7 px-3 rounded-full bg-story border-2 border-[#b8eb8a] text-[11px] font-black text-eager-dark whitespace-nowrap">
          Total {scores.reduce((a, b) => a + b, 0)} poin
        </span>
      </div>
      <div className="p-4 lg:p-5">
        <LazyChart key={theme} options={options} series={series} type="radar" height={360} />
        <div className="mt-2 text-[11px] font-bold text-faded text-center">Semakin luas area hijau, semakin merata capaian. Skor = Σ capaian disetujui × bobot.</div>
      </div>
    </div>
  );
}
