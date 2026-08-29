import LazyChart from '../../shared/LazyChart';
import { ChartBar, Info } from 'phosphor-react';
import { formatSkor } from '../../../lib/format';

/**
 * LeaderboardChart — horizontal bar Top 10 (ApexCharts, pilihan Phase 1)
 * Warna eager #58cc02 untuk bar, spark #1cb0f6 untuk aksen, story wash tidak dipakai di chart
 */
export default function LeaderboardChart({ data = [] }) {
  const top10 = data.slice(0, 10);
  const categories = top10.map((d) => d.nama);
  const scores = top10.map((d) => d.skor);

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Nunito Sans, ui-sans-serif, system-ui, sans-serif',
      animations: { enabled: true, easing: 'easeinout', speed: 700 },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '62%',
        borderRadius: 8,
        borderRadiusApplication: 'end',
        distributed: false,
      },
    },
    colors: ['#58cc02'],
    fill: { type: 'solid', opacity: 1 },
    dataLabels: {
      enabled: true,
      formatter: (val) => formatSkor(val),
      style: { fontSize: '11px', fontWeight: 800, colors: ['#fff'] },
      offsetX: -8,
    },
    grid: {
      show: true,
      borderColor: '#f4f4f5',
      strokeDashArray: 0,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      labels: { style: { fontSize: '11px', fontWeight: 700, colors: '#777777' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        show: true,
        style: { fontSize: '11px', fontWeight: 800, colors: '#4b4b4b' },
        formatter: (val) => {
          const s = String(val);
          return s.length > 18 ? s.slice(0, 18) + '…' : s;
        },
      },
    },
    tooltip: {
      y: { formatter: (val, { dataPointIndex }) => `${formatSkor(val)} poin • ${top10[dataPointIndex]?.approved ?? 0} capaian` },
    },
    legend: { show: false },
  };

  const series = [{ name: 'Total skor', data: scores }];

  return (
    <div className="rounded-[16px] border-2 border-zinc-200 bg-white overflow-hidden shadow-card">
      <div className="px-5 h-[56px] flex items-center justify-between border-b-2 border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
            <ChartBar size={16} weight="regular" color="#777777" />
          </span>
          <div>
            <div className="text-[13px] font-black text-charcoal leading-none">Top 10 — Grafik skor</div>
            <div className="text-[11px] font-bold text-pencil">Horizontal bar berdasarkan total skor</div>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border-2 border-zinc-200 text-[11px] font-black text-pencil">
          <Info size={12} weight="regular" /> Skor = Σ capaian × bobot
        </span>
      </div>

      <div className="p-4 lg:p-5">
        <LazyChart options={options} series={series} type="bar" height={360} />
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-faded border-t-2 border-dashed border-zinc-100 pt-3">
          <Info size={14} weight="regular" color="#afafaf" />
          Tie-breaker: skor → jumlah approved → waktu capai skor → BMU ID. Grafik hanya visual; urutan tabel adalah sumber kebenaran.
        </div>
      </div>
    </div>
  );
}
