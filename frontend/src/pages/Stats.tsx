import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/client';
import { useState, useEffect } from 'react';

function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

const COLORS = ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#065f46', '#064e3b', '#022c22'];

function ChartSkeleton() {
  return <div className="w-full h-[350px] bg-slate-100 rounded-xl animate-pulse dark:bg-slate-700" />;
}

// Pure CSS horizontal bar chart (no heavy chart lib)
function HBarChart({ data, labelKey = 'type', valueKey = 'count', color = '#047857' }: { data: any[]; labelKey?: string; valueKey?: string; color?: string }) {
  if (!data || data.length === 0) return <p className="text-[var(--color-muted)] text-sm">No data</p>;
  const max = Math.max(...data.map((d: any) => d[valueKey] || 0), 1);
  return (
    <div className="space-y-2">
      {data.map((d: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-32 md:w-40 text-xs text-[var(--color-muted)] truncate text-right shrink-0">{d[labelKey]}</div>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${Math.max((d[valueKey] / max) * 100, 2)}%`, background: color }}
            >
              <span className="text-[10px] font-bold text-white">{(d[valueKey] || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Pure SVG pie chart
function PieChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p className="text-[var(--color-muted)] text-sm">No data</p>;
  const total = data.reduce((s: number, d: any) => s + (d.count || 0), 0) || 1;
  let acc = 0;
  const r = 90;
  const cx = 100, cy = 100;
  const slices = data.map((d: any, i: number) => {
    const frac = (d.count || 0) / total;
    const start = acc;
    acc += frac;
    const a0 = start * 2 * Math.PI - Math.PI / 2;
    const a1 = acc * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = frac > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    return { path, color: COLORS[i % COLORS.length], label: d.level || d.name, value: d.count || 0 };
  });
  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <svg width="200" height="200" viewBox="0 0 200 200" className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1" />
        ))}
      </svg>
      <div className="space-y-1 text-sm">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div style={{ background: s.color, width: 12, height: 12, borderRadius: 3 }} />
            <span className="text-[var(--color-text)]">{s.label}</span>
            <span className="text-[var(--color-muted)] ml-auto">{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Stats() {
  const { data: overview, isLoading: loading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => statsApi.overview().then((r) => r.data),
  });
  const { data: byType = [] } = useQuery({
    queryKey: ['stats', 'by-type'],
    queryFn: () => statsApi.byType().then((r) => r.data),
  });
  const { data: byDivision = [] } = useQuery({
    queryKey: ['stats', 'by-division'],
    queryFn: () => statsApi.byDivision().then((r) => r.data),
  });
  const { data: byLevel = [] } = useQuery({
    queryKey: ['stats', 'by-level'],
    queryFn: () => statsApi.byLevel().then((r) => r.data),
  });
  const { data: topDistricts = [] } = useQuery({
    queryKey: ['stats', 'top-districts'],
    queryFn: () => statsApi.topDistricts().then((r) => r.data),
  });
  const { data: teacherDesignations = [] } = useQuery({
    queryKey: ['stats', 'teacher-designations'],
    queryFn: () => statsApi.teacherDesignations().then((r) => r.data),
  });
  const { data: districtStats = [] } = useQuery({
    queryKey: ['stats', 'districts'],
    queryFn: () => statsApi.districts().then((r) => r.data),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Statistics</h1>
        <p className="text-[var(--color-muted)] mt-1">Bangladesh educational institutes breakdown</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-2/3 mx-auto mb-2 dark:bg-slate-700" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto dark:bg-slate-700" />
            </div>
          ))
        ) : (
          overview && [
            { label: 'Total Institutes', value: overview.total_institutes },
            { label: 'Primary', value: overview.primary },
            { label: 'Post-Primary', value: overview.post_primary },
            { label: 'Teachers', value: overview.teachers_scraped },
          ].map(({ label, value }) => (
            <div key={label} className="card p-5 text-center">
              <p className="text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400"><CountUp value={value} /></p>
              <p className="text-sm text-[var(--color-muted)] mt-1">{label}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">By Institute Type</h2>
          {loading ? <ChartSkeleton /> : <HBarChart data={byType.slice(0, 10)} labelKey="type" />}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">By Level</h2>
          {loading ? <ChartSkeleton /> : <PieChart data={byLevel} />}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">By Division</h2>
        {loading ? <ChartSkeleton /> : <HBarChart data={byDivision} labelKey="division" color="#2563eb" />}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Top Districts by Institutes</h2>
          {loading ? <ChartSkeleton /> : <HBarChart data={topDistricts} labelKey="district" color="#7c3aed" />}
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Top Teacher Designations</h2>
          {loading ? <ChartSkeleton /> : <HBarChart data={teacherDesignations} labelKey="designation" color="#d97706" />}
        </div>
      </div>

      {/* District Dashboard */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">District Dashboard (All 64 Districts)</h2>
        {loading ? <ChartSkeleton /> : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--color-surface)]">
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">District</th>
                  <th className="py-2 px-3 text-right">Institutes</th>
                  <th className="py-2 px-3 text-right">Teachers</th>
                </tr>
              </thead>
              <tbody>
                {districtStats.map((d: any, i: number) => (
                  <tr key={d.district} className="border-b border-[var(--color-border)] hover:bg-[var(--color-border)]/20">
                    <td className="py-2 px-3 text-[var(--color-muted)]">{i + 1}</td>
                    <td className="py-2 px-3 font-medium text-[var(--color-text)]">{d.district}</td>
                    <td className="py-2 px-3 text-right text-[var(--color-muted)]">{(d.institutes || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-[var(--color-muted)]">{(d.teachers || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}