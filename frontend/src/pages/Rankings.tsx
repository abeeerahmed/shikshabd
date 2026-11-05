import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reviewsApi } from '../api/client';
import { Trophy, Star, MapPin } from 'lucide-react';

export function Rankings() {
  const [division, setDivision] = useState('');
  const [type, setType] = useState('');

  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['rankings', division, type],
    queryFn: () => reviewsApi.rankings({ division: division || undefined, type: type || undefined, limit: 30 }).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Top Rated Schools</h1>
        <p className="text-[var(--color-muted)] mt-1">Schools ranked by community reviews</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={division} onChange={(e) => setDivision(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)]">
          <option value="">All Divisions</option>
          {['Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text)]">
          <option value="">All Types</option>
          {['School', 'College', 'Madrasah', 'School & College', 'Technical Institute'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-2/3 mb-2 dark:bg-slate-700" />
              <div className="h-3 bg-slate-100 rounded w-1/2 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-muted)]">
          <Trophy size={48} className="mx-auto mb-3 opacity-30" />
          <p>No reviews yet. Be the first to review a school!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.map((r: any, i: number) => (
            <Link
              key={r.eiin_or_code}
              to={`/institutes/${r.eiin_or_code}`}
              className="card p-4 flex items-center gap-4 group hover:border-emerald-500 transition"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--color-text)] group-hover:text-emerald-700 transition-colors truncate">{r.institute_name}</h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 flex items-center gap-1">
                  <MapPin size={10} /> {r.district}, {r.division} · {r.institute_type}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-[var(--color-text)]">{Number(r.avg_rating).toFixed(1)}</span>
                </div>
                <p className="text-xs text-[var(--color-muted)]">{r.review_count} review{r.review_count !== 1 ? 's' : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}